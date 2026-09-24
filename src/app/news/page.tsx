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
          subtitle="Round-by-round stories from the prediction races"
        />

        <div className="space-y-5">
          {stories.length === 0 ? (
            <Card title="No stories yet">
              <p className="text-sm text-[var(--brand-muted)]">
                Competition stories will appear here automatically after completed rounds.
              </p>
            </Card>
          ) : (
            stories.map((story) => (
              <Card key={`${story.tournamentId}-${story.round}`} title={story.headline}>
                <p className="leading-7">{story.body}</p>
                <p className="mt-4 text-xs text-[var(--brand-muted)]">
                  Round {story.round} · Generated from verified Perfect XV competition data
                </p>
              </Card>
            ))
          )}
        </div>
      </PageContainer>
    </main>
  );
}
