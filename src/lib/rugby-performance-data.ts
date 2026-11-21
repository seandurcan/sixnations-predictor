/** Independent World Rugby research series 02: World_Rugby_Statistical_Analysis.docx
 * Match statistics reproduce the report's fixed 18 July 2026 cutoff.
 * Development milestones and sources were compiled through 20 November 2026.
 */
export const strengthRecords = [
  ["New Zealand", 290, 232, 6, 80.0, 85.0],
  ["Ireland", 247, 149, 4, 60.3, 58.8],
  ["South Africa", 279, 168, 7, 60.2, 66.2],
  ["England", 274, 163, 4, 59.5, 59.6],
  ["France", 265, 143, 5, 54.0, 53.1],
  ["Australia", 295, 143, 10, 48.5, 55.9],
  ["Wales", 264, 99, 5, 37.5, 37.4],
  ["Scotland", 228, 77, 3, 33.8, 30.9],
  ["Argentina", 212, 65, 4, 30.7, 35.0],
  ["Italy", 220, 23, 2, 10.5, 9.6],
] as const;

export const benchmarkCodes = ["NZ", "SA", "ENG", "FRA", "IRE", "AUS", "WAL", "SCO", "ARG", "ITA"] as const;
export const benchmarkNames = {
  NZ: "New Zealand",
  SA: "South Africa",
  ENG: "England",
  FRA: "France",
  IRE: "Ireland",
  AUS: "Australia",
  WAL: "Wales",
  SCO: "Scotland",
  ARG: "Argentina",
  ITA: "Italy",
} as const;
/** Each number represents Tests WON by row country against column country, 1871–18 July 2026. */
export const rivalryWins = [
  [null, 63, 36, 52, 34, 129, 35, 31, 36, 18],
  [43, null, 30, 29, 20, 52, 37, 26, 35, 18],
  [9, 16, null, 61, 81, 29, 72, 77, 25, 32],
  [15, 12, 45, null, 61, 23, 52, 61, 40, 47],
  [5, 10, 55, 37, null, 17, 61, 73, 14, 35],
  [44, 42, 27, 29, 22, null, 34, 22, 30, 19],
  [3, 7, 60, 51, 69, 14, null, 75, 15, 29],
  [0, 5, 48, 41, 66, 13, 54, null, 11, 29],
  [4, 4, 5, 15, 6, 10, 8, 12, null, 18],
  [0, 1, 1, 3, 4, 2, 5, 10, 5, null],
] as const;

export const selectedRivalries = [
  ["New Zealand v South Africa", 110, 63, 4, 43],
  ["New Zealand v Australia", 181, 129, 8, 44],
  ["England v Ireland", 144, 81, 8, 55],
  ["England v France", 113, 61, 7, 45],
  ["New Zealand v France", 68, 52, 1, 15],
  ["Ireland v New Zealand", 40, 5, 1, 34],
  ["Wales v New Zealand", 38, 3, 0, 35],
  ["Scotland v New Zealand", 33, 0, 2, 31],
] as const;

export const decadeLeaders = [
  ["1900–09", "New Zealand / Wales", "8/10 / 28/35", "80.0% / 80.0%"],
  ["1910–19", "New Zealand", "7/9", "77.8%"],
  ["1920–29", "England", "29/42", "69.0%"],
  ["1930–39", "South Africa", "11/14", "78.6%"],
  ["1940–49", "Ireland", "9/13", "69.2%"],
  ["1950–59", "New Zealand", "16/22", "72.7%"],
  ["1960–69", "New Zealand", "31/38", "81.6%"],
  ["1970–79", "South Africa", "14/20", "70.0%"],
  ["1980–89", "New Zealand", "39/51", "76.5%"],
  ["1990–99", "New Zealand", "55/77", "71.4%"],
  ["2000–09", "New Zealand", "86/108", "79.6%"],
  ["2010–19", "New Zealand", "100/115", "87.0%"],
  ["2020–26*", "South Africa", "45/60", "75.0%"],
] as const;

export const scoringRecords = [
  ["New Zealand", 290, 32.3, 17.5, 14.8],
  ["England", 274, 25.0, 19.5, 5.5],
  ["South Africa", 279, 26.0, 20.8, 5.3],
  ["Ireland", 247, 23.7, 19.6, 4.1],
  ["France", 265, 24.0, 21.9, 2.2],
  ["Australia", 295, 23.5, 23.3, 0.1],
  ["Wales", 264, 20.8, 25.3, -4.5],
  ["Scotland", 228, 18.4, 24.6, -6.1],
  ["Argentina", 212, 20.1, 27.9, -7.8],
  ["Italy", 220, 14.3, 35.3, -21.0],
] as const;

export const developmentMilestones = [
  ["19 Sep 2015", "Japan 34–32 South Africa", "World Cup upset; major breakthrough for Japan", 4],
  ["10 Jul 2022", "Georgia 28–19 Italy", "First win over an established Six Nations side", 5],
  ["19 Nov 2022", "Georgia 13–12 Wales", "First Georgian Test victory over Wales, in Cardiff", 6],
  ["26 Aug 2023", "Fiji 30–22 England", "First Fiji win over England, at Twickenham", 7],
  ["17 Sep 2023", "Fiji 22–15 Australia", "First Fiji win over Australia since 1954", 8],
  ["08 Oct 2023", "Portugal 24–23 Fiji", "Portugal’s first Rugby World Cup victory", 9],
  ["20 Nov 2026", "Canada 27–26 Romania", "Canada’s first win in Romania", 10],
] as const;

export const researchSources = [
  ["Match dataset", "TommyKilbourn/rugby-rankings — rugby_results_master.csv", "https://github.com/TommyKilbourn/rugby-rankings/blob/main/data/rugby_results_master.csv"],
  ["Source methodology", "Original dataset and project README", "https://github.com/TommyKilbourn/rugby-rankings"],
  ["Rankings methodology", "World Rugby — rankings explained", "https://www.world.rugby/rankings/explanation"],
  ["Japan v South Africa · 2015", "World Rugby — Japan's historic 34–32 victory", "https://www.world.rugby/news/571453/afrique-springbok-sud-irlande-ecosse-japon-rugby"],
  ["Georgia v Italy · 2022", "World Rugby — Georgia's breakthrough", "https://www.world.rugby/news/731460/five-things-we-learned-from-the-second-weekend-of-july-internationals"],
  ["Georgia v Wales · 2022", "Six Nations — Georgia make history in Cardiff", "https://www.sixnationsrugby.com/en/autumn-nations-series/news/georgia-make-history-with-sensational-win-over-wales"],
  ["Fiji v England · 2023", "Six Nations — Fiji's first win over England", "https://www.sixnationsrugby.com/en/autumn-nations-series/news/phenomenal-fiji-beat-england-for-first-time-in-history"],
  ["Fiji v Australia · 2023", "World Rugby — Fiji beat Australia after 69 years", "https://www.world.rugby/news/864190/aus-15-22-fij-fiji-beat-australia-for-first-time-in-69-years"],
  ["Portugal v Fiji · 2023", "Rugby World Cup — Portugal's first tournament win", "https://www.rugbyworldcup.com/news/876030/fji-23-24-por-match-analysis"],
  ["Canada v Romania · 2026", "World Rugby — Canada's 27–26 away win", "https://www.world.rugby/media-zone/advisory/1049607"],
  ["2026 Nations Cup", "World Rugby — USA and Georgia crowned pool champions", "https://www.world.rugby/news/1049401/usa-and-georgia-crowned-nations-cup-champions"],
  ["2026 competition structure", "World Rugby — Nations Cup launch and pathway", "https://www.world.rugby/news/1018591/world-rugby-nations-cup-to-launch-in-july-2026-to-transform-international-calendar?lang=en"],
  ["Related historical record", "TheBreakdown — all-time win records source for Research Series 01", "https://thebreakdown.zone/teams?show=all"],
] as const;
