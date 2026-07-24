import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {

  const ireland = await prisma.team.upsert({
    where: { shortCode: "IRE" },
    update: {},
    create: {
      name: "Ireland",
      shortCode: "IRE",
      country: "Ireland",
      homeVenue: "Aviva Stadium",
      city: "Dublin",
      flagSvg: "ireland.svg",
      primaryColor: "#169B62",
    },
  });

  const england = await prisma.team.upsert({
    where: { shortCode: "ENG" },
    update: {},
    create: {
      name: "England",
      shortCode: "ENG",
      country: "England",
      homeVenue: "Allianz Stadium",
      city: "London",
      flagSvg: "england.svg",
      primaryColor: "#FFFFFF",
    },
  });

  const scotland = await prisma.team.upsert({
    where: { shortCode: "SCO" },
    update: {},
    create: {
      name: "Scotland",
      shortCode: "SCO",
      country: "Scotland",
      homeVenue: "Murrayfield",
      city: "Edinburgh",
      flagSvg: "scotland.svg",
      primaryColor: "#0065BD",
    },
  });

  const wales = await prisma.team.upsert({
    where: { shortCode: "WAL" },
    update: {},
    create: {
      name: "Wales",
      shortCode: "WAL",
      country: "Wales",
      homeVenue: "Principality Stadium",
      city: "Cardiff",
      flagSvg: "wales.svg",
      primaryColor: "#C8102E",
    },
  });

  const france = await prisma.team.upsert({
    where: { shortCode: "FRA" },
    update: {},
    create: {
      name: "France",
      shortCode: "FRA",
      country: "France",
      homeVenue: "Stade de France",
      city: "Paris",
      flagSvg: "france.svg",
      primaryColor: "#0055A4",
    },
  });

  const italy = await prisma.team.upsert({
    where: { shortCode: "ITA" },
    update: {},
    create: {
      name: "Italy",
      shortCode: "ITA",
      country: "Italy",
      homeVenue: "Stadio Olimpico",
      city: "Rome",
      flagSvg: "italy.svg",
      primaryColor: "#009246",
    },
  });

  const tournament = await prisma.tournament.upsert({
    where: { year: 2027 },
    update: {},
    create: {
      year: 2027,
      name: "Six Nations 2027",
      status: "OPEN",
      firstKickoff: new Date("2027-02-05T20:10:00Z"),
      predictionLockAt: new Date("2027-02-05T20:10:00Z"),
    },
  });

  console.log("Teams created");
  console.log("Tournament created", tournament.id);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });