-- Add 30 verified test entrants and a complete prediction set for the 2027 tournament.
-- The operation is idempotent for the fixed test email addresses.

DO $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM "Match" AS m
    INNER JOIN "Tournament" AS t ON t."id" = m."tournamentId"
    WHERE t."year" = 2027
  ) <> 15 THEN
    RAISE EXCEPTION 'Expected exactly 15 fixtures for the 2027 tournament';
  END IF;
END $$;

WITH test_users("firstName", "lastName", "email", sequence_number) AS (
  VALUES
    ('Liam', 'Murphy', 'seandurcan+prefectxv1@gmail.com', 1),
    ('Aoife', 'Kelly', 'seandurcan+prefectxv2@gmail.com', 2),
    ('Conor', 'Byrne', 'seandurcan+prefectxv3@gmail.com', 3),
    ('Niamh', 'Walsh', 'seandurcan+prefectxv4@gmail.com', 4),
    ('Cian', 'Ryan', 'seandurcan+prefectxv5@gmail.com', 5),
    ('Saoirse', 'O''Brien', 'seandurcan+prefectxv6@gmail.com', 6),
    ('Oisin', 'O''Connor', 'seandurcan+prefectxv7@gmail.com', 7),
    ('Ciara', 'Doyle', 'seandurcan+prefectxv8@gmail.com', 8),
    ('Darragh', 'McCarthy', 'seandurcan+prefectxv9@gmail.com', 9),
    ('Maeve', 'Gallagher', 'seandurcan+prefectxv10@gmail.com', 10),
    ('Ronan', 'Kennedy', 'seandurcan+prefectxv11@gmail.com', 11),
    ('Aisling', 'Lynch', 'seandurcan+prefectxv12@gmail.com', 12),
    ('Eoin', 'Murray', 'seandurcan+prefectxv13@gmail.com', 13),
    ('Orla', 'Quinn', 'seandurcan+prefectxv14@gmail.com', 14),
    ('Fionn', 'Moore', 'seandurcan+prefectxv15@gmail.com', 15),
    ('Clodagh', 'McLoughlin', 'seandurcan+prefectxv16@gmail.com', 16),
    ('Patrick', 'Carroll', 'seandurcan+prefectxv17@gmail.com', 17),
    ('Emma', 'Connolly', 'seandurcan+prefectxv18@gmail.com', 18),
    ('Declan', 'Daly', 'seandurcan+prefectxv19@gmail.com', 19),
    ('Grainne', 'Fitzgerald', 'seandurcan+prefectxv20@gmail.com', 20),
    ('Shane', 'Nolan', 'seandurcan+prefectxv21@gmail.com', 21),
    ('Caoimhe', 'Flynn', 'seandurcan+prefectxv22@gmail.com', 22),
    ('Brian', 'Power', 'seandurcan+prefectxv23@gmail.com', 23),
    ('Roisin', 'Kavanagh', 'seandurcan+prefectxv24@gmail.com', 24),
    ('Colm', 'Casey', 'seandurcan+prefectxv25@gmail.com', 25),
    ('Siobhan', 'Healy', 'seandurcan+prefectxv26@gmail.com', 26),
    ('Aidan', 'Reilly', 'seandurcan+prefectxv27@gmail.com', 27),
    ('Deirdre', 'McGrath', 'seandurcan+prefectxv28@gmail.com', 28),
    ('Kevin', 'Brennan', 'seandurcan+prefectxv29@gmail.com', 29),
    ('Fiona', 'Sweeney', 'seandurcan+prefectxv30@gmail.com', 30)
),
base_order AS (
  SELECT COALESCE(MAX("registrationOrder"), 0) AS value
  FROM "User"
  WHERE "email" NOT LIKE 'seandurcan+prefectxv%@gmail.com'
)
INSERT INTO "User" (
  "firstName",
  "lastName",
  "email",
  "mobile",
  "passwordHash",
  "role",
  "paymentStatus",
  "emailVerified",
  "paidAt",
  "registrationOrder",
  "predictionsSubmitted",
  "predictionSubmittedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  test_users."firstName",
  test_users."lastName",
  test_users."email",
  '+353 89 263 0893',
  '$2b$12$wea5vEBq.S1/f1UG37pftebH6/cFazxt.QB4fEEEgX4ujFLgA14c6',
  'USER'::"UserRole",
  'COMPLETED'::"PaymentStatus",
  TRUE,
  CURRENT_TIMESTAMP,
  base_order.value + test_users.sequence_number,
  FALSE,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM test_users
CROSS JOIN base_order
ON CONFLICT ("email") DO UPDATE SET
  "firstName" = EXCLUDED."firstName",
  "lastName" = EXCLUDED."lastName",
  "mobile" = EXCLUDED."mobile",
  "passwordHash" = EXCLUDED."passwordHash",
  "role" = 'USER'::"UserRole",
  "paymentStatus" = 'COMPLETED'::"PaymentStatus",
  "emailVerified" = TRUE,
  "paidAt" = COALESCE("User"."paidAt", CURRENT_TIMESTAMP),
  "deletedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP;

WITH test_users("email") AS (
  SELECT 'seandurcan+prefectxv' || number || '@gmail.com'
  FROM generate_series(1, 30) AS number
),
tournament_matches AS (
  SELECT m."id"
  FROM "Match" AS m
  INNER JOIN "Tournament" AS t ON t."id" = m."tournamentId"
  WHERE t."year" = 2027
)
INSERT INTO "Prediction" (
  "userId",
  "matchId",
  "predictedHomeScore",
  "predictedAwayScore",
  "pointsAwarded",
  "errorValue",
  "differenceScore",
  "exactScore",
  "correctMargin",
  "correctResult",
  "createdAt",
  "updatedAt"
)
SELECT
  u."id",
  tournament_matches."id",
  FLOOR(RANDOM() * 41)::INTEGER,
  FLOOR(RANDOM() * 41)::INTEGER,
  0,
  0,
  0,
  FALSE,
  FALSE,
  FALSE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM test_users
INNER JOIN "User" AS u ON u."email" = test_users."email"
CROSS JOIN tournament_matches
ON CONFLICT ("userId", "matchId") DO NOTHING;

WITH test_users("email") AS (
  SELECT 'seandurcan+prefectxv' || number || '@gmail.com'
  FROM generate_series(1, 30) AS number
)
UPDATE "User" AS u
SET
  "predictionsSubmitted" = TRUE,
  "predictionSubmittedAt" = COALESCE(u."predictionSubmittedAt", CURRENT_TIMESTAMP),
  "updatedAt" = CURRENT_TIMESTAMP
FROM test_users
WHERE u."email" = test_users."email"
  AND (
    SELECT COUNT(*)
    FROM "Prediction" AS p
    INNER JOIN "Match" AS m ON m."id" = p."matchId"
    INNER JOIN "Tournament" AS t ON t."id" = m."tournamentId"
    WHERE p."userId" = u."id"
      AND t."year" = 2027
  ) = 15;
