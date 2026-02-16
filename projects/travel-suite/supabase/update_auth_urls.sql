-- Update Supabase Auth Redirect URLs
-- Run this in Supabase Dashboard > SQL Editor

-- This updates the auth configuration to allow redirects from the Vercel deployment
UPDATE auth.config
SET
  site_url = 'https://travelsuite-ipuv8ge1s-avinashs-projects-5f49190e.vercel.app',
  uri_allow_list = 'http://localhost:3000,http://localhost:3000/**,https://travelsuite-ipuv8ge1s-avinashs-projects-5f49190e.vercel.app,https://travelsuite-ipuv8ge1s-avinashs-projects-5f49190e.vercel.app/**'
WHERE true;

-- Verify the update
SELECT site_url, uri_allow_list FROM auth.config;
