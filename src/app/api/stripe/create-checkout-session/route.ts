import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { getCurrentTournament } from "@/lib/currentTournament";
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

export async function POST() {
  try {
    const user =
      await requireUser();
    const tournament = await getCurrentTournament();

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
                name: "Perfect XV Competition Entry",
                description:
                  "Six Nations Predictor Entry Fee",
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
          `${appUrl}/payment-success`,

        cancel_url:
          `${appUrl}/payment-required`,
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
