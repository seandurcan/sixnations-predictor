import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(
  request: NextRequest
) {
  const body = await request.text();

  const signature =
    request.headers.get(
      "stripe-signature"
    );

  if (!signature) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing signature",
      },
      {
        status: 400,
      }
    );
  }

  let event: Stripe.Event;

  try {
    event =
      stripe.webhooks.constructEvent(
        body,
        signature,
        process.env
          .STRIPE_WEBHOOK_SECRET!
      );
  } catch (error) {
    console.error(
      "Stripe webhook error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Invalid webhook signature",
      },
      {
        status: 400,
      }
    );
  }

  if (
    event.type ===
    "checkout.session.completed"
  ) {
    const session =
      event.data.object as Stripe.Checkout.Session;

    console.log(
      "Stripe checkout.session.completed:",
      {
        sessionId: session.id,
        metadata: session.metadata,
        customerDetails:
          session.customer_details,
        customerEmail:
          session.customer_details
            ?.email,
      }
    );

    const email =
      session.customer_details?.email;

    if (!email) {
      console.error(
        "No email found in Stripe session."
      );

      return NextResponse.json({
        received: true,
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (!user) {
      console.error(
        `No user found for email ${email}`
      );

      return NextResponse.json({
        received: true,
      });
    }

console.log(
  "About to update user:",
  {
    userId: user.id,
    email: user.email,
  }
);

const updatedUser =
  await prisma.user.update({    where: {
      id: user.id,
    },
    data: {
      paymentStatus:
        "COMPLETED",
      paidAt: new Date(),
    },
  });

console.log(
  "User updated after Stripe payment:",
  {
    userId: updatedUser.id,
    email: updatedUser.email,
    paymentStatus:
      updatedUser.paymentStatus,
    paidAt:
      updatedUser.paidAt,
  }
);

console.log(
  "Stripe user update completed successfully."
);

    const existingPayment =
      await prisma.payment.findFirst({
        where: {
          providerPaymentId:
            session.id,
        },
      });

    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          userId: user.id,
          provider: "STRIPE",
          providerPaymentId:
            session.id,
          amount:
            (session.amount_total ??
              0) / 100,
          currency:
            session.currency?.toUpperCase() ??
            "EUR",
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    }
  }

  return NextResponse.json({
    received: true,
  });
}