import Card from "@/components/ui/Card";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import { listCompetitionStories } from "@/lib/competitionStories";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const stories = await listCompetitionStories();

  return (
    <main className="bg-white p-4 text-[var(--brand-navy)] sm:p-8">
      <PageContainer>
        <PageHeader
          title="Perfect XV News"
          subtitle="Round-by-round reports from the Perfect XV sports desk"
        />

        <div className="space-y-6">
          {stories.length === 0 ? (
            <Card title="No stories yet">
              <p className="text-sm text-[var(--brand-muted)]">
                Competition reports will appear here automatically after completed rounds.
              </p>
            </Card>
          ) : (
            stories.map((story) => (
              <Card key={story.tournamentId + "-" + story.round} title={story.headline}>
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

                <p className="mt-5 border-t border-slate-200 pt-3 text-xs text-[var(--brand-muted)]">
                  Round {story.round} {" - "}
                  {story.generation === "ai"
                    ? "AI-written from verified Perfect XV competition data"
                    : "Generated from verified Perfect XV competition data"}
                </p>
              </Card>
            ))
          )}
        </div>
      </PageContainer>
    </main>
  );
}
