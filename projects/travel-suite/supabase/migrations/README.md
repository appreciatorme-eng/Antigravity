# Supabase Migration History

## Placeholder Migrations

These files (`*_remote_migration_placeholder.sql`) represent schema changes that were
applied directly to the Supabase dashboard before this codebase tracked migrations in git.

Each placeholder records the timestamp of when the change was applied in production.
The actual SQL is not available in code history.

To audit what changed during each placeholder period, use `supabase db diff` against
a snapshot from before/after each placeholder date.

### Known Placeholders

| # | Filename | Date Applied |
|---|----------|-------------|
| 1 | `20260212155457_remote_migration_placeholder.sql` | 2026-02-12 15:54:57 |
| 2 | `20260212155459_remote_migration_placeholder.sql` | 2026-02-12 15:54:59 |
| 3 | `20260212155605_remote_migration_placeholder.sql` | 2026-02-12 15:56:05 |
| 4 | `20260212155609_remote_migration_placeholder.sql` | 2026-02-12 15:56:09 |
| 5 | `20260212155610_remote_migration_placeholder.sql` | 2026-02-12 15:56:10 |
| 6 | `20260213022206_remote_migration_placeholder.sql` | 2026-02-13 02:22:06 |
| 7 | `20260220220003_remote_migration_placeholder.sql` | 2026-02-20 22:00:03 |
| 8 | `20260220223416_remote_migration_placeholder.sql` | 2026-02-20 22:34:16 |
| 9 | `20260220230046_remote_migration_placeholder.sql` | 2026-02-20 23:00:46 |
| 10 | `20260220230150_remote_migration_placeholder.sql` | 2026-02-20 23:01:50 |
| 11 | `20260221143119_remote_migration_placeholder.sql` | 2026-02-21 14:31:19 |
| 12 | `20260221160655_remote_migration_placeholder.sql` | 2026-02-21 16:06:55 |
| 13 | `20260221164839_remote_migration_placeholder.sql` | 2026-02-21 16:48:39 |

Placeholders 1-6 were created during the initial migration tracking setup (Feb 12-13).
Placeholders 7-13 were created during a second batch of dashboard changes (Feb 20-21).

## Migration Naming Convention

Migrations follow the format: `YYYYMMDDHHMMSS_description.sql`

- Timestamps are UTC
- Descriptions use snake_case
- Migrations are applied in timestamp order by `supabase db push`
