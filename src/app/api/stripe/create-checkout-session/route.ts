import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { getTournamentByIdOrCurrent } from "@/lib/currentTournament";
import { formatCompetitionTitle } from "@/lib/competitionTitle";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

function getAppUrl() {
  const configuredUrl =
    process.env.APP_URL?.trim() ||
    "https://perfect-xv.org";

  const absoluteUrl =
    /^https?:\/\//i.test(configuredUrl)
      ? configuredUrl
      : `https://${configuredUrl}`;

  try {
    return new URL(absoluteUrl).origin;
  } catch {
    console.error(
      "Invalid APP_URL. Falling back to production domain:",
      configuredUrl
    );

    return "https://perfect-xv.org";
  }
}

export async function POST(request: Request = new Request("http://localhost/api/stripe/create-checkout-session", { method: "POST" })) {
  try {
    const user =
      await requireUser();
    const body = await request.json().catch(() => ({}));
    const requestedTournamentId = Number(body.tournamentId);
    const tournament = await getTournamentByIdOrCurrent(
      Number.isInteger(requestedTournamentId) && requestedTournamentId > 0
        ? requestedTournamentId
        : null
    );

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "No competition is currently accepting entries." },
        { status: 409 }
      );
    }

    const competitionEntry = await prisma.competitionEntry.upsert({
      where: { userId_tournamentId: { userId: user.id, tournamentId: tournament.id } },
      update: {},
      create: {
        userId: user.id,
        tournamentId: tournament.id,
        status: "INVITED",
      },
    });

    const appUrl = getAppUrl();

    if (
      competitionEntry.paymentStatus ===
      "COMPLETED"
    ) {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        checkoutUrl:
          `${appUrl}/predictions`,
      });
    }

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        customer_email:
          user.email,

        client_reference_id:
          String(user.id),

        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: tournament.currency.toLowerCase(),
              product_data: {
                name: `Perfect XV — ${formatCompetitionTitle(tournament.name, tournament.year)}`,
                description:
                  "Perfect XV test competition entry",
                tax_code:
                  "txcd_10000000",
              },
              unit_amount: Math.round(Number(tournament.entryFee) * 100),
            },
          },
        ],

        metadata: {
          userId: String(user.id),
          email: user.email,
          tournamentId: String(tournament.id),
        },

        success_url:
          `${appUrl}/payment-success?tournamentId=${tournament.id}`,

        cancel_url:
          `${appUrl}/payment-required?tournamentId=${tournament.id}`,
      });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error(
      "Failed to create checkout session:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create checkout session.",
      },
      {
        status: 500,
      }
    );
  }
}
