import fs from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
const directory = "tmp/dashboard-baseline";
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(`${directory}/page.tsx`, execFileSync("git", ["show", "ef7342ebda57af431c60ce6a33ff86eadf0b0144:src/app/dashboard/page.tsx"]));
fs.copyFileSync("src/app/dashboard/page.test.tsx", `${directory}/page.test.tsx`);
const result = spawnSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", `${directory}/page.test.tsx`, "--reporter=json", "--outputFile=tmp/dashboard-baseline-results.json"], { encoding: "utf8" });
const report = JSON.parse(fs.readFileSync("tmp/dashboard-baseline-results.json", "utf8"));
console.log(JSON.stringify({ passed: report.numPassedTests, failed: report.numFailedTests,
  failures: report.testResults.flatMap((suite) => suite.assertionResults.filter((test) => test.status === "failed").map((test) => test.fullName)),
}, null, 2));
process.exitCode = result.status;
