import { after, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmailVerificationEmail } from "@/lib/email";
import { getCurrentTournament } from "@/lib/currentTournament";

export async function POST(
  request: Request
) {
  try {
    const body =
      await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const invitationToken = typeof body.invitationToken === "string" ? body.invitationToken.trim() : "";
    const invitationTokenHash = invitationToken
      ? crypto.createHash("sha256").update(invitationToken).digest("hex")
      : null;

    if (
      body.password !==
      body.confirmPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Passwords do not match",
        },
        {
          status: 400,
        }
      );
    }

    const existingUser =
      await prisma.user.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email already exists",
        },
        {
          status: 400,
        }
      );
    }

    const passwordHash =
      await bcrypt.hash(
        body.password,
        12
      );

    const userCount =
      await prisma.user.count();

    const invitation = invitationTokenHash
      ? await prisma.competitionInvitation.findUnique({ where: { tokenHash: invitationTokenHash } })
      : null;
    const currentTournament = invitation ? null : await getCurrentTournament();

    if (invitationTokenHash && (
      !invitation
      || invitation.status !== "PENDING"
      || invitation.expiresAt <= new Date()
      || invitation.email.toLowerCase() !== email
    )) {
      return NextResponse.json(
        { success: false, error: "This competition invitation is invalid, expired or belongs to another email address." },
        { status: 400 }
      );
    }

    const token =
      crypto.randomUUID() +
      crypto.randomUUID();

    const expiresAt =
      new Date(
        Date.now() +
          1000 * 60 * 60
      );

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          firstName:
            body.firstName,
          lastName:
            body.lastName,
          email,
          mobile:
            body.mobile,
          passwordHash,
          registrationOrder:
            userCount + 1,
        },
      });
      await tx.emailVerification.create({ data: { userId: created.id, token, expiresAt } });
      if (invitation) {
        await tx.competitionEntry.upsert({
          where: { userId_tournamentId: { userId: created.id, tournamentId: invitation.tournamentId } },
          update: { status: "INVITED" },
          create: { userId: created.id, tournamentId: invitation.tournamentId, status: "INVITED" },
        });
        await tx.competitionInvitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED", acceptedUserId: created.id, acceptedAt: new Date() },
        });
      } else if (currentTournament) {
        await tx.competitionEntry.create({
          data: { userId: created.id, tournamentId: currentTournament.id, status: "INVITED" },
        });
      }
      return created;
    });

    after(async () => {
      try {
        await sendEmailVerificationEmail(
          user.email,
          token
        );
      } catch (emailError) {
        console.error(
          "Verification email failed:",
          emailError
        );
      }
    });

    return NextResponse.json({
      success: true,
      emailVerificationRequired: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Registration failed",
      },
      {
        status: 500,
      }
    );
  }
}
