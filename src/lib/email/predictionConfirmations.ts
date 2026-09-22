import { resend } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const FROM = "Perfect XV <noreply@perfect-xv.org>";
const RETRY_DELAY_MS = 5 * 60 * 1000;

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

export function buildPredictionConfirmationEmail(input: {
  firstName: string;
  tournamentName: string;
  tournamentYear: number;
  predictions: Array<{
    matchNumber: number;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
  }>;
}) {
  const title = `${input.tournamentName} ${input.tournamentYear}`;
  const rows = input.predictions.map((prediction) => {
    const score = prediction.homeScore === null || prediction.awayScore === null
      ? "No prediction recorded"
      : `${prediction.homeScore} – ${prediction.awayScore}`;
    return `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${prediction.matchNumber}</td><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(prediction.homeTeam)} v ${escapeHtml(prediction.awayTeam)}</td><td style="padding:8px;border-bottom:1px solid #ddd;font-weight:bold;white-space:nowrap">${score}</td></tr>`;
  }).join("");
  const textRows = input.predictions.map((prediction) => {
    const score = prediction.homeScore === null || prediction.awayScore === null
      ? "No prediction recorded"
      : `${prediction.homeScore}-${prediction.awayScore}`;
    return `${prediction.matchNumber}. ${prediction.homeTeam} v ${prediction.awayTeam}: ${score}`;
  });
  return {
    subject: `Your locked predictions – ${title}`,
    html: `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#012169"><table role="presentation" width="100%"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="620" style="max-width:620px;width:100%;background:#fff;border:1px solid #ddd;border-collapse:collapse"><tr><td style="padding:28px"><h1 style="margin-top:0">Your locked predictions</h1><p>Hi ${escapeHtml(input.firstName)},</p><p>Here is your final prediction record for <strong>${escapeHtml(title)}</strong>. Predictions are now locked and cannot be changed.</p><table role="presentation" width="100%" style="border-collapse:collapse"><thead><tr><th align="left" style="padding:8px;border-bottom:2px solid #012169">#</th><th align="left" style="padding:8px;border-bottom:2px solid #012169">Fixture</th><th align="left" style="padding:8px;border-bottom:2px solid #012169">Prediction</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-bottom:0;margin-top:24px;color:#555;font-size:13px">This email is a record of the predictions held by Perfect XV when the competition locked.</p></td></tr></table></td></tr></table></body></html>`,
    text: [`Hi ${input.firstName},`, "", `Your locked predictions for ${title}:`, "", ...textRows, "", "Predictions are now locked and cannot be changed."].join("\n"),
  };
}

async function confirmationData(userId: number, tournamentId: number) {
  const [user, tournament] = await Promise.all([
    prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, firstName: true, email: true, emailVerified: true },
    }),
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        matches: {
          orderBy: { matchNumber: "asc" },
          include: { homeTeam: true, awayTeam: true, predictions: { where: { userId } } },
        },
      },
    }),
  ]);
  if (!user || !user.emailVerified || !tournament) return null;
  return {
    user,
    tournament,
    rows: tournament.matches.map((match) => ({
      matchNumber: match.matchNumber,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScore: match.predictions[0]?.predictedHomeScore ?? null,
      awayScore: match.predictions[0]?.predictedAwayScore ?? null,
    })),
  };
}

export async function sendPredictionConfirmation(userId: number, tournamentId: number, force = false) {
  const data = await confirmationData(userId, tournamentId);
  if (!data) throw new Error("The user or competition is unavailable for confirmation delivery.");
  const now = new Date();
  const delivery = await prisma.predictionConfirmationDelivery.upsert({
    where: { userId_tournamentId: { userId, tournamentId } },
    create: { userId, tournamentId, status: "PENDING" },
    update: {},
  });
  if (!force && delivery.status === "SENT") return { skipped: true, delivery };
  const staleBefore = new Date(now.getTime() - RETRY_DELAY_MS);
  const claimed = await prisma.predictionConfirmationDelivery.updateMany({
    where: {
      id: delivery.id,
      ...(force ? {} : {
        attemptCount: { lt: 3 },
        OR: [
          { status: { in: ["PENDING", "FAILED"] } },
          { status: "SENDING", lastAttemptAt: { lt: staleBefore } },
        ],
      }),
    },
    data: { status: "SENDING", lastAttemptAt: now, attemptCount: { increment: 1 }, errorMessage: null },
  });
  if (!claimed.count) return { skipped: true, delivery };
  const message = buildPredictionConfirmationEmail({
    firstName: data.user.firstName,
    tournamentName: data.tournament.name,
    tournamentYear: data.tournament.year,
    predictions: data.rows,
  });
  try {
    const { data: sent, error } = await resend.emails.send({
      from: FROM,
      to: data.user.email,
      subject: message.subject,
      html: message.html,
      text: message.text,
    }, {
      idempotencyKey: force
        ? `prediction-confirmation-${tournamentId}-${userId}-resend-${now.getTime()}`
        : `prediction-confirmation-${tournamentId}-${userId}`,
    });
    if (error) throw new Error(error.message || "Resend rejected the email.");
    const updated = await prisma.predictionConfirmationDelivery.update({
      where: { id: delivery.id },
      data: { status: "SENT", sentAt: new Date(), providerMessageId: sent?.id ?? null, errorMessage: null },
    });
    return { skipped: false, delivery: updated };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Email delivery failed.";
    await prisma.predictionConfirmationDelivery.update({
      where: { id: delivery.id },
      data: { status: "FAILED", errorMessage: messageText.slice(0, 500) },
    });
    throw error;
  }
}

export async function processDuePredictionConfirmations(now = new Date()) {
  const tournaments = await prisma.tournament.findMany({
    where: {
      predictionLockAt: { lte: now },
      firstKickoff: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      status: { in: ["OPEN", "LOCKED", "IN_PROGRESS"] },
    },
    select: { id: true },
  });
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const tournament of tournaments) {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        emailVerified: true,
        predictions: { some: { match: { tournamentId: tournament.id } } },
      },
      select: { id: true },
    });
    for (const user of users) {
      try {
        const result = await sendPredictionConfirmation(user.id, tournament.id);
        if (result.skipped) skipped += 1;
        else sent += 1;
      } catch (error) {
        failed++;
        console.error("Prediction confirmation failed", { tournamentId: tournament.id, userId: user.id, error });
      }
    }
  }
  return { sent, failed, skipped, tournaments: tournaments.length };
}
