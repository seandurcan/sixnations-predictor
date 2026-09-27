export type ChampionshipEra = {
  years: string;
  title: string;
  description: string;
};

export type SixNationsWinner = {
  year: number;
  champion: string;
};

export type ClassicMatch = {
  year: number;
  title: string;
  score: string;
  venue: string;
  story: string;
};

export const championshipEras: ChampionshipEra[] = [
  {
    years: "1883–1909",
    title: "The Home Nations Championship",
    description:
      "England, Ireland, Scotland and Wales formed the original Championship in 1883. The rivalry, trophies and traditions established in this era became the foundations of the modern tournament.",
  },
  {
    years: "1910–1931",
    title: "France joins: the Five Nations",
    description:
      "France officially joined in 1910 and the Championship became the Five Nations. The competition was interrupted by the First World War and France left after the 1931 tournament.",
  },
  {
    years: "1932–1939",
    title: "Home Nations returns",
    description:
      "The four Home Nations again contested the Championship during the 1930s before international rugby was halted by the Second World War.",
  },
  {
    years: "1947–1999",
    title: "The post-war Five Nations",
    description:
      "France returned in 1947. The Championship grew into one of rugby's defining annual events, with shared titles possible until points difference was introduced as the title tie-break from 1994.",
  },
  {
    years: "2000–present",
    title: "The Six Nations era",
    description:
      "Italy joined in 2000, creating the six-team Championship played today. Bonus points were introduced in 2017, adding another dimension to the table while preserving the traditional round-robin format.",
  },
];

export const sixNationsWinners: SixNationsWinner[] = [
  { year: 2000, champion: "England" },
  { year: 2001, champion: "England" },
  { year: 2002, champion: "France" },
  { year: 2003, champion: "England" },
  { year: 2004, champion: "France" },
  { year: 2005, champion: "Wales" },
  { year: 2006, champion: "France" },
  { year: 2007, champion: "France" },
  { year: 2008, champion: "Wales" },
  { year: 2009, champion: "Ireland" },
  { year: 2010, champion: "France" },
  { year: 2011, champion: "England" },
  { year: 2012, champion: "Wales" },
  { year: 2013, champion: "Wales" },
  { year: 2014, champion: "Ireland" },
  { year: 2015, champion: "Ireland" },
  { year: 2016, champion: "England" },
  { year: 2017, champion: "England" },
  { year: 2018, champion: "Ireland" },
  { year: 2019, champion: "Wales" },
  { year: 2020, champion: "England" },
  { year: 2021, champion: "Wales" },
  { year: 2022, champion: "France" },
  { year: 2023, champion: "Ireland" },
  { year: 2024, champion: "Ireland" },
  { year: 2025, champion: "France" },
  { year: 2026, champion: "France" },
];

export const classicMatches: ClassicMatch[] = [
  {
    year: 2007,
    title: "Ireland v England",
    score: "Ireland 43–13 England",
    venue: "Croke Park, Dublin",
    story:
      "Ireland's first rugby international against England at Croke Park became an unforgettable sporting occasion. The emotion surrounding the day was matched by a commanding Irish performance and a 30-point victory.",
  },
  {
    year: 2011,
    title: "Italy v France",
    score: "Italy 22–21 France",
    venue: "Stadio Flaminio, Rome",
    story:
      "Italy overturned a 12-point second-half deficit to record their first Six Nations victory over France. Mirco Bergamasco's late penalty put the Azzurri ahead and they survived a tense finish to seal one of their landmark Championship wins.",
  },
  {
    year: 2013,
    title: "Wales v England",
    score: "Wales 30–3 England",
    venue: "Millennium Stadium, Cardiff",
    story:
      "England arrived chasing a Grand Slam while Wales still had a route to the title. Wales produced a dominant second half, with two Alex Cuthbert tries, to retain the Championship in emphatic fashion.",
  },
  {
    year: 2015,
    title: "England v France",
    score: "England 55–35 France",
    venue: "Twickenham, London",
    story:
      "The final act of the extraordinary 2015 Super Saturday became a frantic race against points difference. England scored 55 but still fell six points short of the margin needed, leaving Ireland as champions.",
  },
  {
    year: 2018,
    title: "France v Ireland",
    score: "France 13–15 Ireland",
    venue: "Stade de France, Paris",
    story:
      "With Ireland trailing in the final moments, a long possession ended with Johnny Sexton's dramatic drop goal from distance. The opening-round escape became the launch point for Ireland's Grand Slam campaign.",
  },
  {
    year: 2019,
    title: "England v Scotland",
    score: "England 38–38 Scotland",
    venue: "Twickenham, London",
    story:
      "England raced into a huge early lead before Scotland produced one of the Championship's great comebacks. The Calcutta Cup match finished level after a remarkable 76-point contest.",
  },
];

export const heritageSources = [
  {
    label: "Six Nations Rugby — Championship History",
    href: "https://www.sixnationsrugby.com/en/m6n/championship-history-mens",
  },
  {
    label: "Six Nations Rugby — Roll of Honour",
    href: "https://www.sixnationsrugby.com/en/m6n/roll-of-honour",
  },
];


export type TeamHistory = {
  team: string;
  heading: string;
  story: string;
  highlights: string[];
  source: string;
};

export type PlayerProfile = {
  name: string;
  team: string;
  position: string;
  summary: string;
  distinction: string;
  source: string;
};

export const teamHistories: TeamHistory[] = [
  {
    team: "Ireland",
    heading: "From early champions to a modern golden era",
    story:
      "Ireland first won the Championship in 1894 and claimed a first Grand Slam in 1948. The modern Six Nations era has brought some of Ireland's most celebrated campaigns, including the 2009, 2018 and 2023 Grand Slams and back-to-back titles in 2023 and 2024.",
    highlights: [
      "First Championship title: 1894",
      "Grand Slams: 1948, 2009, 2018 and 2023",
      "Modern Six Nations titles include 2009, 2014, 2015, 2018, 2023 and 2024",
      "Brian O'Driscoll is Ireland's Six Nations record holder for appearances and tries",
    ],
    source: "https://www.sixnationsrugby.com/en/m6n/team-ireland-men",
  },
  {
    team: "England",
    heading: "The original champions",
    story:
      "England won the inaugural Championship in 1883 and have remained central to its history ever since. Their modern Six Nations story includes the 2003 Grand Slam, achieved in the same year as World Cup glory, and another Grand Slam in 2016.",
    highlights: [
      "Won the inaugural Championship in 1883",
      "Six Nations Grand Slams include 2003 and 2016",
      "Back-to-back Six Nations titles in 2016 and 2017",
      "Owen Farrell is England's leading Six Nations points scorer",
    ],
    source: "https://www.sixnationsrugby.com/en/m6n/team-england-men",
  },
  {
    team: "France",
    heading: "Flair, power and repeated Championship success",
    story:
      "France officially joined the Championship in 1910 and returned permanently after the Second World War. Les Bleus have shaped the tournament with generations of inventive backs and formidable forwards, adding repeated titles and Grand Slams across both the Five Nations and Six Nations eras.",
    highlights: [
      "Officially joined the Championship in 1910",
      "Returned to the post-war Five Nations in 1947",
      "Six Nations Grand Slams include 2002, 2004, 2010 and 2022",
      "Antoine Dupont won Player of the Championship in 2020, 2022 and 2023",
    ],
    source: "https://www.sixnationsrugby.com/en/m6n/team-france-men",
  },
  {
    team: "Scotland",
    heading: "Tradition, rivalry and the Calcutta Cup",
    story:
      "Scotland were part of the first Championship in 1883 and share rugby's oldest international rivalry with England. Their Championship identity is inseparable from Murrayfield, the Calcutta Cup and a long tradition of skilful attacking players and influential kickers.",
    highlights: [
      "Founder member of the Championship in 1883",
      "Five Nations champions in 1999, the final season before Italy joined",
      "Stuart Hogg won Player of the Championship in 2016 and 2017",
      "Chris Paterson remains one of Scotland's defining Six Nations points scorers",
    ],
    source: "https://www.sixnationsrugby.com/en/m6n/team-scotland-men",
  },
  {
    team: "Wales",
    heading: "Grand Slams and great Championship sides",
    story:
      "Wales became champions for the first time in 1893 and have produced some of the Championship's most celebrated teams. In the Six Nations era, Wales have repeatedly combined fierce defence with attacking ambition, winning Grand Slams in 2005, 2008, 2012 and 2019.",
    highlights: [
      "First Championship title: 1893",
      "Six Nations Grand Slams: 2005, 2008, 2012 and 2019",
      "Champions again in 2021",
      "Alun Wyn Jones holds Wales' Six Nations appearance record",
    ],
    source: "https://www.sixnationsrugby.com/en/m6n/team-wales-men",
  },
  {
    team: "Italy",
    heading: "The nation that made it Six",
    story:
      "Italy joined the Championship in 2000 and immediately announced themselves by beating Scotland in Rome. Their Six Nations journey has included landmark wins over France, Ireland, Scotland and Wales, with a new generation adding fresh momentum to the Azzurri story.",
    highlights: [
      "Joined the Championship in 2000",
      "Won their first Six Nations match against Scotland on debut",
      "Recorded their first away Six Nations victory in Scotland in 2007",
      "Sergio Parisse holds the overall Six Nations appearance record with 69",
    ],
    source: "https://www.sixnationsrugby.com/en/m6n/team-italy-men",
  },
];

export const playerProfiles: PlayerProfile[] = [
  {
    name: "Brian O'Driscoll",
    team: "Ireland",
    position: "Centre",
    summary:
      "A defining figure of the modern Championship, O'Driscoll combined attacking imagination, defence and leadership across 15 Six Nations campaigns. He captained Ireland to the 2009 Grand Slam.",
    distinction:
      "Modern Six Nations record: 26 tries in 65 appearances; Player of the Championship in 2006, 2007 and 2009.",
    source: "https://www.sixnationsrugby.com/en/m6n/news/the-all-time-six-nations-top-try-scorers-2000-present",
  },
  {
    name: "Johnny Sexton",
    team: "Ireland",
    position: "Fly-half",
    summary:
      "Sexton became the tactical and emotional fulcrum of several title-winning Ireland sides, from the 2014 and 2015 Championships through the 2018 and 2023 Grand Slams.",
    distinction:
      "Ireland's Six Nations record points scorer with 566 points.",
    source: "https://www.sixnationsrugby.com/en/m6n/team-ireland-men",
  },
  {
    name: "Jonny Wilkinson",
    team: "England",
    position: "Fly-half",
    summary:
      "Wilkinson's precision from the tee and control at fly-half were central to England's dominant early-2000s side, culminating in the 2003 Grand Slam.",
    distinction:
      "One of the leading points scorers in Championship history and England's Six Nations drop-goal record holder.",
    source: "https://www.sixnationsrugby.com/en/m6n/team-england-men",
  },
  {
    name: "Owen Farrell",
    team: "England",
    position: "Fly-half / Centre",
    summary:
      "A central figure in England's modern Championship era, Farrell combined goal-kicking, distribution and leadership through multiple title campaigns.",
    distinction:
      "England's Six Nations record points scorer with 528 points.",
    source: "https://www.sixnationsrugby.com/en/m6n/team-england-men",
  },
  {
    name: "Antoine Dupont",
    team: "France",
    position: "Scrum-half",
    summary:
      "Dupont has become one of the defining players of the contemporary Championship, combining explosive running, support play, kicking and defensive work from scrum-half.",
    distinction:
      "Player of the Championship in 2020, 2022 and 2023.",
    source: "https://www.sixnationsrugby.com/en/m6n/news/dupont-named-player-of-the-championship",
  },
  {
    name: "Philippe Sella",
    team: "France",
    position: "Centre",
    summary:
      "Sella was one of the great French centres of the Five Nations era, renowned for his pace, balance and attacking intelligence across a long international career.",
    distinction:
      "France's Championship appearance record holder with 50 appearances.",
    source: "https://www.sixnationsrugby.com/en/m6n/team-france-men",
  },
  {
    name: "Stuart Hogg",
    team: "Scotland",
    position: "Full-back",
    summary:
      "Hogg brought counter-attacking threat and long-range pace to Scotland's back three and became one of the most recognisable Scottish players of the modern Six Nations.",
    distinction:
      "Player of the Championship in 2016 and 2017.",
    source: "https://www.sixnationsrugby.com/en/m6n/news/greatest-xv-profile-stuart-hogg",
  },
  {
    name: "Chris Paterson",
    team: "Scotland",
    position: "Full-back / Wing",
    summary:
      "Paterson was a model of reliability for Scotland, especially from the kicking tee, and remained a major influence through the early Six Nations era.",
    distinction:
      "Scotland's Six Nations record points scorer with 403 points.",
    source: "https://www.sixnationsrugby.com/en/m6n/team-scotland-men",
  },
  {
    name: "Alun Wyn Jones",
    team: "Wales",
    position: "Lock",
    summary:
      "Jones became synonymous with Welsh Championship rugby through his durability, leadership and central role in multiple title and Grand Slam campaigns.",
    distinction:
      "Wales' Six Nations appearance record holder with 67 appearances; Player of the Championship in 2019.",
    source: "https://www.sixnationsrugby.com/en/m6n/team-wales-men",
  },
  {
    name: "Shane Williams",
    team: "Wales",
    position: "Wing",
    summary:
      "Williams gave Wales a constant attacking threat and was at the heart of the 2005 and 2008 Grand Slam sides with his footwork, acceleration and finishing.",
    distinction:
      "Player of the Championship in 2008 after scoring six tries in five matches.",
    source: "https://www.sixnationsrugby.com/en/m6n/news/six-nations-player-championship-winners-history",
  },
  {
    name: "Sergio Parisse",
    team: "Italy",
    position: "Number 8",
    summary:
      "Parisse was the outstanding constant of Italy's Six Nations story for almost two decades, combining handling skill, athleticism and leadership from the back row.",
    distinction:
      "Overall Six Nations appearance record holder with 69 appearances.",
    source: "https://www.sixnationsrugby.com/en/m6n/team-italy-men",
  },
  {
    name: "Andrea Masi",
    team: "Italy",
    position: "Centre / Full-back",
    summary:
      "Masi was one of Italy's most important backs of the early Six Nations era, valued for his direct running, versatility and defensive strength.",
    distinction:
      "Player of the Championship in 2011, the first Italian to receive the award.",
    source: "https://www.sixnationsrugby.com/en/m6n/guinness-six-nations-player-of-the-championship",
  },
];


export type HistoricStanding = {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  pointsDifference: number;
  tablePoints: number;
};

export type HistoricSeason = {
  year: number;
  champion: string;
  story: string;
  source: string;
  standings: HistoricStanding[];
};

export type HeritageRecord = {
  title: string;
  value: string;
  detail: string;
  source: string;
};

export type RivalryTrophy = {
  name: string;
  fixture: string;
  story: string;
};

export type ChampionshipVenue = {
  city: string;
  stadium: string;
  nation: string;
  note: string;
};

export const historicSeasons: HistoricSeason[] = [
  {
    year: 2018,
    champion: "Ireland",
    story:
      "Ireland completed a Grand Slam at Twickenham on the final weekend, finishing the Championship with five wins from five. Wales finished second, Scotland third and England slipped to fifth.",
    source: "https://www.rugbypass.com/six-nations/history/2018/",
    standings: [
      { position: 1, team: "Ireland", played: 5, won: 5, drawn: 0, lost: 0, pointsDifference: 78, tablePoints: 26 },
      { position: 2, team: "Wales", played: 5, won: 3, drawn: 0, lost: 2, pointsDifference: 36, tablePoints: 15 },
      { position: 3, team: "Scotland", played: 5, won: 3, drawn: 0, lost: 2, pointsDifference: -27, tablePoints: 13 },
      { position: 4, team: "France", played: 5, won: 2, drawn: 0, lost: 3, pointsDifference: 14, tablePoints: 11 },
      { position: 5, team: "England", played: 5, won: 2, drawn: 0, lost: 3, pointsDifference: 10, tablePoints: 10 },
      { position: 6, team: "Italy", played: 5, won: 0, drawn: 0, lost: 5, pointsDifference: -111, tablePoints: 1 },
    ],
  },
  {
    year: 2023,
    champion: "Ireland",
    story:
      "Ireland won all five matches and sealed a Grand Slam in Dublin against England. France finished second with four wins, while Scotland took third.",
    source: "https://www.rugbypass.com/six-nations/history/2023/",
    standings: [
      { position: 1, team: "Ireland", played: 5, won: 5, drawn: 0, lost: 0, pointsDifference: 79, tablePoints: 27 },
      { position: 2, team: "France", played: 5, won: 4, drawn: 0, lost: 1, pointsDifference: 59, tablePoints: 20 },
      { position: 3, team: "Scotland", played: 5, won: 3, drawn: 0, lost: 2, pointsDifference: 20, tablePoints: 15 },
      { position: 4, team: "England", played: 5, won: 2, drawn: 0, lost: 3, pointsDifference: -35, tablePoints: 10 },
      { position: 5, team: "Wales", played: 5, won: 1, drawn: 0, lost: 4, pointsDifference: -63, tablePoints: 6 },
      { position: 6, team: "Italy", played: 5, won: 0, drawn: 0, lost: 5, pointsDifference: -60, tablePoints: 1 },
    ],
  },
  {
    year: 2024,
    champion: "Ireland",
    story:
      "Ireland retained the Championship after winning four of five matches. England ended Ireland's Grand Slam hopes in round four, but Ireland finished the job against Scotland on the final weekend.",
    source: "https://www.rugbypass.com/six-nations/history/2024/",
    standings: [
      { position: 1, team: "Ireland", played: 5, won: 4, drawn: 0, lost: 1, pointsDifference: 84, tablePoints: 20 },
      { position: 2, team: "France", played: 5, won: 3, drawn: 1, lost: 1, pointsDifference: 6, tablePoints: 15 },
      { position: 3, team: "England", played: 5, won: 3, drawn: 0, lost: 2, pointsDifference: -5, tablePoints: 14 },
      { position: 4, team: "Scotland", played: 5, won: 2, drawn: 0, lost: 3, pointsDifference: 0, tablePoints: 12 },
      { position: 5, team: "Italy", played: 5, won: 2, drawn: 1, lost: 2, pointsDifference: -34, tablePoints: 11 },
      { position: 6, team: "Wales", played: 5, won: 0, drawn: 0, lost: 5, pointsDifference: -51, tablePoints: 4 },
    ],
  },
  {
    year: 2025,
    champion: "France",
    story:
      "France returned to the top of the Championship with four wins and the strongest points difference in the field. England finished one point behind them and Ireland a further point back.",
    source: "https://www.rugbypass.com/six-nations/history/2025/",
    standings: [
      { position: 1, team: "France", played: 5, won: 4, drawn: 0, lost: 1, pointsDifference: 125, tablePoints: 21 },
      { position: 2, team: "England", played: 5, won: 4, drawn: 0, lost: 1, pointsDifference: 74, tablePoints: 20 },
      { position: 3, team: "Ireland", played: 5, won: 4, drawn: 0, lost: 1, pointsDifference: 18, tablePoints: 19 },
      { position: 4, team: "Scotland", played: 5, won: 2, drawn: 0, lost: 3, pointsDifference: -16, tablePoints: 11 },
      { position: 5, team: "Italy", played: 5, won: 1, drawn: 0, lost: 4, pointsDifference: -82, tablePoints: 5 },
      { position: 6, team: "Wales", played: 5, won: 0, drawn: 0, lost: 5, pointsDifference: -119, tablePoints: 3 },
    ],
  },
];

export const heritageRecords: HeritageRecord[] = [
  {
    title: "Most Six Nations titles since 2000",
    value: "France — 8",
    detail: "France lead the modern Six Nations era for Championship wins.",
    source: "https://www.sixnationsrugby.com/en/m6n/stats/202600",
  },
  {
    title: "Most Grand Slams in the Six Nations era",
    value: "France and Wales — 4 each",
    detail: "The official Six Nations statistics list France and Wales level on four Grand Slams since 2000.",
    source: "https://www.sixnationsrugby.com/en/m6n/stats/202600",
  },
  {
    title: "Most team points in the Six Nations era",
    value: "England — 3,666",
    detail: "England lead the official cumulative points total for the Six Nations era.",
    source: "https://www.sixnationsrugby.com/en/m6n/stats/202600",
  },
  {
    title: "Most team tries in the Six Nations era",
    value: "England — 403",
    detail: "England also lead the official cumulative try total for the Six Nations era.",
    source: "https://www.sixnationsrugby.com/en/m6n/stats/202600",
  },
];

export const rivalryTrophies: RivalryTrophy[] = [
  {
    name: "Calcutta Cup",
    fixture: "England v Scotland",
    story:
      "First contested in 1879, the Calcutta Cup is the oldest rivalry trophy in the Championship.",
  },
  {
    name: "Millennium Trophy",
    fixture: "England v Ireland",
    story:
      "Introduced in 1988 to commemorate Dublin's millennial celebrations.",
  },
  {
    name: "Centenary Quaich",
    fixture: "Ireland v Scotland",
    story:
      "Introduced in 1989, with the quaich representing friendship between Ireland and Scotland.",
  },
  {
    name: "Giuseppe Garibaldi Trophy",
    fixture: "France v Italy",
    story:
      "Contested since 2007 and named after Giuseppe Garibaldi.",
  },
  {
    name: "Auld Alliance Trophy",
    fixture: "France v Scotland",
    story:
      "Established in 2018 to honour French and Scottish rugby players who died in the First World War.",
  },
  {
    name: "Doddie Weir Cup",
    fixture: "Wales v Scotland",
    story:
      "First contested in 2018 and named in honour of former Scotland international Doddie Weir.",
  },
  {
    name: "Cuttitta Cup",
    fixture: "Italy v Scotland",
    story:
      "Introduced in 2022 in memory of former Italy captain and Scotland scrum coach Massimo Cuttitta.",
  },
  {
    name: "Solidarity Trophy",
    fixture: "France v Ireland",
    story:
      "Introduced in 2026 to celebrate the cultural, diplomatic and rugby relationship between France and Ireland.",
  },
];

export const championshipVenues: ChampionshipVenue[] = [
  {
    city: "Dublin",
    stadium: "Aviva Stadium",
    nation: "Ireland",
    note: "Ireland's modern Championship home and host of the opening fixture of the 2027 tournament.",
  },
  {
    city: "London",
    stadium: "Allianz Stadium, Twickenham",
    nation: "England",
    note: "The long-standing home of England rugby and the setting for some of the Championship's defining finishes.",
  },
  {
    city: "Saint-Denis",
    stadium: "Stade de France",
    nation: "France",
    note: "France's national stadium and the Paris-region stage for the Championship's biggest fixtures.",
  },
  {
    city: "Edinburgh",
    stadium: "Scottish Gas Murrayfield",
    nation: "Scotland",
    note: "Scotland's national rugby stadium and a central home of the Calcutta Cup rivalry.",
  },
  {
    city: "Cardiff",
    stadium: "Principality Stadium",
    nation: "Wales",
    note: "A city-centre stadium renowned for the intensity of Welsh Championship match days.",
  },
  {
    city: "Rome",
    stadium: "Stadio Olimpico",
    nation: "Italy",
    note: "Italy's current Six Nations home in Rome.",
  },
];

export const silverwareSource =
  "https://www.sixnationsrugby.com/en/m6n/news/complete-guide-to-six-nations-silverware-cups-trophies";

export const venuesSource =
  "https://www.sixnationsrugby.com/en/m6n/infos/le-calendrier-des-matchs-du-tournoi-des-six-nations-2027";
