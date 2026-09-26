import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPerfectXvFriendInvitationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const MAX_PER_REQUEST = 10;
const MAX_PER_24_HOURS = 25;

type IncomingPerson = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
};

type InviteStatus =
  | "SENT"
  | "ALREADY_INVITED"
  | "REGISTERED"
  | "UNSUBSCRIBED"
  | "DUPLICATE_IN_REQUEST"
  | "LIMIT_REACHED"
  | "FAILED";

function normaliseEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanName(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function providerMessageId(value: unknown): string | null {
  if (
    value &&
    typeof value === "object" &&
    "id" in value &&
    typeof (value as { id?: unknown }).id === "string"
  ) {
    return (value as { id: string }).id;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const inviter = await getCurrentUser();

  if (!inviter) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const rawPeople =
    body &&
    typeof body === "object" &&
    "people" in body &&
    Array.isArray((body as { people?: unknown }).people)
      ? ((body as { people: unknown[] }).people)
      : [];

  if (rawPeople.length < 1 || rawPeople.length > MAX_PER_REQUEST) {
    return NextResponse.json(
      {
        success: false,
        error: `Enter between 1 and ${MAX_PER_REQUEST} people at a time.`,
      },
      { status: 400 }
    );
  }

  const people = rawPeople.map((value, index) => {
    const person: IncomingPerson =
      value && typeof value === "object" ? (value as IncomingPerson) : {};

    return {
      index,
      firstName: cleanName(person.firstName),
      lastName: cleanName(person.lastName),
      email: normaliseEmail(person.email),
    };
  });

  for (const person of people) {
    if (
      !person.firstName ||
      !person.lastName ||
      !validEmail(person.email)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Row ${person.index + 1} requires a first name, surname and valid email address.`,
        },
        { status: 400 }
      );
    }
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentSent = await prisma.perfectXvInvitation.count({
    where: {
      invitedById: inviter.id,
      sentAt: { gte: since },
    },
  });

  if (recentSent >= MAX_PER_24_HOURS) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Invitation limit reached for the last 24 hours. Please try again later.",
      },
      { status: 429 }
    );
  }

  const requestedEmails = new Set(people.map((person) => person.email));

  const registeredUsers = await prisma.user.findMany({
    where: { deletedAt: null },
    select: { email: true },
  });

  const registeredEmails = new Set(
    registeredUsers
      .map((user) => normaliseEmail(user.email))
      .filter((email) => requestedEmails.has(email))
  );

  const existingInvitations = await prisma.perfectXvInvitation.findMany({
    where: {
      normalisedEmail: { in: Array.from(requestedEmails) },
    },
    select: {
      normalisedEmail: true,
      unsubscribedAt: true,
    },
  });

  const existingByEmail = new Map(
    existingInvitations.map((invitation) => [
      invitation.normalisedEmail,
      invitation.unsubscribedAt,
    ])
  );

  const seenInRequest = new Set<string>();
  const results: Array<{ email: string; status: InviteStatus }> = [];
  let sentThisRequest = 0;

  for (const person of people) {
    if (seenInRequest.has(person.email)) {
      results.push({
        email: person.email,
        status: "DUPLICATE_IN_REQUEST",
      });
      continue;
    }
    seenInRequest.add(person.email);

    if (registeredEmails.has(person.email)) {
      results.push({ email: person.email, status: "REGISTERED" });
      continue;
    }

    if (existingByEmail.has(person.email)) {
      results.push({
        email: person.email,
        status: existingByEmail.get(person.email)
          ? "UNSUBSCRIBED"
          : "ALREADY_INVITED",
      });
      continue;
    }

    if (recentSent + sentThisRequest >= MAX_PER_24_HOURS) {
      results.push({ email: person.email, status: "LIMIT_REACHED" });
      continue;
    }

    const unsubscribeToken = randomBytes(32).toString("hex");

    try {
      const invitation = await prisma.perfectXvInvitation.create({
        data: {
          email: person.email,
          normalisedEmail: person.email,
          firstName: person.firstName,
          lastName: person.lastName,
          invitedById: inviter.id,
          unsubscribeTokenHash: hashToken(unsubscribeToken),
        },
        select: { id: true },
      });

      try {
        const delivery = await sendPerfectXvFriendInvitationEmail({
          email: person.email,
          firstName: person.firstName,
          inviterFirstName: inviter.firstName,
          unsubscribeToken,
        });

        await prisma.perfectXvInvitation.update({
          where: { id: invitation.id },
          data: {
            sentAt: new Date(),
            providerMessageId: providerMessageId(delivery),
          },
        });

        existingByEmail.set(person.email, null);
        sentThisRequest += 1;
        results.push({ email: person.email, status: "SENT" });
      } catch (emailError) {
        console.error("Friend invitation email failed:", emailError);
        await prisma.perfectXvInvitation.delete({
          where: { id: invitation.id },
        });
        results.push({ email: person.email, status: "FAILED" });
      }
    } catch (databaseError) {
      console.error("Friend invitation record failed:", databaseError);

      const alreadyExists = await prisma.perfectXvInvitation.findUnique({
        where: { normalisedEmail: person.email },
        select: { unsubscribedAt: true },
      });

      results.push({
        email: person.email,
        status: alreadyExists
          ? alreadyExists.unsubscribedAt
            ? "UNSUBSCRIBED"
            : "ALREADY_INVITED"
          : "FAILED",
      });
    }
  }

  return NextResponse.json(
    {
      success: true,
      sent: results.filter((result) => result.status === "SENT").length,
      skipped: results.filter((result) => result.status !== "SENT").length,
      results,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
