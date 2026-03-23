# Leaked Password Protection

## Status: NEEDS MANUAL TOGGLE

Supabase Auth supports checking passwords against HaveIBeenPwned.org.
This is currently **disabled** and needs to be enabled in the Supabase dashboard.

### How to enable:
1. Go to Supabase Dashboard -> Authentication -> Providers -> Email
2. Enable "Leaked Password Protection"
3. This checks new passwords against the HaveIBeenPwned database
4. Users with compromised passwords will be prompted to change them

### Reference:
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
