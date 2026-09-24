import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";
import {
  getBracketDefinition,
  getBracketState,
  registerBracketMatch,
  saveBracketDefinition,
  type BracketDefinition,
} from "@/lib/knockoutBracket";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const tournamentId = Number(request.nextUrl.searchParams.get("tournamentId"));
  if (!Number.isInteger(tournamentId) || tournamentId <= 0) {
    return NextResponse.json({ success: false, error: "Select a valid competition." }, { status: 400 });
  }

  const [definition, state] = await Promise.all([
    getBracketDefinition(tournamentId),
    getBracketState(tournamentId),
  ]);

  return NextResponse.json({ success: true, definition, state });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.authorized) return auth.response;

  const body = await request.json().catch(() => ({}));
  const tournamentId = Number(body.tournamentId);
  const definition = body.definition as BracketDefinition | undefined;
  const mappings = Array.isArray(body.mappings)
    ? body.mappings as Array<{ matchId?: unknown; bracketMatchKey?: unknown }>
    : [];

  if (!Number.isInteger(tournamentId) || tournamentId <= 0 || !definition) {
    return NextResponse.json({ success: false, error: "Competition and bracket definition are required." }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true },
  });
  if (!tournament) {
    return NextResponse.json({ success: false, error: "Competition not found." }, { status: 404 });
  }

  await saveBracketDefinition(tournamentId, definition);

  for (const mapping of mappings) {
    const matchId = Number(mapping.matchId);
    const bracketMatchKey = typeof mapping.bracketMatchKey === "string"
      ? mapping.bracketMatchKey.trim()
      : "";
    if (!Number.isInteger(matchId) || matchId <= 0 || !bracketMatchKey) continue;

    const match = await prisma.match.findFirst({
      where: { id: matchId, tournamentId },
      select: { id: true },
    });
    if (match) await registerBracketMatch(tournamentId, match.id, bracketMatchKey);
  }

  return NextResponse.json({
    success: true,
    definition: await getBracketDefinition(tournamentId),
    state: await getBracketState(tournamentId),
  });
}
