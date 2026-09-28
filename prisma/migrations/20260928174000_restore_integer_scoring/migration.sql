ALTER TABLE "User"
ALTER COLUMN "totalPoints" TYPE INTEGER
USING ROUND("totalPoints")::INTEGER;

ALTER TABLE "CompetitionEntry"
ALTER COLUMN "totalPoints" TYPE INTEGER
USING ROUND("totalPoints")::INTEGER;

ALTER TABLE "Prediction"
ALTER COLUMN "pointsAwarded" TYPE INTEGER
USING ROUND("pointsAwarded")::INTEGER;

ALTER TABLE "LeaderboardSnapshot"
ALTER COLUMN "totalPoints" TYPE INTEGER
USING ROUND("totalPoints")::INTEGER;

ALTER TABLE "TournamentWinner"
ALTER COLUMN "finalPoints" TYPE INTEGER
USING ROUND("finalPoints")::INTEGER;
