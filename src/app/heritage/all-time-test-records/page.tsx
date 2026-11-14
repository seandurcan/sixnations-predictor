import type { Metadata } from "next";
import Link from "next/link";
import HeritageSection from "@/components/heritage/HeritageSection";
import {
  allTimeMostWins,
  allTimeBestPercentages,
  nationsChampionshipGroup,
  nationsCupGroup,
  otherNationsGroup,
  type RugbyTestRecord,
} from "@/lib/rugby-test-records";

export const metadata: Metadata = {
  title: "All-Time Rugby Union Test Records | Perfect XV",
  description: "Historical men's rugby union international win totals, winning percentages and 2026 competition group comparisons, based on a source snapshot checked 14 November 2026.",
};

const chapters = [
  ["overview", "Overview"],
  ["most-wins", "Most Test victories"],
  ["win-percentage", "Win percentages"],
  ["nations-championship", "Group A"],
  ["nations-cup", "Group B"],
  ["other-nations", "Group C"],
  ["comparison", "Findings"],
  ["methodology", "Methodology & sources"],
] as const;

function RankingTable({
  records,
  losses = false,
  percentageRank = false,
}: {
  records: RugbyTestRecord[];
  losses?: boolean;
  percentageRank?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--brand-border)] bg-white">
      <table className="w-full border-collapse text-sm tabular-nums">
        <thead className="bg-[var(--brand-navy)] text-white">
          <tr>
            <th scope="col" className="px-3 py-3 text-left">#</th>
            <th scope="col" className="px-3 py-3 text-left">Nation</th>
            <th scope="col" className="px-3 py-3 text-right">Played</th>
            <th scope="col" className="px-3 py-3 text-right">Won</th>
            <th scope="col" className="px-3 py-3 text-right">Drawn</th>
            {losses && <th scope="col" className="px-3 py-3 text-right">Lost</th>}
            <th scope="col" className="px-3 py-3 text-right">Win %</th>
            {percentageRank && <th scope="col" className="px-3 py-3 text-right">% rank</th>}
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => (
            <tr key={record.nation} className="border-t border-slate-200 even:bg-slate-50">
              <td className="px-3 py-2 text-left font-semibold">{index + 1}</td>
              <th scope="row" className="px-3 py-2 text-left font-medium whitespace-nowrap">{record.nation}</th>
              <td className="px-3 py-2 text-right">{record.played}</td>
              <td className="px-3 py-2 text-right font-semibold">{record.won}</td>
              <td className="px-3 py-2 text-right">{record.drawn}</td>
              {losses && <td className="px-3 py-2 text-right">{record.lost}</td>}
              <td className="px-3 py-2 text-right">{record.winPct.toFixed(1)}%</td>
              {percentageRank && <td className="px-3 py-2 text-right">{record.percentageRank}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoricalBars({
  records,
  measure,
  title,
  caption,
}: {
  records: RugbyTestRecord[];
  measure: "won" | "winPct";
  title: string;
  caption: string;
}) {
  const maximum = Math.max(...records.map((record) => record[measure]));
  return (
    <figure className="rounded-xl border border-[var(--brand-border)] bg-white p-4 sm:p-6">
      <figcaption className="mb-5">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-1 text-sm text-[var(--brand-muted)]">{caption}</p>
      </figcaption>
      <ol className="space-y-3">
        {records.map((record, index) => (
          <li key={record.nation} className="flex items-center gap-2 sm:gap-3">
            <span className="w-28 shrink-0 text-xs sm:w-36 sm:text-sm">{record.nation}</span>
            <span className="h-5 min-w-0 flex-1 overflow-hidden rounded bg-slate-100">
              <span
                className={"block h-full rounded " + (index === 0 ? "bg-teal-700" : "bg-sky-900")}
                style={{ width: String((record[measure] / maximum) * 100) + "%" }}
              />
            </span>
            <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums sm:text-sm">
              {measure === "won" ? record.won : record.winPct.toFixed(1) + "%"}
            </span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

function Chapter({
  id,
  eyebrow,
  heading,
  children,
}: {
  id: string;
  eyebrow: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-32 space-y-5 border-t border-[var(--brand-border)] pt-9">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">{eyebrow}</p>
      <h2 className="text-2xl font-bold sm:text-3xl">{heading}</h2>
      {children}
    </section>
  );
}

export default function AllTimeTestRecordsPage() {
  return (
    <HeritageSection slug="all-time-test-records">
      <div className="space-y-10 leading-7">
        <nav aria-label="On this report" className="rounded-xl border border-[var(--brand-border)] bg-white p-5">
          <h2 className="font-bold">In this report</h2>
          <ul className="mt-3 grid gap-x-5 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {chapters.map(([id, label]) => (
              <li key={id}><a href={"#" + id} className="text-[var(--brand-blue)] underline underline-offset-4">{label}</a></li>
            ))}
          </ul>
        </nav>

        <Chapter id="overview" eyebrow="Executive finding" heading="Two ways to lead the world">
          <p>France lead the reviewed national-team dataset on cumulative victories, with <strong>568 wins from 944 Tests</strong>. New Zealand lead on outright winning percentage, winning <strong>550 of 715 Tests (76.9%)</strong>. France have 18 more recorded wins, but have played 229 more Tests.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["568", "France", "Most recorded Test victories"],
              ["76.9%", "New Zealand", "Best outright winning percentage"],
              ["65.2%", "Georgia", "Highest Group B win percentage"],
            ].map(([number, nation, detail]) => (
              <div key={nation} className="rounded-xl border border-[var(--brand-border)] bg-white p-5">
                <p className="text-3xl font-bold text-[var(--brand-blue)]">{number}</p>
                <p className="mt-2 font-bold">{nation}</p>
                <p className="mt-1 text-sm text-[var(--brand-muted)]">{detail}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <HistoricalBars records={allTimeMostWins.slice(0, 10)} measure="won" title="Most recorded international victories" caption="Top 10 nations by cumulative wins" />
            <HistoricalBars records={allTimeBestPercentages.slice(0, 10)} measure="winPct" title="Highest outright win percentages" caption="At least 100 recorded Tests; draws receive no win credit" />
          </div>
        </Chapter>

        <Chapter id="most-wins" eyebrow="Section 01" heading="World top 15: most Test victories">
          <p>Ranked by the number of historical wins. The winning percentage is included for comparison, but the ranking itself rewards the accumulation of victories across long international playing histories.</p>
          <RankingTable records={allTimeMostWins} losses />
          <p className="text-sm text-[var(--brand-muted)]">Teams with more fixtures have more opportunities to accumulate victories; this table does not adjust for opponent strength, era, or match frequency.</p>
        </Chapter>

        <Chapter id="win-percentage" eyebrow="Section 02" heading="World top 15: outright winning percentage">
          <p>Calculated as <strong>100 × wins ÷ Tests played</strong>. Draws count as matches played but not as victories. Countries need a minimum of 100 recorded Tests to qualify for this particular table.</p>
          <RankingTable records={allTimeBestPercentages} />
          <p className="text-sm text-[var(--brand-muted)]">Kenya (72 wins from 139 Tests; 51.8%) takes 15th place in the checked dataset, just ahead of Wales (416 from 805; 51.7%). The 100-Test minimum helps reduce small-sample distortion but does not correct differences in opposition.</p>
        </Chapter>

        <Chapter id="nations-championship" eyebrow="Section 03 · Group A" heading="2026 Nations Championship teams">
          <p>The 12 unions in the 2026 Nations Championship, ranked below by their <em>all-time</em> Test victories, not just 2026 competition results. The final column gives each team’s win-percentage rank within this group.</p>
          <RankingTable records={nationsChampionshipGroup} percentageRank />
          <p className="text-sm text-[var(--brand-muted)]">Most victories: France (568), New Zealand (550) and England (455). Highest winning percentages: New Zealand (76.9%), South Africa (64.1%) and France (60.2%).</p>
          <HistoricalBars records={[...nationsChampionshipGroup].sort((a, b) => b.winPct - a.winPct)} measure="winPct" title="Group A: win percentage by nation" caption="All recorded historical Tests, not the 2026 tournament alone" />
        </Chapter>

        <Chapter id="nations-cup" eyebrow="Section 04 · Group B" heading="2026 Nations Cup teams">
          <p>The 12 participants in the 2026 Nations Cup, ranked by all-time Test victories. This is a competition-based grouping, not a permanent formal World Rugby “Tier 2” classification.</p>
          <RankingTable records={nationsCupGroup} percentageRank />
          <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--brand-muted)]">
            <li>Romania have the most wins in this group: 283 from 502 Tests (56.4%).</li>
            <li>Georgia lead by win percentage: 180 from 276 (65.2%).</li>
            <li>Spain have 183 victories compared with Georgia’s 180, but have played 140 more Tests.</li>
            <li>Hong Kong China are third within the group by percentage, at 54.5%.</li>
          </ul>
        </Chapter>

        <Chapter id="other-nations" eyebrow="Section 05 · Group C" heading="Other active national sides">
          <p>The highest historical win totals among current national teams outside the two named 2026 competitions. This informal “Group C” is not an official Tier 3: its members have very different rugby histories.</p>
          <RankingTable records={otherNationsGroup} />
          <p className="text-sm text-[var(--brand-muted)]">Ukraine and Denmark share 70 wins, so 16 countries are shown to preserve the tie. Namibia have the highest winning percentage among these 16 nations (56.0%). Malta are outside this group’s top 16 by wins, but have a higher 56.4% rate.</p>
        </Chapter>

        <Chapter id="comparison" eyebrow="Section 06" heading="Comparison and principal findings">
          <div className="overflow-x-auto rounded-xl border border-[var(--brand-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[var(--brand-navy)] text-white">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left">Group</th>
                  <th scope="col" className="px-3 py-3 text-left">Most wins</th>
                  <th scope="col" className="px-3 py-3 text-right">Wins</th>
                  <th scope="col" className="px-3 py-3 text-left">Best win %</th>
                  <th scope="col" className="px-3 py-3 text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["A · Nations Championship", "France", "568", "New Zealand", "76.9%"],
                  ["B · Nations Cup", "Romania", "283", "Georgia", "65.2%"],
                  ["C · Other nations*", "Germany", "159", "Namibia", "56.0%"],
                ].map((row) => (
                  <tr key={row[0]} className="border-t border-slate-200 even:bg-slate-50">
                    {row.map((value, index) => <td key={index} className={"px-3 py-3 " + (index === 2 || index === 4 ? "text-right" : "text-left")}>{value}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-[var(--brand-muted)]">*Group C’s best percentage is among the 16 teams listed above, not among every country outside Groups A and B.</p>
          <p>New Zealand’s 76.9% leads the overall percentage list. South Africa are second in Group A with 64.1%. Georgia’s 65.2% is higher than that of every Group A nation apart from New Zealand, but the opposition mix is markedly different. Win counts, percentages and opponent-adjusted strength measure different aspects of historical performance; none alone determines the “greatest” nation.</p>
        </Chapter>

        <Chapter id="methodology" eyebrow="Appendix" heading="Methodology, limitations & sources">
          <p><strong>Source and period:</strong> These historical counts come from TheBreakdown’s “Every nation” list, consulted on 14 November 2026. Leading-team pages had results through 8 November 2026; some other teams had older latest-match dates. They are not asserted to include every Test through 14 November.</p>
          <p><strong>Scope:</strong> Current men’s senior national sides. The list excludes the British & Irish Lions, historical/defunct nations such as the USSR and Czechoslovakia, “A” sides, youth teams, sevens, club and provincial teams.</p>
          <p><strong>Grouping:</strong> Group A is the 12 teams of the 2026 Nations Championship; Group B the 12 of the 2026 Nations Cup; Group C other national sides. These are analytical group labels rather than permanent official tiers.</p>
          <p><strong>Important caveats:</strong> The dataset is not independently re-certified match by match. Early and smaller-nation records may contain source placeholders or differ between databases. These standings do not weight opposition quality, home advantage, match importance, era or frequency of play. A 100-Test percentage threshold changes the selection pool but does not remove all bias.</p>
          <p><strong>Definition:</strong> TheBreakdown’s displayed “win rate” sometimes awards half-credit for drawn games. This analysis deliberately uses only outright victories divided by Tests played, so the figures can differ from the source’s display.</p>
          <h3 className="text-lg font-bold">Primary references</h3>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li><a href="https://thebreakdown.zone/teams?show=all" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-blue)] underline">TheBreakdown — every nation and complete historical records</a></li>
            <li><a href="https://thebreakdown.zone/about/data" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-blue)] underline">TheBreakdown — data provenance and filters</a></li>
            <li><a href="https://thebreakdown.zone/teams/new-zealand" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-blue)] underline">TheBreakdown — New Zealand Test record</a></li>
            <li><a href="https://www.world.rugby/news/1046139/november-schedule-confirmed-for-climax-of-world-rugby-nations-cup-2026" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-blue)] underline">World Rugby — 2026 Nations Cup structure</a></li>
            <li><a href="https://springboks.rugby/tournaments/nations-championship" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-blue)] underline">South African Rugby — 2026 Nations Championship</a></li>
          </ol>
          <p className="text-sm text-[var(--brand-muted)]">Report prepared 14 November 2026. The figures are a dated research snapshot and may change with subsequent fixtures or data corrections.</p>
          <p><Link href="/heritage/records" className="text-sm font-semibold text-[var(--brand-blue)] underline underline-offset-4">Browse Six Nations Championship records</Link></p>
        </Chapter>
      </div>
    </HeritageSection>
  );
}
