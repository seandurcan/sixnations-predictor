import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const user =
      await requireUser();

    const appUrl =
      process.env.APP_URL ??
      "http://localhost:3000";

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "eur",
             product_data: {
  name: "Perfect XV Competition Entry",
  description:
    "Six Nations Predictor Entry Fee",
  tax_code: "txcd_10000000",
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
          `${appUrl}/predictions`,

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