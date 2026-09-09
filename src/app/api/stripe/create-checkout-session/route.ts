import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
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

    const appUrl = getAppUrl();

    if (
      user.paymentStatus ===
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
              currency: "eur",
              product_data: {
                name: "Perfect XV Competition Entry",
                description:
                  "Six Nations Predictor Entry Fee",
                tax_code:
                  "txcd_10000000",
              },
              unit_amount: 500,
            },
          },
        ],

        metadata: {
          userId: String(user.id),
          email: user.email,
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
