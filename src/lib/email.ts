import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

console.log(
  "RESEND KEY EXISTS:",
  Boolean(process.env.RESEND_API_KEY)
);

/**
 * Escapes text before inserting it into HTML.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Returns the configured application URL without a trailing slash.
 */
function getAppUrl(): string {
  const appUrl = process.env.APP_URL?.trim().replace(/\/+$/, "");

  if (!appUrl) {
    throw new Error("APP_URL environment variable is not configured.");
  }

  return appUrl;
}

/**
 * Creates a button that works in Gmail, Outlook Web,
 * the new Outlook application and classic Outlook.
 */
function createEmailButton(url: string, label: string): string {
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label);

  return `
    <table
      role="presentation"
      width="100%"
      border="0"
      cellspacing="0"
      cellpadding="0"
      style="border-collapse: collapse;"
    >
      <tr>
        <td align="center" style="padding: 10px 0 20px 0;">

          <!--[if mso]>
          <v:roundrect
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            href="${safeUrl}"
            style="
              height: 48px;
              v-text-anchor: middle;
              width: 220px;
            "
            arcsize="10%"
            strokecolor="#012169"
            fillcolor="#012169"
          >
            <w:anchorlock/>
            <center
              style="
                color: #ffffff;
                font-family: Arial, Helvetica, sans-serif;
                font-size: 16px;
                font-weight: bold;
              "
            >
              ${safeLabel}
            </center>
          </v:roundrect>
          <![endif]-->

          <!--[if !mso]><!-->
          <a
            href="${safeUrl}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display: inline-block;
              width: 220px;
              padding: 14px 0;
              background-color: #012169;
              border: 1px solid #012169;
              border-radius: 5px;
              color: #ffffff;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 16px;
              font-weight: bold;
              line-height: 20px;
              text-align: center;
              text-decoration: none;
              mso-hide: all;
            "
          >
            ${safeLabel}
          </a>
          <!--<![endif]-->

        </td>
      </tr>
    </table>
  `;
}

interface ActionEmailOptions {
  heading: string;
  introduction: string;
  instruction: string;
  buttonLabel: string;
  actionUrl: string;
  alternativeText: string;
  expiryText: string;
  previewText: string;
}

/**
 * Creates the complete email HTML.
 */
function createActionEmailHtml({
  heading,
  introduction,
  instruction,
  buttonLabel,
  actionUrl,
  alternativeText,
  expiryText,
  previewText,
}: ActionEmailOptions): string {
  const safeHeading = escapeHtml(heading);
  const safeIntroduction = escapeHtml(introduction);
  const safeInstruction = escapeHtml(instruction);
  const safeAlternativeText = escapeHtml(alternativeText);
  const safeExpiryText = escapeHtml(expiryText);
  const safePreviewText = escapeHtml(previewText);
  const safeActionUrl = escapeHtml(actionUrl);

  return `
<!doctype html>
<html
  lang="en"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="UTF-8">
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    >
    <meta
      http-equiv="X-UA-Compatible"
      content="IE=edge"
    >
    <meta
      name="x-apple-disable-message-reformatting"
    >

    <title>${safeHeading}</title>

    <!--[if mso]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
    <![endif]-->
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    "
  >
    <div
      style="
        display: none;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        color: transparent;
        line-height: 1px;
        font-size: 1px;
      "
    >
      ${safePreviewText}
    </div>

    <table
      role="presentation"
      width="100%"
      border="0"
      cellspacing="0"
      cellpadding="0"
      style="
        width: 100%;
        border-collapse: collapse;
        background-color: #f3f4f6;
      "
    >
      <tr>
        <td
          align="center"
          style="padding: 30px 12px;"
        >
          <table
            role="presentation"
            width="600"
            border="0"
            cellspacing="0"
            cellpadding="0"
            style="
              width: 100%;
              max-width: 600px;
              border-collapse: collapse;
              background-color: #ffffff;
              border: 1px solid #dddddd;
            "
          >
            <tr>
              <td
                style="
                  padding: 32px;
                  color: #222222;
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 16px;
                  line-height: 24px;
                "
              >
                <h1
                  style="
                    margin: 0 0 22px 0;
                    color: #012169;
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 26px;
                    line-height: 32px;
                  "
                >
                  ${safeHeading}
                </h1>

                <p style="margin: 0 0 18px 0;">
                  ${safeIntroduction}
                </p>

                <p style="margin: 0 0 18px 0;">
                  ${safeInstruction}
                </p>

                ${createEmailButton(actionUrl, buttonLabel)}

                <p style="margin: 12px 0 8px 0;">
                  ${safeAlternativeText}
                </p>

                <p
                  style="
                    margin: 0 0 22px 0;
                    overflow-wrap: anywhere;
                    word-break: break-all;
                  "
                >
                  <a
                    href="${safeActionUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                      color: #012169;
                      text-decoration: underline;
                    "
                  >
                    ${safeActionUrl}
                  </a>
                </p>

                <p
                  style="
                    margin: 0;
                    color: #666666;
                    font-size: 14px;
                    line-height: 21px;
                  "
                >
                  ${safeExpiryText}
                </p>
              </td>
            </tr>
          </table>

          <table
            role="presentation"
            width="600"
            border="0"
            cellspacing="0"
            cellpadding="0"
            style="
              width: 100%;
              max-width: 600px;
              border-collapse: collapse;
            "
          >
            <tr>
              <td
                align="center"
                style="
                  padding: 18px 20px;
                  color: #777777;
                  font-family: Arial, Helvetica, sans-serif;
                  font-size: 12px;
                  line-height: 18px;
                "
              >
                Six Nations Predictor
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

async function sendActionEmail({
  email,
  subject,
  heading,
  introduction,
  instruction,
  buttonLabel,
  actionUrl,
  alternativeText,
  expiryText,
  previewText,
}: ActionEmailOptions & {
  email: string;
  subject: string;
}) {
  const html = createActionEmailHtml({
    heading,
    introduction,
    instruction,
    buttonLabel,
    actionUrl,
    alternativeText,
    expiryText,
    previewText,
  });

  const text = [
    heading,
    "",
    introduction,
    "",
    instruction,
    "",
    actionUrl,
    "",
    expiryText,
  ].join("\n");

  const { data, error } = await resend.emails.send({
    from: "Perfect XV <noreply@perfect-xv.org>",
    to: email,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("EMAIL SEND ERROR:", error);
    throw new Error(error.message || "The email could not be sent.");
  }

  return data;
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
) {
  const resetUrl =
    `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  const result = await sendActionEmail({
    email,
    subject: "Reset your password",
    heading: "Password Reset",
    introduction:
      "A password reset was requested for your account.",
    instruction:
      "Click the button below to choose a new password.",
    buttonLabel: "Reset Password",
    actionUrl: resetUrl,
    alternativeText:
      "If the button does not work, copy and paste this link into your browser:",
    expiryText:
      "This password-reset link expires in 1 hour.",
    previewText:
      "Use this secure link to reset your Six Nations Predictor password.",
  });

  console.log("PASSWORD RESET EMAIL RESULT:", result);

  return result;
}

export async function sendEmailVerificationEmail(
  email: string,
  token: string
) {
  const verificationUrl =
    `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;

  const result = await sendActionEmail({
    email,
    subject: "Verify your email address",
    heading: "Verify Your Email",
    introduction:
      "Thank you for registering for the Six Nations Predictor.",
    instruction:
      "Click the button below to verify your email address.",
    buttonLabel: "Verify Email",
    actionUrl: verificationUrl,
    alternativeText:
      "If the button does not work, copy and paste this link into your browser:",
    expiryText:
      "This email-verification link expires in 1 hour.",
    previewText:
      "Verify your email address for the Six Nations Predictor.",
  });

  console.log("EMAIL VERIFICATION RESULT:", result);

  return result;
}
