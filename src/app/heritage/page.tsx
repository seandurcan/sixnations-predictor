import type { Metadata } from "next";
import Link from "next/link";
import { heritageSections } from "@/lib/heritage-sections";
import { heritageSources } from "@/lib/heritage";

export const metadata: Metadata = { title: "Heritage & History | Perfect XV", description: "Explore Championship history, classic matches, player stories, records and the Perfect XV archive." };

export default function HeritagePage() {
  return (
    <div className="mx-auto max-w-6xl scroll-mt-36 px-4 py-8 text-[var(--brand-navy)] sm:px-6">
      <header className="mb-10 rounded-2xl bg-[var(--brand-navy)] px-6 py-10 text-white sm:px-10">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-sky-200">The Championship, beyond the scoreboard</p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Heritage &amp; History</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-100">A late kick. A first title. A player who changes what a nation believes is possible. The Championship is built from moments like these, carried from one generation of supporters to the next.</p>
        <p className="mt-4 max-w-3xl leading-7 text-slate-200">Choose a section below to explore the stories, people and places behind the rivalry, or visit the archive to see how the seasons finished. Each section has its own page and a menu to bring you back here.</p>
      </header>
      <section aria-labelledby="explore-heritage">
        <h2 id="explore-heritage" className="mb-6 text-2xl font-bold">Explore the collection</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {heritageSections.map((section, index) => (
            <Link key={section.slug} href={`/heritage/${section.slug}`} className="group flex flex-col rounded-xl border border-[var(--brand-border)] bg-white p-6 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-blue)]">
              <p className="text-xs font-bold tracking-widest text-[var(--brand-blue)]">{String(index + 1).padStart(2, "0")} / HERITAGE</p>
              <h3 className="mt-3 text-xl font-bold group-hover:text-[var(--brand-blue)]">{section.title}</h3>
              <p className="mb-6 mt-3 leading-7 text-[var(--brand-muted)]">{section.introduction}</p>
              <span className="mt-auto font-semibold text-[var(--brand-blue)]">Explore {section.label.toLowerCase()} <span aria-hidden="true">→</span></span>
            </Link>
          ))}
        </div>
      </section>
      <aside className="mt-10 border-t border-[var(--brand-border)] pt-6 text-sm text-[var(--brand-muted)]">
        <h2 className="font-bold text-[var(--brand-navy)]">Historical sources</h2>
        <ul className="mt-3 space-y-2">{heritageSources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="underline underline-offset-4">{source.label}</a></li>)}</ul>
      </aside>
    </div>
  );
}
