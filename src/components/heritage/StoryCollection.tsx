import type { HeritageStory } from "@/lib/heritage-stories";

export default function StoryCollection({ stories }: { stories: HeritageStory[] }) {
  return (
    <div>
      <nav aria-label="Stories on this page" className="mb-10 rounded-xl border border-[var(--brand-border)] p-5">
        <h2 className="font-bold">In this collection</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">{stories.map((story) => <li key={story.id}><a href={`#${story.id}`} className="text-sm font-semibold text-[var(--brand-blue)] underline underline-offset-4">{story.title}</a></li>)}</ul>
      </nav>
      <div className="space-y-12">{stories.map((story) => (
        <article key={story.id} id={story.id} className="scroll-mt-36 rounded-xl border border-[var(--brand-border)] bg-white px-5 py-8 sm:px-10">
          <div className="mx-auto max-w-prose">
            <p className="text-sm font-bold uppercase tracking-wide text-[var(--brand-blue)]">{story.kicker}</p>
            <h2 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{story.title}</h2>
            <p className="mt-4 border-l-4 border-[var(--brand-blue)] pl-4 font-semibold leading-7">{story.standfirst}</p>
            <div className="mt-6 space-y-5 text-base leading-8 text-[var(--brand-muted)]">{story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            <footer className="mt-6 border-t border-[var(--brand-border)] pt-4 text-sm">
              <h3 className="font-semibold">Sources &amp; further reading</h3>
              <ul className="mt-2 space-y-2">{story.sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer" className="text-[var(--brand-blue)] underline underline-offset-4">{source.label}</a></li>)}</ul>
            </footer>
          </div>
        </article>
      ))}</div>
    </div>
  );
}
