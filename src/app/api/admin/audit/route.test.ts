import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { GET } from "./route";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    scoreAudit: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    match: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const mockAdmin = {
  id: 1,
  email: "admin@example.com",
  role: "ADMIN",
};

const mockAudits = [
  {
    id: 301,
    matchId: 101,
    previousHome: null,
    previousAway: null,
    newHome: 28,
    newAway: 20,
    adminUserId: 1,
    createdAt: new Date("2027-01-29T18:30:00.000Z"),
  },
  {
    id: 302,
    matchId: 102,
    previousHome: 17,
    previousAway: 14,
    newHome: 24,
    newAway: 17,
    adminUserId: 2,
    createdAt: new Date("2027-01-30T20:15:00.000Z"),
  },
];

const mockMatchOne = {
  id: 101,
  homeTeam: {
    name: "Ireland",
    shortCode: "IRE",
  },
  awayTeam: {
    name: "France",
    shortCode: "FRA",
  },
};

const mockMatchTwo = {
  id: 102,
  homeTeam: {
    name: "Scotland",
    shortCode: "SCO",
  },
  awayTeam: {
    name: "England",
    shortCode: "ENG",
  },
};

const mockAdminUserOne = {
  id: 1,
  firstName: "Admin",
  lastName: "User",
  email: "admin@example.com",
};

const mockAdminUserTwo = {
  id: 2,
  firstName: "Result",
  lastName: "Manager",
  email: "result@example.com",
};

function createRequest(
  url = "http://localhost/api/admin/audit?page=1&pageSize=10"
) {
  return new Request(url);
}

function mockSuccessfulAuditLoad() {
  vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

  vi.mocked(prisma.scoreAudit.count).mockResolvedValueOnce(22);

  vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce(
    mockAudits as any
  );

  vi.mocked(prisma.match.findUnique)
    .mockResolvedValueOnce(mockMatchOne as any)
    .mockResolvedValueOnce(mockMatchTwo as any);

  vi.mocked(prisma.user.findUnique)
    .mockResolvedValueOnce(mockAdminUserOne as any)
    .mockResolvedValueOnce(mockAdminUserTwo as any);
}

describe("GET /api/admin/audit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns paged audit history enriched with match and admin user", async () => {
    mockSuccessfulAuditLoad();

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body.success).toBe(true);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(10);
    expect(body.totalRecords).toBe(22);
    expect(body.totalPages).toBe(3);
    expect(body.audits).toHaveLength(2);

    expect(body.audits[0]).toEqual({
      ...mockAudits[0],
      createdAt: mockAudits[0].createdAt.toISOString(),
      match: mockMatchOne,
      adminUser: mockAdminUserOne,
    });

    expect(body.audits[1]).toEqual({
      ...mockAudits[1],
      createdAt: mockAudits[1].createdAt.toISOString(),
      match: mockMatchTwo,
      adminUser: mockAdminUserTwo,
    });
  });

  it("requires admin access before loading audit history", async () => {
    mockSuccessfulAuditLoad();

    await GET(createRequest());

    expect(requireAdmin).toHaveBeenCalledTimes(1);
  });

  it("uses default page and pageSize when query params are missing", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

    vi.mocked(prisma.scoreAudit.count).mockResolvedValueOnce(0);

    vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce([]);

    const response = await GET(
      createRequest("http://localhost/api/admin/audit")
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(10);

    expect(prisma.scoreAudit.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc",
      },
      skip: 0,
      take: 10,
    });
  });

  it("uses page and pageSize query params for pagination", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

    vi.mocked(prisma.scoreAudit.count).mockResolvedValueOnce(50);

    vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce([]);

    const response = await GET(
      createRequest(
        "http://localhost/api/admin/audit?page=3&pageSize=5"
      )
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.page).toBe(3);
    expect(body.pageSize).toBe(5);
    expect(body.totalPages).toBe(10);

    expect(prisma.scoreAudit.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc",
      },
      skip: 10,
      take: 5,
    });
  });

  it("returns at least one total page when there are no audits", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

    vi.mocked(prisma.scoreAudit.count).mockResolvedValueOnce(0);

    vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce([]);

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.totalRecords).toBe(0);
    expect(body.totalPages).toBe(1);
    expect(body.audits).toEqual([]);
  });

  it("can enrich an audit when match lookup returns null", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

    vi.mocked(prisma.scoreAudit.count).mockResolvedValueOnce(1);

    vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce([
      mockAudits[0],
    ] as any);

    vi.mocked(prisma.match.findUnique).mockResolvedValueOnce(null);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
      mockAdminUserOne as any
    );

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.audits[0].match).toBeNull();
    expect(body.audits[0].adminUser).toEqual(mockAdminUserOne);
  });

  it("can enrich an audit when admin user lookup returns null", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

    vi.mocked(prisma.scoreAudit.count).mockResolvedValueOnce(1);

    vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce([
      mockAudits[0],
    ] as any);

    vi.mocked(prisma.match.findUnique).mockResolvedValueOnce(
      mockMatchOne as any
    );

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.audits[0].match).toEqual(mockMatchOne);
    expect(body.audits[0].adminUser).toBeNull();
  });

  it("returns 401 when authentication is required", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
      new Error("Authentication required")
    );

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(401);

    expect(body).toEqual({
      success: false,
      error: "Authentication required",
    });
  });

  it("returns 403 when admin access is required", async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(
      new Error("Admin access required")
    );

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(403);

    expect(body).toEqual({
      success: false,
      error: "Admin access required",
    });
  });

  it("returns 500 when audit count fails", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

    vi.mocked(prisma.scoreAudit.count).mockRejectedValueOnce(
      new Error("Audit count failed")
    );

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: "Failed to load audit history",
    });
  });

  it("returns 500 when audit enrichment fails", async () => {
    vi.mocked(requireAdmin).mockResolvedValueOnce(mockAdmin as any);

    vi.mocked(prisma.scoreAudit.count).mockResolvedValueOnce(1);

    vi.mocked(prisma.scoreAudit.findMany).mockResolvedValueOnce([
      mockAudits[0],
    ] as any);

    vi.mocked(prisma.match.findUnique).mockRejectedValueOnce(
      new Error("Match lookup failed")
    );

    const response = await GET(createRequest());

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: "Failed to load audit history",
    });
  });
});