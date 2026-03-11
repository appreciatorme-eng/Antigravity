# Test Credentials

## QA Admin Account (for automated testing)

| Field | Value |
|-------|-------|
| Email | qa-admin@antigravity.dev |
| Password | QaAdmin2026! |
| Role | admin |
| Org | GoBuddy Admin Organization |
| User ID | 24975f5d-1dcd-460f-b7c1-803d480c5b95 |
| Org ID | c498cecc-9aaa-4a37-a26e-fe591e065ac9 |

Use this account for all playwright-cli QA flows (Tier 1–4 in qa-flows.md).
Account is email-confirmed and onboarding-complete — logs straight into /admin.

## QA Client Account

| Field | Value |
|-------|-------|
| Email | qa-client@antigravity.dev |
| Password | QaClient2026! |
| Role | client |
| User ID | 9dfb7b08-f89c-4ad7-a80b-9f28d5eaa2eb |
| Org ID | c498cecc-9aaa-4a37-a26e-fe591e065ac9 |

## QA Driver Account

| Field | Value |
|-------|-------|
| Email | qa-driver@antigravity.dev |
| Password | QaDriver2026! |
| Role | driver |
| Org ID | c498cecc-9aaa-4a37-a26e-fe591e065ac9 |

## QA Super Admin Account (God Mode)

| Field | Value |
|-------|-------|
| Email | qa-superadmin@antigravity.dev |
| Password | QaSuperAdmin2026! |
| Role | super_admin |
| User ID | e63e8036-d04b-4c86-894b-5ff4e01e43a5 |
| Org ID | c498cecc-9aaa-4a37-a26e-fe591e065ac9 |

Used for `e2e/tests/god.spec.ts` — tests all 13 god-mode pages under `/god/*`.
Account is email-confirmed, onboarding-complete, and `role: super_admin` in profiles.
