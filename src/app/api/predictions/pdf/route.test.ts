// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { GET } from "./route";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  prediction: { findMany: vi.fn() }, predictionSubmission: { findMany: vi.fn() },
} }));
const row = {
  id: 901, predictedHomeScore: 24, predictedAwayScore: 17, createdAt: new Date("2026-01-01T12:00:00Z"),
  match: { matchNumber: 1, kickoffTime: new Date("2026-02-05T20:00:00Z"),
    homeTeam: { name: "Ireland" }, awayTeam: { name: "France" },
    tournament: { id: 1, name: "Six Nations", year: 2026 } },
};
describe("private predictions PDF", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(requireUser).mockResolvedValue({ id: 7, firstName: "Seán", lastName: "O’Brien", deletedAt: null } as never);
    vi.mocked(prisma.prediction.findMany).mockResolvedValue([row] as never);
    vi.mocked(prisma.predictionSubmission.findMany).mockResolvedValue([]);
  });
  it("generates a valid private PDF using session identity for both queries", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("cache-control")).toContain("private, no-store");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(prisma.prediction.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 7 } }));
    expect(prisma.predictionSubmission.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 7 } }));
    const pdf = await PDFDocument.load(await response.arrayBuffer());
    expect(pdf.getPageCount()).toBe(1);
  });
  it("does not query predictions for an unauthenticated request", async () => {
    vi.mocked(requireUser).mockRejectedValue(new Error("Authentication required"));
    expect((await GET()).status).toBe(401);
    expect(prisma.prediction.findMany).not.toHaveBeenCalled();
  });
  it("rejects deleted accounts before reading predictions", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: 7, deletedAt: new Date() } as never);
    expect((await GET()).status).toBe(401);
    expect(prisma.prediction.findMany).not.toHaveBeenCalled();
  });
  it("returns a helpful empty state", async () => {
    vi.mocked(prisma.prediction.findMany).mockResolvedValue([]);
    const response = await GET();
    expect(response.status).toBe(404);
    expect((await response.json()).error).toContain("no submitted predictions");
  });
  it("uses each successive session rather than caching a previous entrant", async () => {
    await GET();
    vi.mocked(requireUser).mockResolvedValue({ id: 8, firstName: "Another", lastName: "Player" } as never);
    await GET();
    expect(prisma.prediction.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { userId: 8 } }));
  });
  it("paginates long multi-tournament records", async () => {
    vi.mocked(prisma.prediction.findMany).mockResolvedValue(Array.from({ length: 40 }, (_, i) => ({ ...row,
      id: 901 + i, match: { ...row.match, matchNumber: i + 1,
        homeTeam: { name: "A long international rugby club name with several words" },
        tournament: { ...row.match.tournament, id: i < 20 ? 1 : 2 } },
    })) as never);
    const response = await GET();
    const pdf = await PDFDocument.load(await response.arrayBuffer());
    expect(pdf.getPageCount()).toBeGreaterThan(2);
  });
});
