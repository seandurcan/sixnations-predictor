export type ManualFixture = {
  providerGameId: number | null;
  round: number | null;
  kickoffTime: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  providerHomeTeam: string;
  providerAwayTeam: string;
  venue: string | null;
  city: string | null;
  country: string | null;
};

export type ManualFixtureParseResult = {
  fixtures: ManualFixture[];
  participantTeams: string[];
  diagnostics: string[];
};

function normaliseHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if ((char === "," || char === "\t") && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function excelColumnIndex(reference: string) {
  const letters = reference.match(/^[A-Z]+/i)?.[0]?.toUpperCase() ?? "";
  let result = 0;
  for (const char of letters) result = result * 26 + char.charCodeAt(0) - 64;
  return Math.max(0, result - 1);
}

async function unzipEntries(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("The Excel file is not a valid .xlsx workbook.");

  const count = view.getUint16(eocd + 10, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries = new Map<string, string>();
  let offset = centralOffset;

  for (let index = 0; index < count; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.slice(offset + 46, offset + 46 + fileNameLength));

    if (name === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(name)) {
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(start, start + compressedSize);
      let raw: Uint8Array;
      if (method === 0) {
        raw = compressed;
      } else if (method === 8) {
        const stream = new Blob([compressed]).stream().pipeThrough(
          new DecompressionStream("deflate-raw")
        );
        raw = new Uint8Array(await new Response(stream).arrayBuffer());
      } else {
        throw new Error(`Unsupported Excel compression method ${method}.`);
      }
      entries.set(name, decoder.decode(raw));
    }

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

async function parseXlsx(buffer: ArrayBuffer) {
  const entries = await unzipEntries(buffer);
  const parser = new DOMParser();
  const sharedXml = entries.get("xl/sharedStrings.xml");
  const sharedStrings = sharedXml
    ? Array.from(parser.parseFromString(sharedXml, "application/xml").getElementsByTagName("si"))
        .map((item) =>
          Array.from(item.getElementsByTagName("t"))
            .map((node) => node.textContent ?? "")
            .join("")
        )
    : [];

  const sheetName = Array.from(entries.keys())
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))[0];
  if (!sheetName) throw new Error("No worksheet was found in the Excel file.");

  const sheet = parser.parseFromString(entries.get(sheetName)!, "application/xml");
  return Array.from(sheet.getElementsByTagName("row")).map((row) => {
    const values: string[] = [];
    for (const cell of Array.from(row.getElementsByTagName("c"))) {
      const ref = cell.getAttribute("r") ?? "";
      const index = excelColumnIndex(ref);
      const type = cell.getAttribute("t");
      const value = cell.getElementsByTagName("v")[0]?.textContent ?? "";
      const inline = cell.getElementsByTagName("is")[0]?.textContent ?? "";
      values[index] =
        type === "s" ? sharedStrings[Number(value)] ?? "" :
        type === "inlineStr" ? inline :
        value;
    }
    return values;
  }).filter((row) => row.some((value) => String(value ?? "").trim()));
}

function excelSerialToDate(value: string) {
  const serial = Number(value);
  if (!Number.isFinite(serial)) return null;
  const milliseconds = Math.round((serial - 25569) * 86400 * 1000);
  return new Date(milliseconds);
}

function normaliseDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const date = excelSerialToDate(trimmed);
    return date && !Number.isNaN(date.getTime()) ? date.toISOString().slice(0, 10) : null;
  }
  const dmy = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  const ymd = trimmed.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, "0")}-${ymd[3].padStart(2, "0")}`;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function normaliseTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "00:00";
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const fraction = Number(trimmed) % 1;
    const minutes = Math.round(fraction * 24 * 60);
    return `${String(Math.floor(minutes / 60) % 24).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  }
  const match = trimmed.match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : trimmed;
}

function kickoffIso(dateValue: string, timeValue: string) {
  const date = normaliseDate(dateValue);
  if (!date) return null;
  const time = normaliseTime(timeValue);
  const parsed = new Date(`${date}T${time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function findColumn(headers: string[], candidates: string[]) {
  const normalised = headers.map(normaliseHeader);
  return normalised.findIndex((header) => candidates.includes(header));
}

export async function parseManualFixtureFile(file: File): Promise<ManualFixtureParseResult> {
  const lower = file.name.toLowerCase();
  const rows = lower.endsWith(".xlsx")
    ? await parseXlsx(await file.arrayBuffer())
    : parseCsv(await file.text());

  if (rows.length < 2) throw new Error("The fixture file contains no data rows.");

  const headers = rows[0].map((value) => String(value ?? "").trim());
  const columns = {
    round: findColumn(headers, ["round", "week", "matchday"]),
    date: findColumn(headers, ["date", "matchdate", "fixturedate"]),
    time: findColumn(headers, ["kickoff", "kickofftime", "time", "ko"]),
    home: findColumn(headers, ["hometeam", "home"]),
    away: findColumn(headers, ["awayteam", "away"]),
    venue: findColumn(headers, ["stadium", "venue", "ground"]),
    city: findColumn(headers, ["city", "town"]),
    country: findColumn(headers, ["country", "nation"]),
  };

  if (columns.date < 0 || columns.home < 0 || columns.away < 0) {
    throw new Error("The file must include Date, Home Team and Away Team columns.");
  }

  const fixtures = rows.slice(1).map((row) => {
    const home = String(row[columns.home] ?? "").trim();
    const away = String(row[columns.away] ?? "").trim();
    const roundText = columns.round >= 0 ? String(row[columns.round] ?? "") : "";
    const roundMatch = roundText.match(/\d+/);
    return {
      providerGameId: null,
      round: roundMatch ? Number(roundMatch[0]) : null,
      kickoffTime: kickoffIso(
        String(row[columns.date] ?? ""),
        columns.time >= 0 ? String(row[columns.time] ?? "") : "00:00"
      ),
      homeTeam: home || null,
      awayTeam: away || null,
      providerHomeTeam: home,
      providerAwayTeam: away,
      venue: columns.venue >= 0 ? String(row[columns.venue] ?? "").trim() || null : null,
      city: columns.city >= 0 ? String(row[columns.city] ?? "").trim() || null : null,
      country: columns.country >= 0 ? String(row[columns.country] ?? "").trim() || null : null,
    } satisfies ManualFixture;
  }).filter((fixture) => fixture.homeTeam || fixture.awayTeam);

  const participantTeams = Array.from(
    new Set(fixtures.flatMap((fixture) => [fixture.homeTeam, fixture.awayTeam]).filter((team): team is string => Boolean(team)))
  ).sort((a, b) => a.localeCompare(b));

  return {
    fixtures,
    participantTeams,
    diagnostics: [`Manual fixture upload: ${file.name} · ${fixtures.length} row(s)`],
  };
}
