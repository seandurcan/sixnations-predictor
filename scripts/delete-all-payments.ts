import { prisma } from "../src/lib/prisma";

async function main() {
  const result =
    await prisma.payment.deleteMany();

  console.log(
    `Deleted ${result.count} payment(s)`
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });