import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFFont, type PDFPage } from "pdf-lib";
import { formatCompetitionTitle } from "@/lib/competitionTitle";

export type PredictionPdfRow = {
  id: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  createdAt: Date;
  match: {
    matchNumber: number;
    kickoffTime: Date;
    completed: boolean;
    homeTeam: { name: string };
    awayTeam: { name: string };
    tournament: {
      id: number;
      name: string;
      year: number;
      firstKickoff: Date | null;
      predictionLockAt: Date | null;
    };
  };
};

export type PredictionPdfReceipt = {
  tournamentId: number;
  receiptReference: string;
  submittedAt: Date;
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

function formatKickoff(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Dublin",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(value);
}

function formatSubmission(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Dublin",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(value);
}

function remainingText(firstKickoff: Date, generatedAt: Date) {
  const remaining = firstKickoff.getTime() - generatedAt.getTime();
  if (remaining <= 0) {
    return "Predictions are locked. Predictions cannot be changed after the competition deadline.";
  }

  const totalMinutes = Math.floor(remaining / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (days) parts.push(days + " day" + (days === 1 ? "" : "s"));
  if (hours || days) parts.push(hours + " hour" + (hours === 1 ? "" : "s"));
  parts.push(minutes + " minute" + (minutes === 1 ? "" : "s"));

  return "Time remaining to modify predictions: " + parts.join(" ") +
    ". Predictions cannot be changed after the competition deadline.";
}

export async function createPredictionsPdf(
  user: { firstName: string; lastName: string },
  predictions: PredictionPdfRow[],
  receipts: PredictionPdfReceipt[],
  generatedAt = new Date(),
) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Perfect XV - My Predictions");
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

  const width = (value: string, size: number, strong = false) =>
    (strong ? bold : font).widthOfTextAtSize(safe(value), size);

  const wrap = (
    value: string,
    maxWidth: number,
    size = 9,
    useFont: PDFFont = font,
  ) => {
    const words = safe(value).split(/\s+/);
    const lines: string[] = [];
    let line = "";

    for (const word of words) {
      const candidate = line ? line + " " + word : word;
      if (line && useFont.widthOfTextAtSize(candidate, size) > maxWidth) {
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
    size = 9,
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
    cellWidth: number,
    y: number,
    size = 9,
    strong = false,
  ) => {
    const textWidth = width(value, size, strong);
    drawText(page, value, x + Math.max(0, (cellWidth - textWidth) / 2), y, size, strong);
  };

  const groups = new Map<number, PredictionPdfRow[]>();
  for (const prediction of predictions) {
    const id = prediction.match.tournament.id;
    groups.set(id, [...(groups.get(id) ?? []), prediction]);
  }

  const pageFooters = new Map<PDFPage, string>();
  const columns = [36, 91, 391, 466, 541];
  const widths = [55, 300, 75, 75, 265];

  for (const [id, rows] of groups) {
    const tournament = rows[0].match.tournament;
    const receipt = receipts.find((item) => item.tournamentId === id);
    let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = 0;

    const header = () => {
      if (logo) {
        const scale = Math.min(56 / logo.width, 56 / logo.height);
        const logoWidth = logo.width * scale;
        const logoHeight = logo.height * scale;
        page.drawImage(logo, {
          x: LEFT,
          y: 520,
          width: logoWidth,
          height: logoHeight,
        });
      }

      drawText(page, "MY PERFECT XV PREDICTIONS", LEFT, 495, 19, true);
      drawText(page, safe(user.firstName + " " + user.lastName), LEFT, 472, 14, true);
      drawText(page, safe(formatCompetitionTitle(tournament.name, tournament.year)), LEFT, 451, 12, true);

      let top = 432;
      if (receipt) {
        const receiptText =
          "Submitted: " + formatSubmission(receipt.submittedAt) +
          " - Receipt: " + receipt.receiptReference;
        for (const line of wrap(receiptText, 760, 9)) {
          drawText(page, line, LEFT, top, 9);
          top -= 12;
        }
      }

      y = top - 24;
      page.drawRectangle({
        x: LEFT,
        y: y - 7,
        width: RIGHT - LEFT,
        height: 25,
        color: HEADER_FILL,
      });

      const labels = ["Match", "Game", "Home", "Away", "Kickoff"];
      labels.forEach((label, index) => {
        if (index === 1) {
          drawText(page, label, columns[index] + 5, y + 2, 9, true);
        } else {
          drawCentered(page, label, columns[index], widths[index], y + 2, 9, true);
        }
      });

      y -= 28;
      const firstKickoff = tournament.predictionLockAt ?? tournament.firstKickoff ?? rows[0].match.kickoffTime;
      pageFooters.set(page, remainingText(firstKickoff, generatedAt));
    };

    header();

    for (const row of rows) {
      const gameLines = [
        safe(row.match.homeTeam.name),
        safe(row.match.awayTeam.name),
      ];

      const tournamentKickoff =
        row.match.tournament.predictionLockAt ?? row.match.tournament.firstKickoff ?? row.match.kickoffTime;
      const kickoff =
        generatedAt >= tournamentKickoff && row.match.completed
          ? "Concluded"
          : formatKickoff(row.match.kickoffTime);

      const kickoffLines = wrap(kickoff, widths[4] - 10, 9);
      const rowHeight = Math.max(
        40,
        Math.max(gameLines.length, kickoffLines.length) * 13 + 14,
      );

      if (y - rowHeight < 64) {
        page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        header();
      }

      drawCentered(page, String(row.match.matchNumber), columns[0], widths[0], y - 2, 9, true);

      gameLines.forEach((line, index) => {
        drawText(page, line, columns[1] + 5, y - index * 13, 9, index === 0);
      });

      drawCentered(page, String(row.predictedHomeScore), columns[2], widths[2], y - 2, 10, true);
      drawCentered(page, String(row.predictedAwayScore), columns[3], widths[3], y - 2, 10, true);

      kickoffLines.forEach((line, index) => {
        drawCentered(page, line, columns[4], widths[4], y - index * 12, 9, kickoff === "Concluded");
      });

      y -= rowHeight;
      page.drawLine({
        start: { x: LEFT, y: y + 12 },
        end: { x: RIGHT, y: y + 12 },
        thickness: 0.4,
        color: LINE,
      });
    }
  }

  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    const footer = pageFooters.get(page) ??
      "Predictions cannot be changed after the competition deadline.";
    const footerLines = wrap(footer, 690, 8);
    footerLines.slice(0, 2).forEach((line, lineIndex) => {
      drawText(page, line, LEFT, 30 - lineIndex * 10, 8, false, MUTED);
    });
    drawText(page, String(index + 1) + " / " + String(pages.length), 768, 30, 8, false, MUTED);
  });

  return pdf.save();
}
