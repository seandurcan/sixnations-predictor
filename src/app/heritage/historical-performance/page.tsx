import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import HeritageSection from "@/components/heritage/HeritageSection";
import {
  strengthRecords, benchmarkCodes, benchmarkNames, rivalryWins,
  selectedRivalries, decadeLeaders, scoringRecords,
  developmentMilestones, researchSources,
} from "@/lib/rugby-performance-data";

export const metadata: Metadata = {
  title: "Historical Performance, Rivalries & Competitive Strength | Perfect XV",
  description: "Research Series 02: rugby Test performance against benchmark opponents, head-to-head rivalries, decade leaders, scoring differentials and developing nations.",
};

const chapters = [
  ["summary", "Executive summary"],
  ["strength", "01 · Strength of opposition"],
  ["rivalries", "02 · Rivalry matrix"],
  ["eras", "03 · Decade leaders"],
  ["scoring", "04 · Attack and defence"],
  ["development", "05 · Emerging nations"],
  ["conclusions", "Conclusions"],
  ["sources", "Methodology and sources"],
] as const;

function Chapter({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-32 space-y-5 border-t border-[var(--brand-border)] pt-9">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">{kicker}</p>
      <h2 className="text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}
function SourceLink({ number }: { number: number }) {
  return <a className="font-semibold text-[var(--brand-blue)] underline underline-offset-4" href={"#source-" + number}>[{number}]</a>;
}
function TableFrame({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--brand-border)] bg-white" role="region" aria-label={wide ? "Scrollable statistics table" : undefined} tabIndex={wide ? 0 : undefined}>
      {children}
    </div>
  );
}
const headingCell = "px-3 py-3 text-right font-semibold whitespace-nowrap";
const numericCell = "px-3 py-2 text-right tabular-nums";
const countryCell = "px-3 py-2 text-left font-semibold whitespace-nowrap";

function StrengthChart() {
  return (
    <figure className="rounded-xl border border-[var(--brand-border)] bg-white p-4 sm:p-6">
      <figcaption className="mb-4">
        <h3 className="text-lg font-bold">Raw versus equal-opponent win percentages</h3>
        <p className="mt-1 text-sm text-[var(--brand-muted)]">2000–18 July 2026, against the other nine benchmark countries.</p>
      </figcaption>
      <div className="mb-5 flex flex-wrap gap-4 text-xs">
        <span><span aria-hidden="true" className="mr-2 inline-block h-3 w-3 rounded-sm bg-sky-900" />Raw win %</span>
        <span><span aria-hidden="true" className="mr-2 inline-block h-3 w-3 rounded-sm bg-teal-700" />Equal-opponent index</span>
      </div>
      <ol className="space-y-4">
        {strengthRecords.map(([name, , , , raw, balanced]) => (
          <li key={name} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <span className="text-xs font-semibold sm:text-sm">{name}</span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-3 min-w-0 flex-1 overflow-hidden rounded bg-slate-100"><div className="h-full bg-sky-900" style={{ width: raw + "%" }} /></div>
                <span className="w-12 text-right text-xs tabular-nums">{raw.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 min-w-0 flex-1 overflow-hidden rounded bg-slate-100"><div className="h-full bg-teal-700" style={{ width: balanced + "%" }} /></div>
                <span className="w-12 text-right text-xs tabular-nums">{balanced.toFixed(1)}%</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </figure>
  );
}
function ScoringChart() {
  const extent = 22;
  return (
    <figure className="rounded-xl border border-[var(--brand-border)] bg-white p-4 sm:p-6">
      <figcaption className="mb-4">
        <h3 className="text-lg font-bold">Average scoring differential per Test</h3>
        <p className="text-sm text-[var(--brand-muted)]">The zero line separates positive and negative average margins.</p>
      </figcaption>
      <ol className="space-y-3">
        {scoringRecords.map(([nation, , , , net]) => (
          <li key={nation} className="grid grid-cols-[6rem_minmax(0,1fr)_3.1rem] items-center gap-2 sm:grid-cols-[9rem_minmax(0,1fr)_3.5rem]">
            <span className="text-xs font-semibold sm:text-sm">{nation}</span>
            <div className="grid h-5 grid-cols-2">
              <div className="flex items-stretch justify-end border-r border-slate-500 bg-slate-50">
                {net < 0 && <span className="h-full bg-orange-600" style={{ width: (Math.abs(net) / extent * 100) + "%" }} />}
              </div>
              <div className="flex items-stretch justify-start bg-slate-50">
                {net >= 0 && <span className="h-full bg-teal-700" style={{ width: (net / extent * 100) + "%" }} />}
              </div>
            </div>
            <span className="text-right text-xs font-semibold tabular-nums">{net > 0 ? "+" : ""}{net.toFixed(1)}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

export default function WorldRugbyPerformancePage() {
  return (
    <HeritageSection slug="historical-performance">
      <div className="space-y-10 leading-7">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--brand-muted)]">
          <span>World Rugby / Research Series 02 · Prepared 21 November 2026</span>
          <Link href="/heritage/all-time-test-records" className="font-semibold text-[var(--brand-blue)] underline underline-offset-4">Read Series 01: All-time Test records</Link>
        </div>

        <nav aria-label="Sections of this research report" className="rounded-xl border border-[var(--brand-border)] bg-slate-50 p-5">
          <h2 className="font-bold">Explore this analysis</h2>
          <ul className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {chapters.map(([id, label]) => (
              <li key={id}><a href={"#" + id} className="text-[var(--brand-blue)] underline underline-offset-4">{label}</a></li>
            ))}
          </ul>
        </nav>

        <Chapter id="summary" kicker="Section 00" title="Executive summary">
          <p>This analysis compares ten long-established national sides: Argentina, Australia, England, France, Ireland, Italy, New Zealand, Scotland, South Africa and Wales. It examines both long-term rivalries and modern results against a common opponent set.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["2,882", "Historical matches", "Selected meetings between the ten teams, 1871–18 July 2026"],
              ["1,287", "Modern matches", "Selected meetings from 1 January 2000–18 July 2026"],
              ["2026", "Contemporary developments", "Separately sourced milestones and competition updates to 20 November"],
            ].map(([number, label, detail]) => (
              <div key={label} className="rounded-xl border border-[var(--brand-border)] bg-white p-5">
                <p className="text-3xl font-black text-[var(--brand-blue)]">{number}</p>
                <h3 className="mt-2 font-bold">{label}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--brand-muted)]">{detail}</p>
              </div>
            ))}
          </div>
          <p><strong>New Zealand</strong> dominate the modern benchmark with 232 wins in 290 Tests (80.0%) and the highest equal-opponent index (85.0%). Ireland narrowly lead South Africa on raw win percentage (60.3% to 60.2%), but South Africa lead on equal-opponent percentage (66.2% to 58.8%).</p>
          <p>Rivalries are unevenly played, the leading side changes between decades, and emerging nations have recorded notable wins without necessarily matching the established powers consistently.</p>
          <p className="text-sm text-[var(--brand-muted)]">Fiji and Japan play in the 2026 Nations Championship but do not belong to this report’s fixed ten-team historical sample. They appear in the development chapter instead. Post-18 July 2026 matches are not included in the numerical aggregates.</p>
        </Chapter>

        <Chapter id="strength" kicker="Part 01" title="Who really beats the strongest opposition?">
          <p>Matches against each nation’s other nine benchmark countries, 1 January 2000–18 July 2026. The raw win percentage is based on all appearances; the balanced percentage is the unweighted average of nine opponent-specific winning percentages.</p>
          <TableFrame wide>
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead className="bg-[var(--brand-navy)] text-white"><tr>
                <th scope="col" className="px-3 py-3 text-left">Nation</th>
                {["Played", "Won", "Draw", "Win %", "Balanced %"].map(label=><th scope="col" key={label} className={headingCell}>{label}</th>)}
              </tr></thead>
              <tbody>
                {strengthRecords.map(([nation, played, won, drawn, raw, balanced]) => (
                  <tr key={nation} className="border-t border-slate-200 even:bg-slate-50">
                    <th scope="row" className={countryCell}>{nation}</th>
                    {[played, won, drawn].map((v,i)=><td key={i} className={numericCell}>{v}</td>)}
                    <td className={numericCell}>{raw.toFixed(1)}%</td><td className={numericCell}>{balanced.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableFrame>
          <StrengthChart />
          <p>New Zealand lead both measures. Australia rise from 48.5% raw to 55.9% balanced because so many fixtures were against New Zealand. South Africa’s index rises from 60.2% to 66.2%, whereas Ireland’s falls from 60.3% to 58.8%.</p>
          <p className="text-sm text-[var(--brand-muted)]">Equal-opponent weighting reduces the effect of fixture frequency, but may give disproportionate importance to opponents faced only a few times. The balanced percentage is a descriptive index, not an official World Rugby ranking or validated Elo rating.</p>
        </Chapter>

        <Chapter id="rivalries" kicker="Part 02" title="The head-to-head rivalry matrix">
          <p>All recorded matches between the ten benchmark nations from 1871 to 18 July 2026. Each figure is the number of Tests <strong>won by the row nation</strong> against the column nation. The reverse cell gives the other team’s wins. Draws are not included in the matrix.</p>
          <p className="text-sm text-[var(--brand-muted)]">On a phone, scroll the table horizontally to see every opponent.</p>
          <TableFrame wide>
            <table className="w-full min-w-[760px] border-collapse text-xs sm:text-sm">
              <thead className="bg-[var(--brand-navy)] text-white">
                <tr><th scope="col" className="sticky left-0 z-10 bg-[var(--brand-navy)] px-3 py-3 text-left whitespace-nowrap">Wins ↓ / vs →</th>
                  {benchmarkCodes.map(code=><th key={code} title={benchmarkNames[code]} scope="col" className="px-3 py-3 text-right">{code}</th>)}
                </tr>
              </thead>
              <tbody>
                {rivalryWins.map((row, i) => (
                  <tr key={benchmarkCodes[i]} className="border-t border-slate-200 even:bg-slate-50">
                    <th scope="row" title={benchmarkNames[benchmarkCodes[i]]} className="sticky left-0 bg-white px-3 py-2 text-left font-bold even:bg-slate-50">{benchmarkCodes[i]}</th>
                    {row.map((v, j)=><td key={benchmarkCodes[j]} className={numericCell}>{v===null?"—":v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableFrame>
          <h3 className="text-lg font-bold">Selected rivalries: win–draw–loss records</h3>
          <p className="text-sm text-[var(--brand-muted)]">All statistics are stated from the first-named nation’s perspective.</p>
          <TableFrame wide>
            <table className="w-full min-w-[580px] text-sm">
              <thead className="bg-[var(--brand-navy)] text-white"><tr>
                <th scope="col" className="px-3 py-3 text-left">Perspective</th>
                {["Played", "Won", "Drawn", "Lost"].map(label=><th scope="col" className={headingCell} key={label}>{label}</th>)}
              </tr></thead>
              <tbody>
                {selectedRivalries.map(([name, played, won, drawn, lost]) => (
                  <tr key={name} className="border-t border-slate-200 even:bg-slate-50">
                    <th scope="row" className={countryCell}>{name}</th>
                    {[played,won,drawn,lost].map((v,i)=><td key={i} className={numericCell}>{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableFrame>
          <p>The New Zealand–Australia rivalry was the most frequent pairing in the panel at 181 Tests. Scotland had not defeated New Zealand in 33 selected meetings by the cutoff. These counts exclude all later fixtures.</p>
        </Chapter>

        <Chapter id="eras" kicker="Part 03" title="The leading team by decade">
          <p>Leaders within the fixed ten-team set, measured by outright winning percentage against other benchmark teams. A nation must have played at least eight qualifying Tests during a decade.</p>
          <TableFrame wide>
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-[var(--brand-navy)] text-white"><tr>
                {["Decade", "Leader", "Wins / Tests", "Win %"].map((label,i)=><th key={label} scope="col" className={"px-3 py-3 "+(i===0||i===1?"text-left":"text-right")}>{label}</th>)}
              </tr></thead>
              <tbody>
                {decadeLeaders.map(([decade,leader,record,pct])=>(
                  <tr key={decade} className="border-t border-slate-200 even:bg-slate-50">
                    <th scope="row" className={countryCell}>{decade}</th><td className="px-3 py-2">{leader}</td>
                    <td className={numericCell}>{record}</td><td className={numericCell}>{pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableFrame>
          <div className="space-y-3 rounded-xl bg-slate-50 p-5 text-sm">
            <p><strong>Before 1950:</strong> Tests were less frequent and concentrated among the Home Nations; historical schedule differences limit conclusions about global strength.</p>
            <p><strong>1950–1989:</strong> New Zealand led three of four decades, with South Africa leading in the 1970s in this sample.</p>
            <p><strong>1990–2019:</strong> New Zealand led all three completed decades, reaching 100 wins from 115 matches (87.0%) in the 2010s.</p>
            <p><strong>2020–2026:</strong> South Africa lead the partial decade (45/60; 75.0%), just ahead of Ireland (44/60; 73.3%).</p>
          </div>
          <p className="text-sm text-[var(--brand-muted)]">*The 2020s are incomplete, ending 18 July 2026. The 1940s were affected by wartime disruption. No adjustment was made for periods when sides played few or no matches.</p>
        </Chapter>

        <Chapter id="scoring" kicker="Part 04" title="Attack, defence and winning margins">
          <p>Points scored and conceded per game in the selected modern benchmark matches, 1 January 2000–18 July 2026.</p>
          <TableFrame wide>
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-[var(--brand-navy)] text-white"><tr>
                <th scope="col" className="px-3 py-3 text-left">Nation</th>
                {["Games", "Points for / gm", "Against / gm", "Net / gm"].map(label=><th key={label} scope="col" className={headingCell}>{label}</th>)}
              </tr></thead>
              <tbody>
                {scoringRecords.map(([nation,games,forAvg,againstAvg,net])=>(
                  <tr key={nation} className="border-t border-slate-200 even:bg-slate-50">
                    <th scope="row" className={countryCell}>{nation}</th>
                    <td className={numericCell}>{games}</td>
                    <td className={numericCell}>{forAvg.toFixed(1)}</td>
                    <td className={numericCell}>{againstAvg.toFixed(1)}</td>
                    <td className={numericCell}>{net>0?"+":""}{net.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableFrame>
          <ScoringChart />
          <p>New Zealand have the widest positive average point differential at +14.8 per match, scoring 32.3 and conceding 17.5. England (+5.5), South Africa (+5.3) and Ireland (+4.1) also have positive differentials. Italy average −21.0 against this opposition group.</p>
          <p className="text-sm text-[var(--brand-muted)]">Because rugby scoring values have changed over time, cross-century point totals cannot be compared directly without adjustment. This analysis does not include try or tackle averages, which require a consistent event-level dataset.</p>
        </Chapter>

        <Chapter id="development" kicker="Part 05" title="The progress of developing rugby nations">
          <p>These independently sourced results demonstrate that developing sides can defeat established or higher-ranked opponents. They are examples, not a complete census of every upset, and are not drawn from the ten-country benchmark dataset.</p>
          <TableFrame wide>
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[var(--brand-navy)] text-white">
                <tr><th scope="col" className="px-3 py-3 text-left">Date</th><th scope="col" className="px-3 py-3 text-left">Result</th><th scope="col" className="px-3 py-3 text-left">Significance</th><th scope="col" className="px-3 py-3 text-left">Source</th></tr>
              </thead>
              <tbody>
                {developmentMilestones.map(([date,result,meaning,source])=>(
                  <tr key={date} className="border-t border-slate-200 even:bg-slate-50">
                    <td className="px-3 py-3 whitespace-nowrap">{date}</td>
                    <th scope="row" className={countryCell}>{result}</th>
                    <td className="px-3 py-3">{meaning}</td>
                    <td className="px-3 py-3"><SourceLink number={source} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableFrame>
          <h3 className="text-lg font-bold">What the new competitions change</h3>
          <p>Fiji and Japan participate in the 2026 Nations Championship alongside the Six Nations and SANZAAR nations. The 2026 Nations Cup creates a separate 12-team event for developing unions, including cross-regional fixtures. <SourceLink number={12} /></p>
          <p>By 14 November 2026, Georgia and the United States had each won five Nations Cup matches in five and secured their pool championships with a round remaining. On 20 November, Canada won 27–26 in Romania, its first win on Romanian soil. <SourceLink number={11} /> <SourceLink number={10} /></p>
          <p>A one-off victory shows that a team can beat strong opposition; it does not prove long-term parity. The research recommends tracking at least five seasons of fixture access, win rates, average point differential and rankings at match time.</p>
        </Chapter>

        <Chapter id="conclusions" kicker="Section 06" title="Conclusions and next-stage research">
          <ol className="list-decimal space-y-3 pl-5">
            <li><strong>New Zealand stand out:</strong> their 80.0% outright win rate against the other nine benchmark countries since 2000 is clearly highest.</li>
            <li><strong>Opponent mix changes the picture:</strong> Ireland narrowly lead South Africa on raw percentage, while South Africa lead on the schedule-balanced index.</li>
            <li><strong>Rivalry frequency matters:</strong> some nations play each other four or five times more often, so raw win totals do not give a like-for-like comparison.</li>
            <li><strong>Dominance varies by era:</strong> New Zealand led many completed decades, while South Africa lead the partial 2020–2026 sample.</li>
            <li><strong>Emerging sides have meaningful breakthroughs:</strong> Japan, Georgia, Fiji and Portugal have milestone wins, and the 2026 competition structure increases opportunities.</li>
          </ol>
        </Chapter>

        <Chapter id="sources" kicker="Sections 06–07" title="Methodology, limits and source register">
          <p><strong>Reproducible match dataset:</strong> The analysis uses <a href="https://github.com/TommyKilbourn/rugby-rankings" target="_blank" rel="noopener noreferrer" className="text-[var(--brand-blue)] underline">TommyKilbourn/rugby-rankings</a>, file <code>data/rugby_results_master.csv</code>, at commit <code className="break-all">bcb462ad8abae114efb8dcdd773beacb9e29ee6a</code>. The source file contains 3,529 rows including representative matches. The report filters to fixtures where both teams belong to the exact ten-country list, yielding 2,882 unique Tests from 1871–18 July 2026, of which 1,287 occurred from 1 January 2000 onward.</p>
          <p><strong>Calculation definitions:</strong> Outright win percentage is wins divided by matches times 100, with draws counting only toward matches. Balanced percentage is the unweighted arithmetic mean of nine individual opponent-specific win percentages in the modern sample. Net scoring is (points for − points against) divided by matches. The decade leader is the highest win percentage among teams with at least eight eligible matches that decade.</p>
          <p><strong>Limits:</strong> This is independent research, not World Rugby’s official ranking. The ten-team filter excludes Tests against Fiji, Japan and other developing nations. Equal weighting may overstate scarce matchups. Home advantage, evolving rankings, date and uncertainty would be needed for a more robust model. Earlier score data and changes to rugby points rules limit historical scoring comparisons.</p>
          <h3 className="text-lg font-bold">Primary references and match reports</h3>
          <ol className="space-y-3">
            {researchSources.map(([topic,label,url],i)=>(
              <li id={"source-"+(i+1)} key={url} className="scroll-mt-32 rounded-lg bg-slate-50 px-4 py-3 text-sm">
                <span className="font-semibold">[{i+1}] {topic} — </span>
                <a href={url} target="_blank" rel="noopener noreferrer" className="break-words text-[var(--brand-blue)] underline underline-offset-4">{label}</a>
              </li>
            ))}
          </ol>
          <p className="text-sm text-[var(--brand-muted)]">Original research prepared 21 November 2026. The calculated match dataset ends 18 July 2026; separately cited development milestones extend to 20 November 2026. Fixtures played later are not counted in these tables.</p>
          <p><Link href="/heritage/all-time-test-records" className="font-semibold text-[var(--brand-blue)] underline underline-offset-4">Previous research: All-Time International Test Records</Link></p>
        </Chapter>
      </div>
    </HeritageSection>
  );
}
