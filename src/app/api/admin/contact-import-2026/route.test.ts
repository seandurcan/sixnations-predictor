import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("unusable-hash") },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      aggregate: vi.fn(),
      createMany: vi.fn(),
    },
    systemSetting: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $executeRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";

const TOKEN = "temporary-import-token";

function request(confirm = false, contacts = [
  { firstName: "Test", lastName: "Person", email: "TEST@example.com", mobile: "087 123 4567" },
]) {
  return new Request("http://localhost/api/admin/contact-import-2026", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ confirm, contacts }),
  });
}

describe("historical contact import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CONTACT_IMPORT_TOKEN_HASH = crypto
      .createHash("sha256")
      .update(TOKEN)
      .digest("hex");
    vi.mocked(prisma.user.findMany).mockResolvedValue([]);
    vi.mocked(prisma.user.aggregate).mockResolvedValue({
      _max: { registrationOrder: 10 },
    } as never);
    vi.mocked(prisma.user.createMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.systemSetting.create).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockImplementation(
      (async (callback: (tx: typeof prisma) => unknown) => callback(prisma)) as never
    );
  });

  it("rejects an incorrect token", async () => {
    const response = await POST(new Request("http://localhost", { method: "POST" }));
    expect(response.status).toBe(401);
  });

  it("normalizes contacts and performs a non-mutating dry run", async () => {
    const response = await POST(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      dryRun: true,
      supplied: 1,
      existing: 0,
      wouldCreate: 1,
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { email: { in: ["test@example.com"], mode: "insensitive" } },
            { mobile: { in: ["0871234567"] } },
          ]),
        }),
      })
    );
    expect(prisma.user.createMany).not.toHaveBeenCalled();
  });

  it("creates only new verified accounts without entries or emails", async () => {
    const response = await POST(request(true));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      success: true,
      dryRun: false,
      supplied: 1,
      existing: 0,
      created: 1,
    });
    expect(prisma.user.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          firstName: "Test",
          lastName: "Person",
          email: "test@example.com",
          mobile: "0871234567",
          emailVerified: true,
          passwordHash: "unusable-hash",
          registrationOrder: 11,
        }),
      ],
      skipDuplicates: true,
    });
    expect(prisma.systemSetting.create).toHaveBeenCalledTimes(1);
  });
});
