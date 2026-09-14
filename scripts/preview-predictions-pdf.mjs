import { createPredictionsPdf } from "../src/lib/predictionsPdf.ts";
import fs from "node:fs";
const rows = Array.from({ length: 15 }, (_, i) => ({
  id: 901 + i, predictedHomeScore: 24, predictedAwayScore: 17,
  createdAt: new Date("2026-01-01T12:00:00Z"),
  match: { matchNumber: i + 1, kickoffTime: new Date("2026-02-05T20:00:00Z"),
    homeTeam: { name: i === 3 ? "A long international rugby club name with several words" : "Ireland" },
    awayTeam: { name: "France" }, tournament: { id: 1, name: "Six Nations", year: 2026 } },
}));
fs.mkdirSync("tmp/pdfs", { recursive: true });
fs.writeFileSync("tmp/pdfs/predictions-sample.pdf", await createPredictionsPdf(
  { firstName: "Seán", lastName: "O’Brien" }, rows,
  [{ tournamentId: 1, receiptReference: "TEST-RECEIPT-123", submittedAt: new Date("2026-01-01T12:00:00Z") }],
));
