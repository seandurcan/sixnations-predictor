import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("");
  console.log("=================================");
  console.log("RESETTING TOURNAMENT RESULTS");
  console.log("=================================");
  console.log("");

  const snapshots =
    await prisma.leaderboardSnapshot.deleteMany();

  console.log(
    `Deleted ${snapshots.count} leaderboard snapshots`
  );

  const audits =
    await prisma.scoreAudit.deleteMany();

  console.log(
    `Deleted ${audits.count} score audit records`
  );

  const winners =
    await prisma.tournamentWinner.deleteMany();

  console.log(
    `Deleted ${winners.count} tournament winner records`
  );

  const predictions =
    await prisma.prediction.updateMany({
      data: {
        pointsAwarded: 0,
        errorValue: 0,
        differenceScore: 0,
        exactScore: false,
      },
    });

  console.log(
    `Reset ${predictions.count} predictions`
  );

  const users =
    await prisma.user.updateMany({
      data: {
        totalPoints: 0,
        cumulativeError: 0,
        exactScores: 0,
      },
    });

  console.log(
    `Reset ${users.count} users`
  );

  const matches =
    await prisma.match.updateMany({
      data: {
        actualHomeScore: null,
        actualAwayScore: null,
        homeTries: null,
        awayTries: null,
        attendance: null,
        weather: null,
        notes: null,
        completed: false,
      },
    });

  console.log(
    `Reset ${matches.count} matches`
  );

  console.log("");
  console.log("=================================");
  console.log("TOURNAMENT RESET COMPLETE");
  console.log("=================================");
  console.log("");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });