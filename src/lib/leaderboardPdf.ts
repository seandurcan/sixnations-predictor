import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFPage } from "pdf-lib";

export type LeaderboardPdfRow = {
  rank: number;
  player: string;
  totalPoints: number;
  correctWins: number;
  perfectScores: number;
  correctMargins: number;
  predictionDelta: number;
  movement: number | null;
};

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const LEFT = 36;
const RIGHT = 806;
const NAVY = rgb(0.06, 0.14, 0.24);
const MUTED = rgb(0.34, 0.39, 0.45);
const HEADER_FILL = rgb(0.91, 0.95, 0.97);
const LINE = rgb(0.8, 0.84, 0.87);

async function embedLogo(pdf: PDFDocument): Promise<PDFImage | null> {
  try {
    const bytes = await readFile(path.join(process.cwd(), "public", "images", "logo.jpeg"));
    return await pdf.embedJpg(bytes);
  } catch {
    return null;
  }
}

export async function createLeaderboardPdf(
  rows: LeaderboardPdfRow[],
  tournamentLabel: string,
  generatedAt = new Date(),
) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Perfect XV - Leaderboard");
  pdf.setAuthor("Perfect XV");
  pdf.setCreationDate(generatedAt);

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = await embedLogo(pdf);

  const safe = (value: string) =>
    Array.from(value.normalize("NFC"))
      .map((char) => {
        try {
          font.encodeText(char);
          return char;
        } catch {
          return "?";
        }
      })
      .join("");

  const wrap = (value: string, maxWidth: number, size = 8) => {
    const words = safe(value).split(/\s+/);
    const lines: string[] = [];
    let line = "";

    for (const word of words) {
      const candidate = line ? line + " " + word : word;
      if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) lines.push(line);
    return lines.length ? lines : [""];
  };

  const drawText = (
    page: PDFPage,
    value: string,
    x: number,
    y: number,
    size = 8,
    strong = false,
    colour = NAVY,
  ) => {
    page.drawText(safe(value), {
      x,
      y,
      size,
      font: strong ? bold : font,
      color: colour,
    });
  };

  const drawCentered = (
    page: PDFPage,
    value: string,
    x: number,
    width: number,
    y: number,
    size = 8,
    strong = false,
  ) => {
    const textWidth = (strong ? bold : font).widthOfTextAtSize(safe(value), size);
    drawText(page, value, x + Math.max(0, (width - textWidth) / 2), y, size, strong);
  };

  const columns = [36, 86, 266, 341, 421, 501, 591, 691];
  const widths = [50, 180, 75, 80, 80, 90, 100, 115];
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = 0;

  const header = () => {
    if (logo) {
      const scale = Math.min(56 / logo.width, 56 / logo.height);
      page.drawImage(logo, {
        x: LEFT,
        y: 520,
        width: logo.width * scale,
        height: logo.height * scale,
      });
    }

    drawText(page, "PERFECT XV LEADERBOARD", LEFT, 495, 19, true);
    drawText(page, tournamentLabel, LEFT, 473, 12, true);
    drawText(
      page,
      "Full leaderboard in official rank order. Scores may change while matches are live.",
      LEFT,
      450,
      9,
      false,
      MUTED,
    );
    drawText(
      page,
      "For detailed explanations of each leaderboard heading, open your user manual by clicking on your name within the app.",
      LEFT,
      437,
      8,
      false,
      MUTED,
    );

    y = 405;
    page.drawRectangle({
      x: LEFT,
      y: y - 8,
      width: RIGHT - LEFT,
      height: 34,
      color: HEADER_FILL,
    });

    const headers = [
      "Rank",
      "Player",
      "Points Total",
      "Correct Wins",
      "Perfect Scores",
      "Correct Margins",
      "Prediction Delta",
      "Movement",
    ];

    headers.forEach((label, index) => {
      const lines = wrap(label, widths[index] - 8, 8);
      lines.forEach((line, lineIndex) => {
        const yy = y + 8 - lineIndex * 10;
        if (index === 1) {
          drawText(page, line, columns[index] + 4, yy, 8, true);
        } else {
          drawCentered(page, line, columns[index], widths[index], yy, 8, true);
        }
      });
    });

    y -= 30;
  };

  header();

  for (const row of rows) {
    const rowHeight = 28;
    if (y - rowHeight < 58) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      header();
    }

    const movement =
      row.movement == null
        ? "-"
        : row.movement > 0
          ? "+" + row.movement
          : String(row.movement);

    drawCentered(page, String(row.rank), columns[0], widths[0], y, 9, true);

    const playerLines = wrap(row.player, widths[1] - 8, 9);
    playerLines.slice(0, 2).forEach((line, index) => {
      drawText(page, line, columns[1] + 4, y - index * 11, 9, index === 0);
    });

    const values = [
      String(row.totalPoints),
      String(row.correctWins),
      String(row.perfectScores),
      String(row.correctMargins),
      String(row.predictionDelta),
      movement,
    ];

    values.forEach((value, index) => {
      const col = index + 2;
      drawCentered(page, value, columns[col], widths[col], y, 9, index === 0);
    });

    y -= rowHeight;
    page.drawLine({
      start: { x: LEFT, y: y + 10 },
      end: { x: RIGHT, y: y + 10 },
      thickness: 0.4,
      color: LINE,
    });
  }

  const pages = pdf.getPages();
  pages.forEach((currentPage, index) => {
    drawText(
      currentPage,
      String(index + 1) + " / " + String(pages.length),
      768,
      30,
      8,
      false,
      MUTED,
    );
  });

  return pdf.save();
}
