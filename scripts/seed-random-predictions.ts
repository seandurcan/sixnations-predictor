import { prisma } from "../src/lib/prisma";

const EMAIL =
  process.argv[2];

function randomScore(): number {
  return Math.floor(
    Math.random() * 45
  );
}

async function main() {
  if (!EMAIL) {
    throw new Error(
      "Usage: npx tsx scripts/seed-random-predictions.ts user@example.com"
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        email: EMAIL,
      },
    });

  if (!user) {
    throw new Error(
      `User not found: ${EMAIL}`
    );
  }

  const matches =
    await prisma.match.findMany({
      orderBy: {
        kickoffTime: "asc",
      },
    });

  let created = 0;
  let updated = 0;

  for (const match of matches) {
    const homeScore =
      randomScore();

    const awayScore =
      randomScore();

    const existingPrediction =
      await prisma.prediction.findUnique(
        {
          where: {
            userId_matchId: {
              userId: user.id,
              matchId: match.id,
            },
          },
        }
      );

    if (existingPrediction) {
      await prisma.prediction.update({
        where: {
          id: existingPrediction.id,
        },
        data: {
          predictedHomeScore:
            homeScore,
          predictedAwayScore:
            awayScore,
        },
      });

      updated++;
    } else {
      await prisma.prediction.create({
        data: {
          userId: user.id,
          matchId: match.id,
          predictedHomeScore:
            homeScore,
          predictedAwayScore:
            awayScore,
        },
      });

      created++;
    }
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      predictionsSubmitted: true,
      predictionSubmittedAt:
        new Date(),
    },
  });

  console.log("");
  console.log(
    `User: ${EMAIL}`
  );
  console.log(
    `Matches: ${matches.length}`
  );
  console.log(
    `Predictions created: ${created}`
  );
  console.log(
    `Predictions updated: ${updated}`
  );
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