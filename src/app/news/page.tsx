import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import CompetitionNews from "@/components/news/CompetitionNews";
import { listCompetitionStories } from "@/lib/competitionStories";
import {
  VIEWABLE_TOURNAMENT_STATUSES,
  getCurrentViewableTournament,
} from "@/lib/currentTournament";
import { sortCompetitionsBySchedule } from "@/lib/competitionOrder";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const [stories, competitions, currentCompetition] = await Promise.all([
    listCompetitionStories(),
    prisma.tournament.findMany({
      where: {
        status: { in: [...VIEWABLE_TOURNAMENT_STATUSES] },
      },
      select: {
        id: true,
        name: true,
        year: true,
        status: true,
        firstKickoff: true,
      },
    }),
    getCurrentViewableTournament(),
  ]);

  const orderedCompetitions = sortCompetitionsBySchedule(competitions).map(
    (competition) => ({
      ...competition,
      firstKickoff: competition.firstKickoff?.toISOString() ?? null,
    })
  );

  return (
    <main className="bg-white p-4 text-[var(--brand-navy)] sm:p-8">
      <PageContainer>
        <PageHeader
          title="Perfect XV News"
          subtitle="Round-by-round reports from the Perfect XV sports desk"
        />

        <CompetitionNews
          competitions={orderedCompetitions}
          stories={stories}
          initialCompetitionId={currentCompetition?.id ?? orderedCompetitions[0]?.id ?? null}
        />
      </PageContainer>
    </main>
  );
}
