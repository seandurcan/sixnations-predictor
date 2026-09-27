import { PrismaClient } from '@prisma/client';

// Only the separate staging project's staging-branch deployment may repair data.
if (process.env.VERCEL_PROJECT_ID !== 'prj_bw5EAJac45HfO2utXKKvENAKhBfE' ||
    process.env.VERCEL_GIT_COMMIT_REF !== 'staging' || process.env.VERCEL_ENV !== 'production') {
  console.log('Skipping staging scoring data repair outside its designated project.');
} else {
  const db = new PrismaClient();
  try {
    await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '10s'");
      // Block concurrent result saves while derived scoring data is recalculated.
      await tx.$executeRawUnsafe('LOCK TABLE "Match", "Prediction", "CompetitionEntry", "User", "LeaderboardSnapshot", "TournamentWinner" IN SHARE ROW EXCLUSIVE MODE');
      const predictions = await tx.$executeRawUnsafe(`
        UPDATE "Prediction" p SET "pointsAwarded" =
          CASE WHEN sign(p."predictedHomeScore" - p."predictedAwayScore") = sign(m."actualHomeScore" - m."actualAwayScore") THEN 1 ELSE 0 END +
          CASE WHEN p."predictedHomeScore" - p."predictedAwayScore" = m."actualHomeScore" - m."actualAwayScore" THEN 2 ELSE 0 END +
          CASE WHEN p."predictedHomeScore" = m."actualHomeScore" AND p."predictedAwayScore" = m."actualAwayScore" THEN 3 ELSE 0 END
        FROM "Match" m WHERE p."matchId" = m.id AND m.completed = true AND m."actualHomeScore" IS NOT NULL AND m."actualAwayScore" IS NOT NULL`);
      await tx.$executeRawUnsafe(`UPDATE "CompetitionEntry" e SET "totalPoints" = COALESCE((
        SELECT SUM(p."pointsAwarded") FROM "Prediction" p JOIN "Match" m ON p."matchId" = m.id
        WHERE p."userId" = e."userId" AND m."tournamentId" = e."tournamentId" AND m.completed = true), 0)`);
      await tx.$executeRawUnsafe(`UPDATE "User" u SET "totalPoints" = e."totalPoints" FROM "CompetitionEntry" e
        WHERE e."userId" = u.id AND e."tournamentId" = (SELECT MAX(e2."tournamentId") FROM "CompetitionEntry" e2 WHERE e2."userId" = u.id AND e2.status = 'ENTERED')`);
      await tx.$executeRawUnsafe(`UPDATE "LeaderboardSnapshot" SET "totalPoints" = "correctResults" + 2 * "correctMargins" + 3 * "exactScores"`);
      await tx.$executeRawUnsafe(`WITH ranks AS (SELECT id, RANK() OVER (PARTITION BY "tournamentId", "snapshotNumber" ORDER BY "totalPoints" DESC, "correctResults" DESC, "exactScores" DESC, "correctMargins" DESC, "cumulativeError" ASC) AS position FROM "LeaderboardSnapshot") UPDATE "LeaderboardSnapshot" s SET rank = r.position FROM ranks r WHERE s.id = r.id`);
      await tx.$executeRawUnsafe(`WITH previous AS (SELECT s.id, p.rank AS previous_rank FROM "LeaderboardSnapshot" s LEFT JOIN "LeaderboardSnapshot" p ON p."tournamentId" = s."tournamentId" AND p."userId" = s."userId" AND p."snapshotNumber" = (SELECT MAX(q."snapshotNumber") FROM "LeaderboardSnapshot" q WHERE q."tournamentId" = s."tournamentId" AND q."snapshotNumber" < s."snapshotNumber")) UPDATE "LeaderboardSnapshot" s SET "previousRank" = p.previous_rank, "rankMovement" = p.previous_rank - s.rank FROM previous p WHERE s.id = p.id`);
      await tx.$executeRawUnsafe(`DELETE FROM "TournamentWinner" w USING "Tournament" t WHERE w."tournamentId" = t.id AND t.status = 'COMPLETED'`);
      await tx.$executeRawUnsafe(`WITH totals AS (
        SELECT e."tournamentId", e."userId", e."totalPoints", e."cumulativeError", e."exactScores",
          COUNT(p.id) FILTER (WHERE p."correctResult") AS results, COUNT(p.id) FILTER (WHERE p."correctMargin") AS margins
        FROM "CompetitionEntry" e JOIN "Tournament" t ON t.id = e."tournamentId" JOIN "User" u ON u.id = e."userId"
        LEFT JOIN "Match" m ON m."tournamentId" = e."tournamentId" AND m.completed = true LEFT JOIN "Prediction" p ON p."matchId" = m.id AND p."userId" = e."userId"
        WHERE t.status = 'COMPLETED' AND e.status = 'ENTERED' AND u."deletedAt" IS NULL GROUP BY e.id
      ), ranked AS (SELECT *, RANK() OVER (PARTITION BY "tournamentId" ORDER BY "totalPoints" DESC, results DESC, "exactScores" DESC, margins DESC, "cumulativeError" ASC) AS position FROM totals)
      INSERT INTO "TournamentWinner" ("tournamentId", "userId", "finalPoints", rank, "createdAt") SELECT "tournamentId", "userId", "totalPoints", position, NOW() FROM ranked WHERE position <= 3`);
      const [check] = await tx.$queryRawUnsafe(`SELECT COUNT(*)::int AS invalid FROM "Prediction" p JOIN "Match" m ON m.id = p."matchId" WHERE m.completed = true AND p."pointsAwarded" <> (CASE WHEN p."correctResult" THEN 1 ELSE 0 END + CASE WHEN p."correctMargin" THEN 2 ELSE 0 END + CASE WHEN p."exactScore" THEN 3 ELSE 0 END)`);
      if (check.invalid !== 0) throw new Error('Stored scoring flags disagree with results; repair rolled back.');
      const probe = await tx.prediction.findFirst({select:{id:true}});
      if (probe) {
        await tx.$executeRawUnsafe('SAVEPOINT scoring_probe');
        const saved = await tx.prediction.update({where:{id:probe.id},data:{pointsAwarded:6},select:{pointsAwarded:true}});
        if (saved.pointsAwarded !== 6) throw new Error('Prisma whole-point write failed');
        await tx.$executeRawUnsafe('ROLLBACK TO SAVEPOINT scoring_probe');
      }
      console.log('STAGING_SCORING_REPAIR_VERIFIED', JSON.stringify({ predictions, invalid: check.invalid, rule: '1 + 2 + 3; maximum 6', snapshotsAndTotals: 'recalculated' }));
    }, { timeout: 60000 });
  } finally { await db.$disconnect(); }
}
