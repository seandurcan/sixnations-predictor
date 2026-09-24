import { prisma } from "@/lib/prisma";

const DEFINITION_PREFIX = "BRACKET_DEFINITION_";
const STATE_PREFIX = "BRACKET_STATE_";
const MATCH_MAP_PREFIX = "BRACKET_MATCH_MAP_";

export type BracketSide = "HOME" | "AWAY";

export type BracketRule = {
  sourceMatchKey: string;
  targetMatchKey: string;
  targetSide: BracketSide;
};

export type BracketDefinition = {
  name: string;
  source: string;
  rules: BracketRule[];
};

export type BracketMatchState = {
  homeTeamId: number | null;
  awayTeamId: number | null;
  winnerTeamId: number | null;
};

export type BracketState = {
  matches: Record<string, BracketMatchState>;
  updatedAt: string;
};

function emptyMatchState(): BracketMatchState {
  return { homeTeamId: null, awayTeamId: null, winnerTeamId: null };
}

async function readJson<T>(key: string): Promise<T | null> {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  if (!setting) return null;
  try {
    return JSON.parse(setting.value) as T;
  } catch {
    return null;
  }
}

async function writeJson(key: string, value: unknown) {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: JSON.stringify(value) },
    create: { key, value: JSON.stringify(value) },
  });
}

export async function saveBracketDefinition(
  tournamentId: number,
  definition: BracketDefinition
) {
  const invalid = definition.rules.some(
    (rule) =>
      !rule.sourceMatchKey.trim() ||
      !rule.targetMatchKey.trim() ||
      !["HOME", "AWAY"].includes(rule.targetSide)
  );
  if (!definition.name.trim() || !definition.source.trim() || invalid) {
    throw new Error("Bracket definition is incomplete.");
  }
  await writeJson(`${DEFINITION_PREFIX}${tournamentId}`, definition);
  const existing = await getBracketState(tournamentId);
  if (!existing) {
    await writeJson(`${STATE_PREFIX}${tournamentId}`, {
      matches: {},
      updatedAt: new Date().toISOString(),
    } satisfies BracketState);
  }
}

export async function getBracketDefinition(tournamentId: number) {
  return readJson<BracketDefinition>(`${DEFINITION_PREFIX}${tournamentId}`);
}

export async function getBracketState(tournamentId: number) {
  return readJson<BracketState>(`${STATE_PREFIX}${tournamentId}`);
}

export async function registerBracketMatch(
  tournamentId: number,
  matchId: number,
  bracketMatchKey: string
) {
  if (!bracketMatchKey.trim()) throw new Error("Bracket match key is required.");
  await writeJson(
    `${MATCH_MAP_PREFIX}${tournamentId}_${matchId}`,
    { bracketMatchKey: bracketMatchKey.trim() }
  );
}

export async function advanceKnockoutWinner(
  tournamentId: number,
  matchId: number,
  winnerTeamId: number
) {
  const [definition, mapping] = await Promise.all([
    getBracketDefinition(tournamentId),
    readJson<{ bracketMatchKey: string }>(
      `${MATCH_MAP_PREFIX}${tournamentId}_${matchId}`
    ),
  ]);
  if (!definition || !mapping?.bracketMatchKey) return null;

  const current = (await getBracketState(tournamentId)) ?? {
    matches: {},
    updatedAt: new Date().toISOString(),
  };
  const sourceKey = mapping.bracketMatchKey;
  const source = current.matches[sourceKey] ?? emptyMatchState();
  source.winnerTeamId = winnerTeamId;
  current.matches[sourceKey] = source;

  for (const rule of definition.rules.filter(
    (candidate) => candidate.sourceMatchKey === sourceKey
  )) {
    const target = current.matches[rule.targetMatchKey] ?? emptyMatchState();
    if (rule.targetSide === "HOME") target.homeTeamId = winnerTeamId;
    else target.awayTeamId = winnerTeamId;
    current.matches[rule.targetMatchKey] = target;
  }

  current.updatedAt = new Date().toISOString();
  await writeJson(`${STATE_PREFIX}${tournamentId}`, current);
  return current;
}
