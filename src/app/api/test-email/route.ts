import { NextResponse } from "next/server";
import { sendEmailVerificationEmail } from "@/lib/email";

export async function GET() {
  try {
    await sendEmailVerificationEmail(
      "seandurcan@gmail.com",
      "test-token-123"
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      {
        status: 500,
      }
    );
  }
}
``