"use client";

import { useEffect, useState } from "react";

export type ActiveCompetition = {
  id: number;
  name: string;
  year: number;
  status: string;
  entryFee: number;
  currency: string;
  firstKickoff: string | null;
  predictionLockAt: string | null;
  entry: {
    tournamentId: number;
    status: string;
    paymentStatus: string;
    predictionsSubmitted: boolean;
  } | null;
};

export function useActiveCompetitions() {
  const [competitions, setCompetitions] = useState<ActiveCompetition[]>([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<number | null>(null);
  const [loadingCompetitions, setLoadingCompetitions] = useState(true);

  useEffect(() => {
    let active = true;
    void fetch("/api/competitions", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load competitions.");
        const data = await response.json() as {
          currentTournamentId: number | null;
          competitions: ActiveCompetition[];
        };
        if (!active) return;
        setCompetitions(data.competitions);
        const preferred =
          data.competitions.find((competition) => competition.id === data.currentTournamentId)?.id ??
          data.competitions[0]?.id ??
          null;
        setSelectedCompetitionId(preferred);
      })
      .finally(() => {
        if (active) setLoadingCompetitions(false);
      });
    return () => { active = false; };
  }, []);

  return {
    competitions,
    selectedCompetitionId,
    setSelectedCompetitionId,
    loadingCompetitions,
  };
}
