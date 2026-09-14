import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type PredictionPdfRow = {
  id: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  createdAt: Date;
  match: {
    matchNumber: number;
    kickoffTime: Date;
    homeTeam: { name: string };
    awayTeam: { name: string };
    tournament: { id: number; name: string; year: number };
  };
};
export type PredictionPdfReceipt = {
  tournamentId: number;
  receiptReference: string;
  submittedAt: Date;
};

export async function createPredictionsPdf(
  user: { firstName: string; lastName: string },
  predictions: PredictionPdfRow[],
  receipts: PredictionPdfReceipt[],
  generatedAt = new Date(),
) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Perfect XV — My submitted predictions");
  pdf.setAuthor("Perfect XV");
  pdf.setCreationDate(generatedAt);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.06, 0.14, 0.24);
  const muted = rgb(0.34, 0.39, 0.45);
  const date = (value: Date) => new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Dublin", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    timeZoneName: "short",
  }).format(value);
  // Built-in PDF fonts cover western European text, including Irish accents.
  const safe = (value: string) => Array.from(value.normalize("NFC")).map((char) => {
    try { font.encodeText(char); return char; } catch { return "?"; }
  }).join("");
  const wrap = (value: string, width: number, size = 9) => {
    const lines: string[] = [];
    let line = "";
    for (const word of safe(value).split(/\s+/)) {
      if (line && font.widthOfTextAtSize(line + " " + word, size) > width) {
        lines.push(line); line = "";
      }
      for (const char of (line ? " " : "") + word) {
        if (font.widthOfTextAtSize(line + char, size) > width) {
          lines.push(line); line = "";
        }
        line += char;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };
  const groups = new Map<number, PredictionPdfRow[]>();
  for (const prediction of predictions) {
    const id = prediction.match.tournament.id;
    groups.set(id, [...(groups.get(id) ?? []), prediction]);
  }
  const columns = [36, 78, 315, 480, 540, 600];
  const widths = [36, 231, 159, 54, 54, 200];
  for (const [id, rows] of groups) {
    const tournament = rows[0].match.tournament;
    const receipt = receipts.find((item) => item.tournamentId === id);
    let page = pdf.addPage([842, 595]);
    let y = 0;
    const text = (value: string, x: number, top: number, size = 9, strong = false) => {
      page.drawText(safe(value), { x, y: top, size, font: strong ? bold : font, color: navy });
    };
    const header = () => {
      text("PERFECT XV", 36, 555, 22, true);
      text("My submitted predictions", 36, 532, 13);
      const nameLines = wrap(`${user.firstName} ${user.lastName}`, 765, 10);
      let top = 510;
      for (const line of nameLines) { text(line, 36, top, 10); top -= 13; }
      for (const line of wrap(`${tournament.name} · ${tournament.year}`, 765, 12)) {
        text(line, 36, top - 7, 12, true); top -= 15;
      }
      top -= 15;
      const details = receipt
        ? `Submitted: ${date(receipt.submittedAt)} · Receipt: ${receipt.receiptReference}`
        : "Saved individual predictions · No tournament submission receipt recorded";
      for (const line of wrap(details, 765)) { text(line, 36, top); top -= 12; }
      text(`Generated: ${date(generatedAt)} · All times Europe/Dublin`, 36, top - 4, 9);
      y = top - 40;
      page.drawRectangle({ x: 36, y: y - 7, width: 770, height: 25, color: rgb(0.91, 0.95, 0.97) });
      ["Match", "Home / Away teams", "Kickoff", "Home", "Away", "First saved / Prediction ID"].forEach((label, i) => text(label, columns[i] + 4, y + 2, 9, true));
      y -= 26;
    };
    header();
    for (const row of rows) {
      const cells = [String(row.match.matchNumber), `${row.match.homeTeam.name} / ${row.match.awayTeam.name}`,
        date(row.match.kickoffTime), String(row.predictedHomeScore), String(row.predictedAwayScore),
        `${date(row.createdAt)} · #${row.id}`].map((value, i) => wrap(value, widths[i] - 8));
      const height = Math.max(34, Math.max(...cells.map((lines) => lines.length)) * 12 + 14);
      if (y - height < 58) { page = pdf.addPage([842, 595]); header(); }
      cells.forEach((lines, col) => lines.forEach((line, index) => text(line, columns[col] + 4, y - index * 12, 9, col === 3 || col === 4)));
      y -= height;
      page.drawLine({ start: { x: 36, y: y + 12 }, end: { x: 806, y: y + 12 }, thickness: 0.4, color: rgb(0.8, 0.84, 0.87) });
    }
  }
  pdf.getPages().forEach((page, index, pages) => {
    page.drawText("Current saved scores at export time. First saved is the original record date, not the last edit.", { x: 36, y: 30, size: 8, font, color: muted });
    page.drawText(`${index + 1} / ${pages.length}`, { x: 768, y: 30, size: 8, font, color: muted });
  });
  return pdf.save();
}
