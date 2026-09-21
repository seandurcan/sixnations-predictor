type CompetitionYear = {
  id: number;
  year: number;
};

export function getFollowingCompetitionYear(
  competitions: CompetitionYear[],
  currentCompetitionId: number | null,
  currentCalendarYear: number
) {
  const currentCompetition = competitions.find(
    (competition) => competition.id === currentCompetitionId
  );

  return (currentCompetition?.year ?? currentCalendarYear) + 1;
}
