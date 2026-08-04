import { prisma } from "../src/lib/prisma";

const EMAIL =
  process.argv[2];

async function main() {
  if (!EMAIL) {
    throw new Error(
      "Usage: npx tsx scripts/clear-user-predictions.ts user@example.com"
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

  const result =
    await prisma.prediction.deleteMany({
      where: {
        userId: user.id,
      },
    });

  console.log(
    `Deleted ${result.count} prediction(s) for ${EMAIL}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });