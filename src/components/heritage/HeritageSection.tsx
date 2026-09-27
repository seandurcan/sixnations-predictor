import Link from "next/link";
import type { ReactNode } from "react";
import { heritageSections, type HeritageSectionSlug } from "@/lib/heritage-sections";

export default function HeritageSection({ slug, children }: { slug: HeritageSectionSlug; children: ReactNode }) {
  const section = heritageSections.find((item) => item.slug === slug)!;
  return (
    <div className="mx-auto max-w-6xl scroll-mt-36 px-4 py-8 text-[var(--brand-navy)] sm:px-6">
      <nav aria-label="Heritage and History menu" className="mb-8 flex flex-wrap items-start justify-between gap-4 rounded-xl border border-[var(--brand-border)] bg-slate-50 p-4">
        <Link href="/heritage" className="rounded px-2 py-2 font-bold text-[var(--brand-blue)] underline underline-offset-4 focus-visible:outline-2">← Heritage &amp; History</Link>
        <details className="w-full sm:w-auto sm:max-w-sm">
          <summary className="cursor-pointer rounded px-2 py-2 font-semibold focus-visible:outline-2">Explore the sections</summary>
          <ul className="mt-2 grid gap-1">
            {heritageSections.map((item) => (
              <li key={item.slug}><Link href={`/heritage/${item.slug}`} aria-current={item.slug === slug ? "page" : undefined} className={`block rounded-lg px-3 py-2 text-sm hover:bg-white focus-visible:outline-2 ${item.slug === slug ? "bg-white font-bold text-[var(--brand-blue)]" : ""}`}>{item.label}</Link></li>
            ))}
          </ul>
        </details>
      </nav>
      <header className="mb-8 max-w-3xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--brand-blue)]">The Heritage collection</p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{section.title}</h1>
        <p className="mt-4 text-lg leading-8 text-[var(--brand-muted)]">{section.introduction}</p>
      </header>
      {children}
      <div className="mt-10 border-t border-[var(--brand-border)] pt-6"><Link href="/heritage" className="inline-block rounded py-2 font-semibold text-[var(--brand-blue)] underline underline-offset-4 focus-visible:outline-2">← Back to Heritage &amp; History</Link></div>
    </div>
  );
}
