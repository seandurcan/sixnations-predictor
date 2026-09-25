import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
  console.log(`Skipping database migrations for Vercel ${process.env.VERCEL_ENV} deployment.`);
  process.exit(0);
}

// Only recover the known multi-competition migration if Prisma recorded it as failed.
const MIGRATION = "20260924140500_allow_multiple_competitions_per_year";

function run(args) {
  const result = spawnSync("npx", ["prisma", ...args], {
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

let deploy = run(["migrate", "deploy"]);
if (deploy.status === 0) process.exit(0);

const output = `${deploy.stdout ?? ""}\n${deploy.stderr ?? ""}`;
const knownFailedMigration =
  output.includes("P3009") &&
  output.includes(MIGRATION);

if (!knownFailedMigration) {
  process.exit(deploy.status ?? 1);
}

console.log(`Recovering known failed migration ${MIGRATION} and retrying...`);
const resolved = run(["migrate", "resolve", "--rolled-back", MIGRATION]);
if (resolved.status !== 0) {
  process.exit(resolved.status ?? 1);
}

deploy = run(["migrate", "deploy"]);
process.exit(deploy.status ?? 1);
