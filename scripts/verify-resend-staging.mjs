const branch = process.env.VERCEL_GIT_COMMIT_REF;

if (branch !== "staging") {
  console.log("Skipping Resend staging verification outside staging.");
  process.exit(0);
}

const key = process.env.RESEND_API_KEY?.trim();
if (!key) {
  throw new Error("RESEND_API_KEY is not configured for staging.");
}

const response = await fetch("https://api.resend.com/domains", {
  headers: {
    Authorization: `Bearer ${key}`,
  },
});

const body = await response.text();

if (!response.ok) {
  throw new Error(`Resend key verification failed (${response.status}): ${body.slice(0, 500)}`);
}

const payload = JSON.parse(body);
const domains = Array.isArray(payload?.data) ? payload.data : [];
const domain = domains.find((item) => item?.name === "perfect-xv.org");

if (!domain) {
  throw new Error("Resend key is valid, but perfect-xv.org is not configured in this Resend account.");
}

if (domain.status !== "verified") {
  throw new Error(`perfect-xv.org is present in Resend but is not verified (status: ${domain.status ?? "unknown"}).`);
}

console.log("Resend staging verification succeeded: key accepted and perfect-xv.org is verified.");
