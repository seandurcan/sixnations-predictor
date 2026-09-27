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
