ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' or 'converted'
  reward_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referred_organization_id)
);

CREATE OR REPLACE FUNCTION generate_referral_code_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := substring(md5(random()::text) from 1 for 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_referral_code ON public.profiles;
CREATE TRIGGER ensure_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code_fn();

-- Update existing profiles without a referral_code
UPDATE public.profiles
SET referral_code = substring(md5(random()::text) from 1 for 8)
WHERE referral_code IS NULL;

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
CREATE POLICY "Users can view their own referrals"
  ON public.referrals FOR SELECT
  USING (referrer_profile_id = auth.uid());

-- Optional: Allow inserting if the system does it, or anyone via API with service role.
-- Since the user creates their org during signup, we will use a server-side route running as Service Role to link the referral. 

CREATE OR REPLACE FUNCTION update_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_referrals_updated_at_trigger ON public.referrals;
CREATE TRIGGER update_referrals_updated_at_trigger
BEFORE UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION update_referrals_updated_at();
