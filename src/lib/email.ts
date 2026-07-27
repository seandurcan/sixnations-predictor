import { Resend } from "resend";

export const resend = new Resend(
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

  const result =
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Reset your password",
      html: `
        <h2>Password Reset</h2>

        <p>
          A password reset was requested for your account.
        </p>

        <p>
          Click the button below to reset your password:
        </p>

        <p>
          ${resetUrl}
            Reset Password
          </a>
        </p>

        <p>
          If the button does not work, use this link:
        </p>

        <p>
          ${resetUrl}
        </p>

        <p>
          This link expires in 1 hour.
        </p>
      `,
    });

  console.log(
    "PASSWORD RESET EMAIL RESULT:",
    result
  );
}

export async function sendEmailVerificationEmail(
  email: string,
  token: string
) {
  const verificationUrl =
    `${process.env.APP_URL}/verify-email?token=${token}`;

  const result =
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Verify your email address",
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
          If the link does not work, use:
        </p>

        <p>
          ${verificationUrl}
        </p>

        <p>
          This link expires in 1 hour.
        </p>
      `,
    });

  console.log(
    "EMAIL VERIFICATION RESULT:",
    result
  );
}