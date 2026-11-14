/** Fixed historical snapshot from RugbyReport.docx, checked 14 November 2026.
 * These records are neither live statistics nor an official World Rugby ranking.
 * Keep the sample thresholds and source caveats visible when presenting this data.
 */
export type RugbyTestRecord = {
  nation: string;
  played: number;
  won: number;
  drawn: number;
  winPct: number;
  lost?: number;
  percentageRank?: number;
};

const sourceTables = {
  "wins": "France|944|568|36|340|60.2\nNew Zealand|715|550|24|141|76.9\nEngland|807|455|45|307|56.4\nWales|805|416|30|359|51.7\nIreland|756|380|31|345|50.3\nSouth Africa|565|362|24|179|64.1\nAustralia|708|350|21|337|49.4\nScotland|764|344|26|394|45.0\nRomania|502|283|13|206|56.4\nArgentina|506|259|14|233|51.2\nJapan|406|221|6|179|54.4\nItaly|566|214|14|338|37.8\nFiji|368|193|9|166|52.4\nSpain|416|183|13|220|44.0\nGeorgia|276|180|10|86|65.2",
  "percentages": "New Zealand|715|550|24|76.9\nGeorgia|276|180|10|65.2\nSouth Africa|565|362|24|64.1\nFrance|944|568|36|60.2\nMalta|101|57|4|56.4\nEngland|807|455|45|56.4\nRomania|502|283|13|56.4\nNamibia|182|102|2|56.0\nHong Kong China|233|127|4|54.5\nJapan|406|221|6|54.4\nCroatia|142|76|8|53.5\nSouth Korea|161|86|2|53.4\nRussia|215|113|4|52.6\nFiji|368|193|9|52.4\nKenya|139|72|4|51.8",
  "groupA": "France|944|568|36|60.2|3\nNew Zealand|715|550|24|76.9|1\nEngland|807|455|45|56.4|4\nWales|805|416|30|51.7|7\nIreland|756|380|31|50.3|9\nSouth Africa|565|362|24|64.1|2\nAustralia|708|350|21|49.4|10\nScotland|764|344|26|45.0|11\nArgentina|506|259|14|51.2|8\nJapan|406|221|6|54.4|5\nItaly|566|214|14|37.8|12\nFiji|368|193|9|52.4|6",
  "groupB": "Romania|502|283|13|56.4|2\nSpain|416|183|13|44.0|7\nGeorgia|276|180|10|65.2|1\nPortugal|332|150|15|45.2|5\nUruguay|307|147|5|47.9|4\nHong Kong China|233|127|4|54.5|3\nSamoa|280|124|11|44.3|6\nTonga|311|119|7|38.3|12\nCanada|304|117|6|38.5|11\nUnited States|291|113|5|38.8|10\nChile|227|91|4|40.1|9\nZimbabwe|179|77|2|43.0|8",
  "groupC": "Germany|358|159|9|44.4\nPoland|277|127|6|45.8\nNetherlands|277|125|8|45.1\nBelgium|274|115|10|42.0\nSweden|229|114|8|49.8\nRussia|215|113|4|52.6\nNamibia|182|102|2|56.0\nMorocco|200|96|9|48.0\nSouth Korea|161|86|2|53.4\nSwitzerland|164|78|9|47.6\nCroatia|142|76|8|53.5\nCzechia|161|76|3|47.2\nBrazil|186|73|2|39.2\nKenya|139|72|4|51.8\nUkraine|144|70|2|48.6\nDenmark|196|70|11|35.7"
} as const;

function readTable(source: string, variant: "wins" | "group" | "simple"): RugbyTestRecord[] {
  return source.trim().split("\n").map((line) => {
    const columns = line.split("|");
    const [nation, played, won, drawn] = columns;
    const common = {
      nation,
      played: Number(played),
      won: Number(won),
      drawn: Number(drawn),
    };
    if (variant === "wins") {
      return { ...common, lost: Number(columns[4]), winPct: Number(columns[5]) };
    }
    if (variant === "group") {
      return { ...common, winPct: Number(columns[4]), percentageRank: Number(columns[5]) };
    }
    return { ...common, winPct: Number(columns[4]) };
  });
}

export const allTimeMostWins = readTable(sourceTables.wins, "wins");
export const allTimeBestPercentages = readTable(sourceTables.percentages, "simple");
export const nationsChampionshipGroup = readTable(sourceTables.groupA, "group");
export const nationsCupGroup = readTable(sourceTables.groupB, "group");
export const otherNationsGroup = readTable(sourceTables.groupC, "simple");
