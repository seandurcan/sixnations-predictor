function normalise(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function competitionSeasonLabel(name: string, year: number) {
  const key = normalise(name);
  if (
    key.includes("unitedrugbychampionship") ||
    key.includes("challengecup")
  ) {
    return `${year}/${String(year + 1).slice(-2)}`;
  }
  return String(year);
}

export function formatCompetitionTitle(name: string, year: number) {
  const trimmedName = name.trim();
  const seasonLabel = competitionSeasonLabel(trimmedName, year);
  const yearPattern = new RegExp(`(^|\\D)${year}(\\D|$)`);

  return yearPattern.test(trimmedName)
    ? trimmedName
    : `${seasonLabel} ${trimmedName}`;
}
