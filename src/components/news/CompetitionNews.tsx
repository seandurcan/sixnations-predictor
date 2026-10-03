"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import { formatCompetitionTitle } from "@/lib/competitionTitle";

type NewsCompetition = {
  id: number;
  name: string;
  year: number;
  status: string;
  firstKickoff: string | null;
};

type NewsStory = {
  tournamentId: number;
  round: number;
  kind?: "round" | "introduction";
  headline: string;
  standfirst?: string;
  body: string;
  generatedAt: string;
  generation?: "ai" | "fallback";
  sources?: Array<{ label: string; url: string }>;
};

export default function CompetitionNews({
  competitions,
  stories,
  initialCompetitionId,
}: {
  competitions: NewsCompetition[];
  stories: NewsStory[];
  initialCompetitionId: number | null;
}) {
  const fallbackId =
    competitions.find((competition) => competition.id === initialCompetitionId)?.id ??
    competitions[0]?.id ??
    null;

  const [selectedCompetitionId, setSelectedCompetitionId] =
    useState<number | null>(fallbackId);

  useEffect(() => {
    const value = Number(new URLSearchParams(window.location.search).get("competition"));
    if (
      Number.isInteger(value) &&
      competitions.some((competition) => competition.id === value)
    ) {
      setSelectedCompetitionId(value);
    }
  }, [competitions]);

  const selectedCompetition = competitions.find(
    (competition) => competition.id === selectedCompetitionId
  ) ?? null;

  const selectedStories = useMemo(
    () =>
      stories
        .filter((story) => story.tournamentId === selectedCompetitionId)
        .sort(
          (a, b) =>
            Date.parse(b.generatedAt) - Date.parse(a.generatedAt) ||
            b.round - a.round
        ),
    [stories, selectedCompetitionId]
  );

  function chooseCompetition(id: number) {
    setSelectedCompetitionId(id);

    const url = new URL(window.location.href);
    url.searchParams.set("competition", String(id));
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }

  if (competitions.length === 0) {
    return (
      <Card title="No competitions available">
        <p className="text-sm text-[var(--brand-muted)]">
          News competition buttons will appear automatically when a competition becomes active.
        </p>
      </Card>
    );
  }

  return (
    <>
      <div
        className="mb-6 overflow-x-auto pb-2"
        aria-label="Select news competition"
      >
        <div className="flex min-w-max gap-2">
          {competitions.map((competition) => {
            const selected = competition.id === selectedCompetitionId;
            return (
              <button
                key={competition.id}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseCompetition(competition.id)}
                className={
                  "whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-semibold transition-colors " +
                  (selected
                    ? "border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white"
                    : "border-[var(--brand-border)] bg-white text-[var(--brand-navy)] hover:bg-[var(--brand-soft-lime)]")
                }
              >
                {formatCompetitionTitle(competition.name, competition.year)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {selectedStories.length === 0 ? (
          <Card
            title={
              selectedCompetition
                ? `No stories yet — ${formatCompetitionTitle(
                    selectedCompetition.name,
                    selectedCompetition.year
                  )}`
                : "No stories yet"
            }
          >
            <p className="text-sm text-[var(--brand-muted)]">
              Competition reports will appear here automatically after completed rounds.
            </p>
          </Card>
        ) : (
          selectedStories.map((story) => (
            <Card
              key={story.tournamentId + "-" + story.round}
              title={story.headline}
            >
              {story.standfirst ? (
                <p className="mb-5 text-base font-semibold leading-7 text-[var(--brand-navy)]">
                  {story.standfirst}
                </p>
              ) : null}

              <div className="space-y-4">
                {story.body
                  .split(/\n{2,}/)
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index} className="leading-7">
                      {paragraph}
                    </p>
                  ))}
              </div>

              {story.sources?.length ? (
                <div className="mt-5 border-t border-slate-200 pt-3 text-xs text-[var(--brand-muted)]">
                  <span className="font-semibold">Official sources:</span>{" "}
                  {story.sources.map((source, index) => (
                    <span key={source.url}>
                      {index > 0 ? " · " : ""}
                      <a
                        className="underline underline-offset-2 hover:text-[var(--brand-blue)]"
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.label}
                      </a>
                    </span>
                  ))}
                </div>
              ) : null}

              <p className={`${story.sources?.length ? "mt-2" : "mt-5 border-t border-slate-200 pt-3"} text-xs text-[var(--brand-muted)]`}>
                {story.kind === "introduction" ? "Competition Preview" : `Round ${story.round}`} {" - "}
                {story.generation === "ai"
                  ? "AI-written from verified Perfect XV competition data"
                  : "Generated from verified Perfect XV competition data"}
              </p>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
