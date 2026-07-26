import { Resend } from "resend";

export const resend =
  new Resend(
    process.env.RESEND_API_KEY
  );

console.log(
  "RESEND KEY EXISTS:",
  !!process.env.RESEND_API_KEY
);

export async function sendPasswordResetEmail(
  email: string,
  token: string
) {
  const resetUrl =
    `${process.env.APP_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from:
      "Six Nations Predictor <noreply@yourdomain.com>",
    to: email,
    subject:
      "Reset your password",
    html: `
      <h2>Password Reset</h2>

      <p>
        A password reset was requested for your account.
      </p>

      <p>
        ${resetUrl}
          Reset Password
        </a>
      </p>

      <p>
        This link expires in 1 hour.
      </p>
    `,
  });
}

export async function sendEmailVerificationEmail(
  email: string,
  token: string
) {
  const verificationUrl =
    `${process.env.APP_URL}/verify-email?token=${token}`;

  await resend.emails.send({
    from:
      "Six Nations Predictor <noreply@yourdomain.com>",
    to: email,
    subject:
      "Verify your email address",
    html: `
      <h2>Verify Your Email</h2>

      <p>
        Thank you for registering for the
        Six Nations Predictor.
      </p>

      <p>
        Please click the link below to verify
        your email address:
      </p>

      <p>
        ${verificationUrl}
          Verify Email
        </a>
      </p>

      <p>
        This link expires in 1 hour.
      </p>
    `,
  });
}