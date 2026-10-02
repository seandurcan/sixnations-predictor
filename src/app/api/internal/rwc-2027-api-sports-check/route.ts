import { NextResponse } from "next/server";
import { discoverCompetitionFixtures } from "@/lib/fixtureDiscovery";

export const dynamic = "force-dynamic";

const STAGING_PROJECT_ID = "prj_bw5EAJac45HfO2utXKKvENAKhBfE";

export async function GET() {
  if (
    process.env.VERCEL_PROJECT_ID !== STAGING_PROJECT_ID ||
    process.env.VERCEL_GIT_COMMIT_REF !== "staging"
  ) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  const apiKey =
    process.env.API_SPORTS_KEY ??
    process.env.APISPORTS_RUGBY_KEY ??
    process.env.API_RUGBY_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "API-Sports key is not configured." },
      { status: 503 }
    );
  }

  try {
    const preview = await discoverCompetitionFixtures(
      "Rugby World Cup",
      2027,
      apiKey
    );

    return NextResponse.json(
      {
        success: true,
        checkedAt: new Date().toISOString(),
        providerLeague: preview.providerLeague,
        fixtureCount: preview.discoveredFixtureCount,
        participantTeams: preview.participantTeams ?? [],
        warnings: preview.warnings,
        queryDiagnostics: preview.queryDiagnostics ?? [],
        fixtures: preview.fixtures,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        checkedAt: new Date().toISOString(),
        error:
          error instanceof Error
            ? error.message
            : "Rugby World Cup availability check failed.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
