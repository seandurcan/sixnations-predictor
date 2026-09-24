-- Allow multiple competitions to share a calendar/season start year.
DROP INDEX IF EXISTS "Tournament_year_key";
CREATE UNIQUE INDEX "Tournament_name_year_key" ON "Tournament"("name", "year");
