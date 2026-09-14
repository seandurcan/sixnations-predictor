import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPredictionsPdf } from "@/lib/predictionsPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };

export async function GET() {
  try {
    const user = await requireUser();
    if (user.deletedAt) return Response.json({ error: "Authentication required" }, { status: 401, headers: privateHeaders });
    // Identity comes exclusively from the authenticated session. No user ID
    // supplied in a URL or request body can select another entrant's records.
    const [predictions, receipts] = await Promise.all([
      prisma.prediction.findMany({
        where: { userId: user.id },
        select: {
          id: true, predictedHomeScore: true, predictedAwayScore: true, createdAt: true,
          match: { select: {
            matchNumber: true, kickoffTime: true,
            homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } },
            tournament: { select: { id: true, name: true, year: true } },
          } },
        },
        orderBy: [{ match: { tournamentId: "asc" } }, { match: { matchNumber: "asc" } }],
      }),
      prisma.predictionSubmission.findMany({
        where: { userId: user.id },
        select: { tournamentId: true, receiptReference: true, submittedAt: true },
        orderBy: { submittedAt: "desc" },
      }),
    ]);
    if (!predictions.length) return Response.json({ error: "You have no submitted predictions to download yet." }, { status: 404, headers: privateHeaders });
    const bytes = await createPredictionsPdf(user, predictions, receipts);
    return new Response(new Uint8Array(bytes), {
      headers: {
        ...privateHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="perfect-xv-my-predictions.pdf"',
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const unauthenticated = error instanceof Error && error.message === "Authentication required";
    if (!unauthenticated) console.error("Prediction PDF generation failed", error);
    return Response.json({ error: unauthenticated ? "Authentication required" : "Unable to generate your predictions PDF. Please try again." }, {
      status: unauthenticated ? 401 : 500, headers: privateHeaders,
    });
  }
}
