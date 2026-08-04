import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Add any admin session validation here if required by your app architecture
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #0b1f34; padding: 20px;">
        <h2>Verify Your Email Address</h2>
        <p>Thank you for registering for the Six Nations Predictor. Please click the link below to verify your email address:</p>
        <p style="margin: 20px 0;">
          <a href="#" style="background-color: #00857c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a>
        </p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

    return NextResponse.json({ success: true, html: htmlContent });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load verification email preview" }, { status: 500 });
  }
}