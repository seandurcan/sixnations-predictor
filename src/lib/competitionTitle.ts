export function formatCompetitionTitle(name: string, year: number) {
  const trimmedName = name.trim();
  const yearPattern = new RegExp(`(^|\\D)${year}(\\D|$)`);

  return yearPattern.test(trimmedName)
    ? trimmedName
    : `${year} ${trimmedName}`;
}
