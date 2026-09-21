import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const EXPECTED_TOKEN_HASH =
  "5cf82eaaccd0ba3fb29269817793441c58adbd0fb99bf85ae39111cbb115ae6c";
const IMPORT_AUDIT_KEY = "HISTORICAL_CONTACT_IMPORT_2026_09_21_BATCH_2";

type ContactInput = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  mobile?: unknown;
};

type Contact = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
};

function authorized(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return false;

  const supplied = crypto.createHash("sha256").update(token).digest();
  const expected = Buffer.from(
    process.env.CONTACT_IMPORT_TOKEN_HASH ?? EXPECTED_TOKEN_HASH,
    "hex"
  );
  return supplied.length === expected.length &&
    crypto.timingSafeEqual(supplied, expected);
}

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim()
    : "";
}

function prepareContacts(input: unknown) {
  if (!Array.isArray(input) || input.length === 0 || input.length > 200) {
    throw new Error("Provide between 1 and 200 contacts.");
  }

  const byEmail = new Map<string, Contact>();
  const mobiles = new Set<string>();

  for (const item of input as ContactInput[]) {
    const firstName = cleanText(item.firstName);
    const lastName = cleanText(item.lastName);
    const email = cleanText(item.email).toLowerCase();
    const mobile = cleanText(item.mobile).replace(/\D/g, "");

    if (!firstName || !lastName) {
      throw new Error("Every contact requires a first and last name.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Every contact requires a valid email address.");
    }
    if (byEmail.has(email)) continue;
    if (mobile && mobiles.has(mobile)) continue;

    byEmail.set(email, { firstName, lastName, email, mobile });
    if (mobile) mobiles.add(mobile);
  }

  return [...byEmail.values()];
}

async function findExisting(
  database: Pick<typeof prisma, "user">,
  contacts: Contact[]
) {
  const emails = contacts.map((contact) => contact.email);
  const mobiles = contacts.map((contact) => contact.mobile).filter(Boolean);
  const existing = await database.user.findMany({
    where: {
      OR: [
        { email: { in: emails, mode: "insensitive" } },
        ...(mobiles.length > 0 ? [{ mobile: { in: mobiles } }] : []),
      ],
    },
    select: { email: true, mobile: true },
  });
  const existingEmails = new Set(
    existing.map((user) => user.email.trim().toLowerCase())
  );
  const existingMobiles = new Set(
    existing.map((user) => user.mobile.replace(/\D/g, "")).filter(Boolean)
  );

  return {
    existing,
    newContacts: contacts.filter(
      (contact) =>
        !existingEmails.has(contact.email) &&
        (!contact.mobile || !existingMobiles.has(contact.mobile))
    ),
  };
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const contacts = prepareContacts(body.contacts);
    const dryRun = body.confirm !== true;

    if (dryRun) {
      const result = await findExisting(prisma, contacts);
      return NextResponse.json({
        success: true,
        dryRun: true,
        supplied: contacts.length,
        existing: result.existing.length,
        wouldCreate: result.newContacts.length,
      });
    }

    const inaccessiblePasswordHash = await bcrypt.hash(
      crypto.randomBytes(48).toString("base64url"),
      12
    );
    const result = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(82319)`;
      const previousRun = await tx.systemSetting.findUnique({
        where: { key: IMPORT_AUDIT_KEY },
      });
      if (previousRun) {
        throw new Error("This historical contact import has already been completed.");
      }

      const matches = await findExisting(tx, contacts);
      const order = await tx.user.aggregate({
        _max: { registrationOrder: true },
      });
      const firstOrder = (order._max.registrationOrder ?? 0) + 1;
      const created = await tx.user.createMany({
        data: matches.newContacts.map((contact, index) => ({
          ...contact,
          passwordHash: inaccessiblePasswordHash,
          registrationOrder: firstOrder + index,
          emailVerified: true,
        })),
        skipDuplicates: true,
      });

      await tx.systemSetting.create({
        data: {
          key: IMPORT_AUDIT_KEY,
          value: JSON.stringify({
            completedAt: new Date().toISOString(),
            supplied: contacts.length,
            existing: matches.existing.length,
            created: created.count,
          }),
        },
      });

      return {
        supplied: contacts.length,
        existing: matches.existing.length,
        created: created.count,
      };
    }, { isolationLevel: "Serializable", maxWait: 10_000, timeout: 30_000 });

    return NextResponse.json({ success: true, dryRun: false, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Contact import failed.";
    const alreadyRun = message.includes("already been completed");
    console.error("Historical contact import failed", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: alreadyRun ? 409 : 400 }
    );
  }
}
