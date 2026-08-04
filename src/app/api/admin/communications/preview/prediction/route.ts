import { NextResponse } from "next/server";

export async function GET() {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #0b1f34; padding: 20px;">
        <h2>Upcoming Match Predictions Reminder</h2>
        <p>Don't forget to submit or update your score predictions for the upcoming round of matches!</p>
        <p style="margin: 20px 0;">
          <a href="#" style="background-color: #00857c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Make Predictions</a>
        </p>
        <p>May the best predictor win!</p>
      </div>
    `;

    return NextResponse.json({ success: true, html: htmlContent });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load prediction email preview" }, { status: 500 });
  }
}