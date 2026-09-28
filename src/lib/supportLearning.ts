import { createHash, randomUUID } from "node:crypto";

import { prisma } from "@/lib/prisma";
import type { SupportAnswer, SupportApprovedMapping } from "@/lib/supportKnowledge";

const INTERACTION_PREFIX = "SUPPORT_INTERACTION_";
const MAPPING_PREFIX = "SUPPORT_MAPPING_";
const MAX_INTERACTIONS = 500;

type MappingStatus = "PENDING" | "APPROVED" | "REJECTED";

export type StoredSupportInteraction = {
  id: string;
  question: string;
  createdAt: string;
  matchedTopic: string | null;
  needsChoice: boolean;
  optionIds: string[];
  selectedTopic?: string;
  helpful?: boolean;
};

export type SupportMappingSuggestion = {
  key: string;
  phrase: string;
  topicId: string;
  count: number;
  status: MappingStatus;
  lastSeenAt: string;
  reviewedAt?: string;
  reviewedById?: number;
};

function safeParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function normaliseSupportPhrase(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function redactQuestion(value: string) {
  return value
    .slice(0, 600)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email redacted]")
    .replace(/\b\d{12,19}\b/g, "[number redacted]")
    .replace(/\b(password|passcode|cvv|cvc)\s*[:=]\s*\S+/gi, "$1=[redacted]");
}

function mappingKey(phrase: string, topicId: string) {
  const digest = createHash("sha256")
    .update(`${phrase}\n${topicId}`)
    .digest("hex")
    .slice(0, 32);

  return `${MAPPING_PREFIX}${digest}`;
}

async function pruneOldInteractions() {
  const stale = await prisma.systemSetting.findMany({
    where: { key: { startsWith: INTERACTION_PREFIX } },
    orderBy: { updatedAt: "desc" },
    skip: MAX_INTERACTIONS,
    select: { id: true },
  });

  if (stale.length) {
    await prisma.systemSetting.deleteMany({
      where: { id: { in: stale.map((item) => item.id) } },
    });
  }
}

export async function getApprovedSupportMappings(): Promise<SupportApprovedMapping[]> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { startsWith: MAPPING_PREFIX } },
    select: { value: true },
  });

  return rows
    .map((row) => safeParse<SupportMappingSuggestion>(row.value))
    .filter((mapping): mapping is SupportMappingSuggestion =>
      Boolean(mapping && mapping.status === "APPROVED" && mapping.phrase && mapping.topicId)
    )
    .map(({ phrase, topicId }) => ({ phrase, topicId }));
}

export async function logSupportInteraction(
  question: string,
  answer: SupportAnswer
) {
  const id = randomUUID();
  const interaction: StoredSupportInteraction = {
    id,
    question: redactQuestion(question),
    createdAt: new Date().toISOString(),
    matchedTopic: answer.matchedTopic,
    needsChoice: answer.needsChoice,
    optionIds: answer.options.map((option) => option.id),
  };

  await prisma.systemSetting.create({
    data: {
      key: `${INTERACTION_PREFIX}${id}`,
      value: JSON.stringify(interaction),
    },
  });

  void pruneOldInteractions().catch((error) => {
    console.error("Support interaction pruning failed", error);
  });

  return id;
}

async function getInteraction(interactionId: string) {
  const row = await prisma.systemSetting.findUnique({
    where: { key: `${INTERACTION_PREFIX}${interactionId}` },
  });
  if (!row) return null;

  const interaction = safeParse<StoredSupportInteraction>(row.value);
  return interaction ? { row, interaction } : null;
}

async function upsertMappingSuggestion(phrase: string, topicId: string) {
  const normalisedPhrase = normaliseSupportPhrase(phrase);
  if (!normalisedPhrase || !topicId) return;

  const key = mappingKey(normalisedPhrase, topicId);
  const existing = await prisma.systemSetting.findUnique({ where: { key } });
  const parsed = existing
    ? safeParse<SupportMappingSuggestion>(existing.value)
    : null;

  const suggestion: SupportMappingSuggestion = {
    key,
    phrase: normalisedPhrase,
    topicId,
    count: (parsed?.count ?? 0) + 1,
    status: parsed?.status ?? "PENDING",
    lastSeenAt: new Date().toISOString(),
    ...(parsed?.reviewedAt ? { reviewedAt: parsed.reviewedAt } : {}),
    ...(parsed?.reviewedById ? { reviewedById: parsed.reviewedById } : {}),
  };

  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: JSON.stringify(suggestion) },
    create: { key, value: JSON.stringify(suggestion) },
  });
}

export async function recordSupportSelection(
  interactionId: string,
  topicId: string
) {
  const found = await getInteraction(interactionId);
  if (!found) return false;

  const updated: StoredSupportInteraction = {
    ...found.interaction,
    selectedTopic: topicId,
  };

  await prisma.systemSetting.update({
    where: { key: found.row.key },
    data: { value: JSON.stringify(updated) },
  });

  await upsertMappingSuggestion(found.interaction.question, topicId);
  return true;
}

export async function recordSupportFeedback(
  interactionId: string,
  helpful: boolean
) {
  const found = await getInteraction(interactionId);
  if (!found) return false;

  const updated: StoredSupportInteraction = {
    ...found.interaction,
    helpful,
  };

  await prisma.systemSetting.update({
    where: { key: found.row.key },
    data: { value: JSON.stringify(updated) },
  });

  return true;
}

export async function getSupportInsights() {
  const [interactionRows, mappingRows, totalStored] = await Promise.all([
    prisma.systemSetting.findMany({
      where: { key: { startsWith: INTERACTION_PREFIX } },
      orderBy: { updatedAt: "desc" },
      take: MAX_INTERACTIONS,
      select: { value: true },
    }),
    prisma.systemSetting.findMany({
      where: { key: { startsWith: MAPPING_PREFIX } },
      orderBy: { updatedAt: "desc" },
      select: { key: true, value: true },
    }),
    prisma.systemSetting.count({
      where: { key: { startsWith: INTERACTION_PREFIX } },
    }),
  ]);

  const interactions = interactionRows
    .map((row) => safeParse<StoredSupportInteraction>(row.value))
    .filter((item): item is StoredSupportInteraction => Boolean(item));

  const suggestions = mappingRows
    .map((row) => {
      const parsed = safeParse<SupportMappingSuggestion>(row.value);
      return parsed ? { ...parsed, key: row.key } : null;
    })
    .filter((item): item is SupportMappingSuggestion => Boolean(item));

  return {
    summary: {
      totalStored,
      ambiguous: interactions.filter((item) => item.needsChoice).length,
      helpful: interactions.filter((item) => item.helpful === true).length,
      notHelpful: interactions.filter((item) => item.helpful === false).length,
      pendingSuggestions: suggestions.filter((item) => item.status === "PENDING").length,
      approvedMappings: suggestions.filter((item) => item.status === "APPROVED").length,
    },
    recentInteractions: interactions.slice(0, 100),
    suggestions,
  };
}

export async function reviewSupportMapping(
  key: string,
  status: "APPROVED" | "REJECTED",
  reviewedById: number
) {
  if (!key.startsWith(MAPPING_PREFIX)) return false;

  const row = await prisma.systemSetting.findUnique({ where: { key } });
  if (!row) return false;

  const parsed = safeParse<SupportMappingSuggestion>(row.value);
  if (!parsed) return false;

  const updated: SupportMappingSuggestion = {
    ...parsed,
    key,
    status,
    reviewedAt: new Date().toISOString(),
    reviewedById,
  };

  await prisma.systemSetting.update({
    where: { key },
    data: { value: JSON.stringify(updated) },
  });

  return true;
}
