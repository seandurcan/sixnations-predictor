-- Clean up the short-lived composite unique index if it was applied in preview/staging.
DROP INDEX IF EXISTS "Tournament_name_year_key";
