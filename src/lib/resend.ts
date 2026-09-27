import { Resend } from "resend";

let client: Resend | undefined;

function getClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  client ??= new Resend(key);
  return client;
}

// Building pages imports mail modules, but should not require mail credentials.
// Check configuration only when a caller actually uses the email service.
export const resend = {
  get emails() {
    return getClient().emails;
  },
  get batch() {
    return getClient().batch;
  },
};
