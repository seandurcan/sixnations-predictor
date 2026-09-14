export type LiveScoreTestFixture = {
  id: string;
  testSet: "completed" | "upcoming" | "november";
  competition: string;
  date: string;
  dateLabel: string;
  kickoffIso: string;
  kickoffLabel: string;
  home: string;
  away: string;
  homeAliases?: string[];
  awayAliases?: string[];
  venue: string;
};

export const liveScoreTestFixtures: LiveScoreTestFixture[] = [
  {
    id: "hawkes-bay-tui-wellington-pride-2026-09-13",
    testSet: "completed", competition: "Farah Palmer Cup", date: "2026-09-13",
    dateLabel: "Sunday 13 September 2026", kickoffIso: "2026-09-12T23:35:00.000Z", kickoffLabel: "00:35",
    home: "Hawke's Bay Tui", away: "Wellington Pride", homeAliases: ["Hawke's Bay Tui", "Hawkes Bay Tui", "Hawke's Bay"], awayAliases: ["Wellington Pride"], venue: "McLean Park",
  },
  {
    id: "manawatu-cyclones-canterbury-women-2026-09-13",
    testSet: "completed", competition: "Farah Palmer Cup", date: "2026-09-13",
    dateLabel: "Sunday 13 September 2026", kickoffIso: "2026-09-13T02:05:00.000Z", kickoffLabel: "03:05",
    home: "Manawatu Cyclones", away: "Canterbury Women", homeAliases: ["Manawatu Cyclones", "Manawatu"], awayAliases: ["Canterbury Women", "Canterbury"], venue: "Central Energy Trust Arena",
  },
  {
    id: "hawkes-bay-north-harbour-2026-09-13",
    testSet: "completed", competition: "Hilux NPC", date: "2026-09-13",
    dateLabel: "Sunday 13 September 2026", kickoffIso: "2026-09-13T02:05:00.000Z", kickoffLabel: "03:05",
    home: "Hawkes Bay", away: "North Harbour", homeAliases: ["Hawkes Bay", "Hawke's Bay"], awayAliases: ["North Harbour"], venue: "McLean Park",
  },
  {
    id: "spain-women-fiji-women-2026-09-13",
    testSet: "completed", competition: "WXV Global Series Challenger", date: "2026-09-13",
    dateLabel: "Sunday 13 September 2026", kickoffIso: "2026-09-13T04:00:00.000Z", kickoffLabel: "05:00",
    home: "Spain Women", away: "Fiji Women", homeAliases: ["Spain Women", "Spain"], awayAliases: ["Fiji Women", "Fiji"], venue: "Kai Tak Youth Sports Ground",
  },
  {
    id: "southland-bay-of-plenty-2026-09-13",
    testSet: "completed", competition: "Hilux NPC", date: "2026-09-13",
    dateLabel: "Sunday 13 September 2026", kickoffIso: "2026-09-13T05:05:00.000Z", kickoffLabel: "06:05",
    home: "Southland Stags", away: "Bay of Plenty", homeAliases: ["Southland Stags", "Southland"], awayAliases: ["Bay of Plenty"], venue: "Invercargill Rugby Park",
  },
  {
    id: "toulouse-bordeaux-2026-09-13",
    testSet: "completed", competition: "Top 14", date: "2026-09-13",
    dateLabel: "Sunday 13 September 2026", kickoffIso: "2026-09-13T19:05:00.000Z", kickoffLabel: "20:05",
    home: "Toulouse", away: "Bordeaux", homeAliases: ["Toulouse", "Stade Toulousain"], awayAliases: ["Bordeaux", "Bordeaux Begles", "Union Bordeaux Begles", "UBB"], venue: "Stade Ernest-Wallon",
  },
  {
    id: "counties-manukau-otago-2026-09-17",
    testSet: "upcoming", competition: "Hilux NPC", date: "2026-09-17",
    dateLabel: "Thursday 17 September 2026", kickoffIso: "2026-09-17T07:10:00.000Z", kickoffLabel: "08:10",
    home: "Counties Manukau", away: "Otago", homeAliases: ["Counties Manukau", "Counties Manukau Steelers", "Counties"], awayAliases: ["Otago", "Otago Razorbacks"], venue: "Navigation Homes Stadium",
  },
  {
    id: "castres-toulon-2026-09-19",
    testSet: "upcoming", competition: "Top 14", date: "2026-09-19",
    dateLabel: "Saturday 19 September 2026", kickoffIso: "2026-09-19T12:30:00.000Z", kickoffLabel: "13:30",
    home: "Castres", away: "Toulon", homeAliases: ["Castres", "Castres Olympique"], awayAliases: ["Toulon", "RC Toulon", "RC Toulonnais"], venue: "Stade Pierre-Fabre",
  },
  { id: "ireland-argentina-2026-11-06", testSet: "november", competition: "Nations Championship", date: "2026-11-06", dateLabel: "Friday 6 November 2026", kickoffIso: "2026-11-06T20:10:00.000Z", kickoffLabel: "20:10", home: "Ireland", away: "Argentina", venue: "Aviva Stadium, Dublin" },
  { id: "scotland-new-zealand-2026-11-07", testSet: "november", competition: "Nations Championship", date: "2026-11-07", dateLabel: "Saturday 7 November 2026", kickoffIso: "2026-11-07T14:10:00.000Z", kickoffLabel: "14:10", home: "Scotland", away: "New Zealand", venue: "Murrayfield, Edinburgh" },
  { id: "france-fiji-2026-11-07", testSet: "november", competition: "Nations Championship", date: "2026-11-07", dateLabel: "Saturday 7 November 2026", kickoffIso: "2026-11-07T20:10:00.000Z", kickoffLabel: "20:10", home: "France", away: "Fiji", venue: "Groupama Stadium, Lyon" },
  { id: "england-australia-2026-11-08", testSet: "november", competition: "Nations Championship", date: "2026-11-08", dateLabel: "Sunday 8 November 2026", kickoffIso: "2026-11-08T15:10:00.000Z", kickoffLabel: "15:10", home: "England", away: "Australia", venue: "Allianz Stadium, London" },
  { id: "france-south-africa-2026-11-13", testSet: "november", competition: "Nations Championship", date: "2026-11-13", dateLabel: "Friday 13 November 2026", kickoffIso: "2026-11-13T20:10:00.000Z", kickoffLabel: "20:10", home: "France", away: "South Africa", venue: "Stade de France, Saint-Denis" },
  { id: "wales-new-zealand-2026-11-14", testSet: "november", competition: "Nations Championship", date: "2026-11-14", dateLabel: "Saturday 14 November 2026", kickoffIso: "2026-11-14T14:10:00.000Z", kickoffLabel: "14:10", home: "Wales", away: "New Zealand", venue: "Principality Stadium, Cardiff" },
  { id: "ireland-fiji-2026-11-14", testSet: "november", competition: "Nations Championship", date: "2026-11-14", dateLabel: "Saturday 14 November 2026", kickoffIso: "2026-11-14T20:10:00.000Z", kickoffLabel: "20:10", home: "Ireland", away: "Fiji", venue: "Aviva Stadium, Dublin" },
];
