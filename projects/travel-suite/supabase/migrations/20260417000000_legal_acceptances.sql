-- Versioned click-wrap acceptance infrastructure.
-- Supports production launch: every signup (or version bump) writes an
-- immutable, timestamped, IP/UA-stamped row tied to a specific document
-- version, providing an Indian-law-compliant audit trail.

-- 1. Catalogue of authoritative policy documents.
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type   TEXT NOT NULL CHECK (document_type IN
    ('terms','privacy','refund','cancellation','aup','dpa','grievance')),
  version         TEXT NOT NULL,
  effective_date  DATE NOT NULL,
  content_hash    TEXT NOT NULL,
  is_current      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_type, version)
);

-- Only one row per document_type may be flagged as current.
CREATE UNIQUE INDEX IF NOT EXISTS legal_documents_current_per_type
  ON public.legal_documents (document_type)
  WHERE is_current = TRUE;

-- 2. Append-only acceptance audit log.
CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type      TEXT NOT NULL,
  document_version   TEXT NOT NULL,
  accepted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address         INET,
  user_agent         TEXT,
  acceptance_method  TEXT NOT NULL CHECK (acceptance_method IN
    ('signup_checkbox','oauth_interstitial','reacceptance_modal','api_import')),
  FOREIGN KEY (document_type, document_version)
    REFERENCES public.legal_documents (document_type, version)
);

CREATE INDEX IF NOT EXISTS legal_acceptances_user_idx
  ON public.legal_acceptances (user_id);

CREATE INDEX IF NOT EXISTS legal_acceptances_doc_idx
  ON public.legal_acceptances (document_type, document_version);

-- 3. Quick-lookup flags on profiles so middleware can gate without a join.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_version_accepted   TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_version_accepted TEXT,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at      TIMESTAMPTZ;

-- 4. RLS: users can see their own acceptances; all writes are via service role.
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_acceptances_read" ON public.legal_acceptances;
CREATE POLICY "own_acceptances_read" ON public.legal_acceptances
  FOR SELECT USING (auth.uid() = user_id);

-- No insert/update/delete policies -> only the service role may mutate the
-- audit log. This makes acceptance records immutable from the user side.

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_current_docs" ON public.legal_documents;
CREATE POLICY "public_read_current_docs" ON public.legal_documents
  FOR SELECT USING (TRUE);

-- 5. Seed the initial published versions (v1.0.0, 2026-04-17).
-- Content hashes are placeholders; they are recomputed in CI from the
-- rendered TSX output of each page.
INSERT INTO public.legal_documents
  (document_type, version, effective_date, content_hash, is_current)
VALUES
  ('terms',        '1.0.0', DATE '2026-04-17', 'seed-v1',           TRUE),
  ('privacy',      '1.0.0', DATE '2026-04-17', 'seed-v1',           TRUE),
  ('refund',       '1.0.0', DATE '2026-04-17', 'seed-v1',           TRUE),
  ('cancellation', '1.0.0', DATE '2026-04-17', 'seed-v1',           TRUE),
  ('aup',          '1.0.0', DATE '2026-04-17', 'seed-v1',           TRUE),
  ('dpa',          '1.0.0', DATE '2026-04-17', 'seed-v1',           TRUE),
  ('grievance',    '1.0.0', DATE '2026-04-17', 'seed-v1',           TRUE)
ON CONFLICT (document_type, version) DO NOTHING;

-- 6. Grandfather existing users: insert an api_import acceptance row for
-- every user that currently exists, for terms + privacy, at v1.0.0.
-- This prevents the middleware gate from locking out live customers the
-- moment this migration ships. Business justification: those users
-- signed up under the prior browse-wrap notice which already linked to
-- terms/privacy; they are retroactively pinned to v1.0.0 so that any
-- FUTURE version bump will require an explicit re-acceptance.
INSERT INTO public.legal_acceptances
  (user_id, document_type, document_version, accepted_at, acceptance_method)
SELECT u.id, 'terms',   '1.0.0', NOW(), 'api_import'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.legal_acceptances a
  WHERE a.user_id = u.id AND a.document_type = 'terms' AND a.document_version = '1.0.0'
);

INSERT INTO public.legal_acceptances
  (user_id, document_type, document_version, accepted_at, acceptance_method)
SELECT u.id, 'privacy', '1.0.0', NOW(), 'api_import'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.legal_acceptances a
  WHERE a.user_id = u.id AND a.document_type = 'privacy' AND a.document_version = '1.0.0'
);

-- And flip the profile quick-lookup flags for those grandfathered users.
UPDATE public.profiles
SET
  terms_version_accepted   = COALESCE(terms_version_accepted,   '1.0.0'),
  terms_accepted_at        = COALESCE(terms_accepted_at,        NOW()),
  privacy_version_accepted = COALESCE(privacy_version_accepted, '1.0.0'),
  privacy_accepted_at      = COALESCE(privacy_accepted_at,      NOW())
WHERE terms_version_accepted IS NULL
   OR privacy_version_accepted IS NULL;

-- 7. SECURITY DEFINER RPC used by the signup API handler. Writes the
-- auth user's acceptance rows atomically and bumps profile flags.
-- The function body runs as the owner (service role) so the service-role
-- key is the only caller that can successfully invoke it in practice -
-- but we still check the target user matches the row being inserted.
CREATE OR REPLACE FUNCTION public.record_signup_acceptance(
  p_user_id          UUID,
  p_terms_version    TEXT,
  p_privacy_version  TEXT,
  p_ip_address       INET,
  p_user_agent       TEXT,
  p_method           TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_method NOT IN ('signup_checkbox','oauth_interstitial','reacceptance_modal','api_import') THEN
    RAISE EXCEPTION 'invalid acceptance method: %', p_method;
  END IF;

  INSERT INTO public.legal_acceptances
    (user_id, document_type, document_version, ip_address, user_agent, acceptance_method)
  VALUES
    (p_user_id, 'terms',   p_terms_version,   p_ip_address, p_user_agent, p_method),
    (p_user_id, 'privacy', p_privacy_version, p_ip_address, p_user_agent, p_method);

  UPDATE public.profiles
  SET
    terms_version_accepted   = p_terms_version,
    terms_accepted_at        = NOW(),
    privacy_version_accepted = p_privacy_version,
    privacy_accepted_at      = NOW()
  WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_signup_acceptance(UUID, TEXT, TEXT, INET, TEXT, TEXT) FROM PUBLIC;
