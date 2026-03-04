-- Security fix: Drop overly permissive SELECT policy on shared_itineraries.
--
-- The "viewable when not expired" policy allows any authenticated (or anon) user
-- to enumerate ALL active share codes + recipient phone numbers via a full-table
-- SELECT. This is an information-disclosure / IDOR vector.
--
-- All server-side share-code lookups (share page, share API, feedback, reviews)
-- already use the service-role admin client which bypasses RLS entirely.
-- Client-side code (ShareModal, ShareTripModal) only queries own shares, which
-- are covered by the "Owners can view own shares" policy.
--
-- Therefore the broad policy is unnecessary and can be safely removed.

DROP POLICY IF EXISTS "Shared itineraries viewable when not expired" ON public.shared_itineraries;

-- Verify remaining policies are sufficient:
--   "Owners can view own shares"  (SELECT — via itineraries.user_id = auth.uid())
--   "Owners can delete own shares" (DELETE — same check)
--   INSERT policies (existing, for creating shares)
