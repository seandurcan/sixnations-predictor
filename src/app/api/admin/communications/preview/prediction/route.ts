import { NextResponse } from "next/server";

export async function GET() {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #0b1f34; padding: 20px;">
        <h2>Perfect XV Prediction Deadline Reminder</h2>
        <p>Don't forget to submit or update all 15 score predictions before the first match of the tournament kicks off. After that, all predictions are locked.</p>
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