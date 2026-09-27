export const heritageSections = [
  {
    "slug": "championship-eras",
    "title": "From Home Nations to Six Nations",
    "label": "Championship eras",
    "introduction": "Follow the Championship from its four-nation beginnings in 1883 through the arrival of France and Italy. Explore the rivalries, interruptions and reinventions that shaped the tournament we know today."
  },
  {
    "slug": "roll-of-honour",
    "title": "Six Nations Roll of Honour",
    "label": "Roll of honour",
    "introduction": "Every champion of the Six Nations era, from the first tournament in 2000 onwards. Trace the balance of power across generations and revisit the seasons when each nation took the title."
  },
  {
    "slug": "classic-matches",
    "title": "Classic Championship Matches",
    "label": "Classic matches",
    "introduction": "Step back inside the games that still start arguments and raise a smile: Croke Park in 2007, Italy’s breakthrough against France, Cardiff’s 2013 decider and the extraordinary 2019 Calcutta Cup. Read how the drama unfolded and why it mattered."
  },
  {
    "slug": "teams",
    "title": "The Six Nations Teams",
    "label": "The teams",
    "introduction": "Six shirts, six traditions and six very different paths through the Championship. Discover each nation’s identity, landmark campaigns and place in a rivalry that has lasted for generations."
  },
  {
    "slug": "players",
    "title": "Players Who Shaped the Championship",
    "label": "Player stories",
    "introduction": "Meet the players behind the numbers. From O’Driscoll’s arrival in Paris to Wilkinson’s control, Williams’s elusive running and Parisse’s defiance, these profiles explore the skills and defining moments that made their names."
  },
  {
    "slug": "milestones",
    "title": "Championship Milestones Before the Six Nations Era",
    "label": "Historic milestones",
    "introduction": "Before Italy arrived, the Championship had already produced a century of remarkable stories. Revisit Ireland’s 1948 breakthrough, the five-way tie of 1973, the arrival of a trophy and Scotland’s dramatic farewell to the Five Nations."
  },
  {
    "slug": "season-archive",
    "title": "Historic Tables & Season Stories",
    "label": "Season archive",
    "introduction": "Put the final standings beside the story of the season. Open a selected Championship to see its table, winning team and the events that turned a promising campaign into a title."
  },
  {
    "slug": "records",
    "title": "Championship Records",
    "label": "Records",
    "introduction": "Explore notable scoring and Championship records, with links to the underlying statistics. These are the benchmarks left behind by outstanding teams and individual performances."
  },
  {
    "slug": "trophies",
    "title": "Trophies & Rivalries",
    "label": "Trophies & rivalries",
    "introduction": "There is more at stake than the Championship trophy. Discover the history of the Triple Crown and the rivalry trophies that give individual fixtures an extra layer of meaning."
  },
  {
    "slug": "venues",
    "title": "Championship Venues",
    "label": "Venues",
    "introduction": "Visit the grounds that give the tournament its sense of place. Learn where each nation plays and how the stadiums and their surroundings form part of the Championship experience."
  },
  {
    "slug": "competition-history",
    "title": "Perfect XV Competition History",
    "label": "Perfect XV history",
    "introduction": "Our own roll of honour grows here. Browse completed Perfect XV competitions, their winners and full final standings, including points, exact scores and Prediction Delta."
  }
] as const;

export type HeritageSectionSlug = (typeof heritageSections)[number]["slug"];
