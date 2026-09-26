import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPerfectXvFriendInvitationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const MAX_PER_REQUEST = 10;
const MAX_PER_24_HOURS = 25;

function normaliseEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanName(value: unknown) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const inviter = await getCurrentUser();
  if (!inviter) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const people = Array.isArray(body.people) ? body.people : [];

  if (people.length < 1 || people.length > MAX_PER_REQUEST) {
    return NextResponse.json(
      { success: false, error: `Enter between 1 and ${MAX_PER_REQUEST} people at a time.` },
      { status: 400 }
    );
  }

  const cleaned = people.map((person: Record<string, unknown>, index: number) => ({
    index,
    firstName: cleanName(person.firstName),
    lastName: cleanName(person.lastName),
    email: normaliseEmail(person.email),
  }));

  for (const person of cleaned) {
    if (!person.firstName || !person.lastName || !validEmail(person.email)) {
      return NextResponse.json(
        {
          success: false,
          error: `Row ${person.index + 1} requires a first name, surname and valid email address.`,
        },
        { status: 400 }
      );
    }
  }

  const duplicateInRequest = new Set<string>();
  const seen = new Set<string>();
  for (const person of cleaned) {
    if (seen.has(person.email)) duplicateInRequest.add(person.email);
    seen.add(person.email);
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
        error: "Invitation limit reached for the last 24 hours. Please try again later.",
      },
      { status: 429 }
    );
  }

  const emails = [...new Set(cleaned.map((person) => person.email))];
  const [existingUsers, existingInvitations] = await Promise.all([
    prisma.user.findMany({
      where: {
        email: { in: emails, mode: "insensitive" },
        deletedAt: null,
      },
      select: { email: true },
    }),
    prisma.perfectXvInvitation.findMany({
      where: { normalisedEmail: { in: emails } },
      select: {
        normalisedEmail: true,
        unsubscribedAt: true,
      },
    }),
  ]);

  const registered = new Set(existingUsers.map((user) => user.email.toLowerCase()));
  const invitationByEmail = new Map(
    existingInvitations.map((invitation) => [invitation.normalisedEmail, invitation])
  );

  const results: Array<{
    email: string;
    status: "SENT" | "ALREADY_INVITED" | "REGISTERED" | "UNSUBSCRIBED" | "DUPLICATE_IN_REQUEST" | "LIMIT_REACHED" | "FAILED";
  }> = [];

  let sentThisRequest = 0;

  for (const person of cleaned) {
    if (duplicateInRequest.has(person.email) && results.some((result) => result.email === person.email)) {
      results.push({ email: person.email, status: "DUPLICATE_IN_REQUEST" });
      continue;
    }

    if (registered.has(person.email)) {
      results.push({ email: person.email, status: "REGISTERED" });
      continue;
    }

    const existing = invitationByEmail.get(person.email);
    if (existing?.unsubscribedAt) {
      results.push({ email: person.email, status: "UNSUBSCRIBED" });
      continue;
    }
    if (existing) {
      results.push({ email: person.email, status: "ALREADY_INVITED" });
      continue;
    }

    if (recentSent + sentThisRequest >= MAX_PER_24_HOURS) {
      results.push({ email: person.email, status: "LIMIT_REACHED" });
      continue;
    }

    const unsubscribeToken = randomBytes(32).toString("hex");
    let invitationId: number | null = null;

    try {
      const created = await prisma.perfectXvInvitation.create({
        data: {
          email: person.email,
          normalisedEmail: person.email,
          firstName: person.firstName,
          lastName: person.lastName,
          invitedById: inviter.id,
          unsubscribeTokenHash: tokenHash(unsubscribeToken),
        },
        select: { id: true },
      });
      invitationId = created.id;

      const delivery = await sendPerfectXvFriendInvitationEmail({
        email: person.email,
        firstName: person.firstName,
        inviterFirstName: inviter.firstName,
        unsubscribeToken,
      });

      await prisma.perfectXvInvitation.update({
        where: { id: created.id },
        data: {
          sentAt: new Date(),
          providerMessageId: delivery?.id ?? null,
        },
      });

      invitationByEmail.set(person.email, {
        normalisedEmail: person.email,
        unsubscribedAt: null,
      });
      sentThisRequest += 1;
      results.push({ email: person.email, status: "SENT" });
    } catch (error) {
      console.error("Friend invitation failed:", error);
      if (invitationId) {
        await prisma.perfectXvInvitation.delete({ where: { id: invitationId } }).catch(() => undefined);
      }
      results.push({ email: person.email, status: "FAILED" });
    }
  }

  return NextResponse.json({
    success: true,
    sent: results.filter((result) => result.status === "SENT").length,
    skipped: results.filter((result) => result.status !== "SENT").length,
    results,
  });
}
