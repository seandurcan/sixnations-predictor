export const TEST_SITE = "https://sixnations-predictor-vercel-ready-perfect-xv.vercel.app";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildTestingEmail(firstName: string, unsubscribeUrl: string) {
  const name = escapeHtml(firstName || "there");
  const site = escapeHtml(TEST_SITE);
  const unsubscribe = escapeHtml(unsubscribeUrl);
  const cardImage = `${TEST_SITE}/images/stripe-test-card.svg`;

  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f4f7fb;color:#0b1f34;font-family:Arial,Helvetica,sans-serif;"><div style="max-width:680px;margin:0 auto;padding:28px 14px;"><div style="background:#fff;border:1px solid #dbe3ec;border-radius:14px;padding:30px;"><p style="margin:0 0 8px;color:#007bff;font-weight:800;letter-spacing:.08em;">PERFECT XV</p><h1 style="margin:0 0 20px;font-size:28px;line-height:1.25;">Could you help me test Perfect XV?</h1><p>Hi ${name},</p><p>Perfect XV is now at the stage where real-user testing would be extremely useful. If you have a little time, I would be grateful if you could work through the site and tell me about anything that is unclear, awkward, incorrect or simply does not work as expected.</p><p>If possible, please complete your testing by <strong>Sunday, 11 October 2026</strong>.</p><div style="margin:22px 0;padding:16px;border-left:5px solid #f59e0b;background:#fffbeb;"><strong>Your test account has been reset to unverified.</strong><br>As part of this test cycle, please reset your password and request a fresh verification email before continuing.</div><h2 style="font-size:21px;">First: regain access to your account</h2><ol style="line-height:1.65;padding-left:24px;"><li>Open the Perfect XV test site using the button below.</li><li>Select <strong>Login</strong>, then choose <strong>Forgot Password?</strong>.</li><li>Enter the email address on which you received this message and select <strong>Send Reset Link</strong>.</li><li>Open the password-reset email and choose a new password. It must contain at least 8 characters, including uppercase, lowercase, a number and a special character.</li><li>Return to <strong>Login</strong>, enter your email address and select <strong>Resend Verification Email</strong>.</li><li>Open the new verification email and follow the verification link.</li><li>Return to Perfect XV and log in using your new password.</li></ol><p style="margin:24px 0;text-align:center;"><a href="${site}" style="display:inline-block;background:#007bff;color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:9px;">Open Perfect XV Test Site</a></p><h2 style="font-size:21px;">What I would like you to test</h2><ol style="line-height:1.7;padding-left:24px;"><li>Look around the Home page and menu. Try it on your phone and, if possible, on a computer or tablet as well.</li><li>Open your Dashboard and confirm that the information shown makes sense.</li><li>Open <strong>Account</strong> and check your account details.</li><li>Enter the current test competition and go through the payment step.</li><li>Enter predictions manually for a few matches, then try <strong>Quick Pick</strong>. Change at least one prediction and save it again.</li><li>Check the prediction progress, countdown/locking information and the ability to download your prediction record/PDF where available.</li><li>Open the <strong>Leaderboard</strong>, <strong>Fixtures</strong>, <strong>Competition Rules</strong>, <strong>User Manual</strong> and <strong>Heritage &amp; History</strong> sections.</li><li>Use <strong>Ask Perfect XV</strong> at the bottom-right of the page. Ask several questions in your own words. Try a Likely Match option when offered, use the Helpful/Not Helpful feedback, and test the Helpdesk option if an answer is poor.</li><li>If you use <strong>Invite Friends</strong>, please only send a test invitation to an address you control or to somebody who has agreed to receive it.</li><li>Open <strong>Email Preferences</strong>. You can test the unsubscribe option from an optional Perfect XV email and opt back in afterwards if you wish.</li><li>Report anything that looks wrong: wording, layout, mobile display, navigation, email delivery, scoring, results, chatbot answers or anything else that causes confusion.</li></ol><div style="margin:26px 0;padding:18px;border:3px solid #b91c1c;background:#fff1f2;border-radius:10px;"><p style="margin:0 0 8px;font-size:20px;"><strong>NO PAYMENT WILL BE TAKEN FROM YOU. THIS IS A TEST.</strong></p><p style="margin:0;"><strong>Do not use a real credit or debit card.</strong> Use only the dummy Stripe test card shown below.</p></div><img src="${cardImage}" alt="Stripe test card: 4242 4242 4242 4242, expiry 12/34, CVC 123. No payment will be taken." width="600" style="display:block;width:100%;max-width:600px;height:auto;margin:18px auto;border:0;" /><div style="background:#f8fafc;border:1px solid #dbe3ec;border-radius:10px;padding:16px;line-height:1.6;"><strong>Stripe dummy card details</strong><br>Card number: <strong>4242 4242 4242 4242</strong><br>Expiry: <strong>12/34</strong><br>CVC: <strong>123</strong><br>Name/postcode: any valid test details.</div><h2 style="font-size:21px;margin-top:28px;">If something goes wrong</h2><p>Please make a note of what you were trying to do and what happened. A screenshot is particularly useful. You can use the Perfect XV Helpdesk through <strong>Ask Perfect XV</strong>, or reply to this email.</p><p>Thank you for helping test the site. Real-user feedback is the best way to find the things that are obvious to the developer but not obvious to everybody else.</p><p style="margin-top:28px;">Sean<br><strong>Perfect XV</strong><br><em>Analyse. Predict. Win.</em></p><p style="margin:30px 0 0;color:#64748b;font-size:13px;line-height:1.5;">This message also explains an account-state change made for the Perfect XV test cycle. For optional Perfect XV announcements, you can <a href="${unsubscribe}" style="color:#475569;">unsubscribe here</a>.</p></div></div></body></html>`;

  const text = [
    "Could you help me test Perfect XV?",
    "",
    `Hi ${firstName || "there"},`,
    "",
    "Perfect XV is now at the stage where real-user testing would be extremely useful. If you have a little time, I would be grateful if you could work through the site and report anything unclear, incorrect or not working as expected.",
    "",
    "If possible, please complete your testing by Sunday, 11 October 2026.",
    "",
    "YOUR TEST ACCOUNT HAS BEEN RESET TO UNVERIFIED.",
    "Please reset your password and request a fresh verification email before continuing.",
    "",
    "FIRST: REGAIN ACCESS",
    "1. Open the test site: " + TEST_SITE,
    "2. Select Login, then Forgot Password?.",
    "3. Enter the email address on which you received this message and send the reset link.",
    "4. Use the email link to choose a new password.",
    "5. Return to Login, enter your email address and select Resend Verification Email.",
    "6. Follow the verification link, then log in with your new password.",
    "",
    "WHAT TO TEST",
    "1. Home page, menu and mobile/desktop layout.",
    "2. Dashboard and account details.",
    "3. Enter the current test competition and complete the payment test.",
    "4. Enter predictions manually, try Quick Pick, edit a prediction and save again.",
    "5. Check prediction progress, locking/countdown information and prediction PDF/record.",
    "6. Check Leaderboard, Fixtures, Competition Rules, User Manual and Heritage & History.",
    "7. Use Ask Perfect XV, Likely Matches, feedback and Helpdesk escalation.",
    "8. Use Invite Friends only with an address you control or with permission.",
    "9. Test Email Preferences/unsubscribe if you wish.",
    "10. Report wording, layout, navigation, email, scoring, result or chatbot problems.",
    "",
    "NO PAYMENT WILL BE TAKEN FROM YOU. THIS IS A TEST.",
    "DO NOT USE A REAL CREDIT OR DEBIT CARD.",
    "",
    "Use the Stripe dummy test card only:",
    "Card: 4242 4242 4242 4242",
    "Expiry: 12/34",
    "CVC: 123",
    "Name/postcode: any valid test details.",
    "",
    "If something goes wrong, note what you were doing and include a screenshot if possible. Use Ask Perfect XV / Helpdesk or reply to this email.",
    "",
    "Thank you for helping test Perfect XV.",
    "",
    "Sean",
    "Perfect XV",
    "Analyse. Predict. Win.",
    "",
    "Unsubscribe from optional Perfect XV announcements: " + unsubscribeUrl,
  ].join("\n");

  return { html, text };
}


