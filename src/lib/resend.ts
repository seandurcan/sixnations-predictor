import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("WARNING: RESEND_API_KEY environment variable is not set.");
}

export const resend = new Resend(process.env.RESEND_API_KEY || "");