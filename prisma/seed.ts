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

await prisma.match.createMany({
  skipDuplicates: true,
  data: [
    {
      tournamentId: tournament.id,
      round: 1,
      matchNumber: 1,
      venue: "Aviva Stadium",
      city: "Dublin",
      country: "Ireland",
      kickoffTime: new Date("2027-02-05T20:10:00Z"),
      homeTeamId: ireland.id,
      awayTeamId: england.id,
    },
    {
      tournamentId: tournament.id,
      round: 1,
      matchNumber: 2,
      venue: "Murrayfield",
      city: "Edinburgh",
      country: "Scotland",
      kickoffTime: new Date("2027-02-06T14:10:00Z"),
      homeTeamId: scotland.id,
      awayTeamId: italy.id,
    },
    {
      tournamentId: tournament.id,
      round: 1,
      matchNumber: 3,
      venue: "Stade de France",
      city: "Paris",
      country: "France",
      kickoffTime: new Date("2027-02-06T16:40:00Z"),
      homeTeamId: france.id,
      awayTeamId: wales.id,
    },
{
  tournamentId: tournament.id,
  round: 2,
  matchNumber: 4,
  venue: "Stadio Olimpico",
  city: "Rome",
  country: "Italy",
  kickoffTime: new Date("2027-02-13T14:10:00Z"),
  homeTeamId: italy.id,
  awayTeamId: ireland.id,
},
{
  tournamentId: tournament.id,
  round: 2,
  matchNumber: 5,
  venue: "Murrayfield",
  city: "Edinburgh",
  country: "Scotland",
  kickoffTime: new Date("2027-02-13T16:40:00Z"),
  homeTeamId: scotland.id,
  awayTeamId: wales.id,
},
{
  tournamentId: tournament.id,
  round: 2,
  matchNumber: 6,
  venue: "Allianz Stadium",
  city: "London",
  country: "England",
  kickoffTime: new Date("2027-02-14T15:10:00Z"),
  homeTeamId: england.id,
  awayTeamId: france.id,
},
  ]
});

  console.log("Teams created");
  console.log("Tournament created", tournament.id);
  console.log("Matches created");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });