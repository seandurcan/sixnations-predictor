import bcrypt from "bcryptjs";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { POST } from "./route";

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  SESSION_COOKIE: "session-token",
  createSession: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import {
  createSession,
  SESSION_COOKIE,
} from "@/lib/auth";

const mockUser = {
  id: 1,
  firstName: "Sean",
  lastName: "Durcan",
  email: "sean@example.com",
  passwordHash: "hashed-password",
  emailVerified: true,
  role: "USER",
};

function createLoginRequest(body: any) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs in verified user with valid credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
      mockUser as any
    );

    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

    vi.mocked(createSession).mockResolvedValueOnce({
      token: "session-token-value",
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    } as any);

    const response = await POST(
      createLoginRequest({
        email: "sean@example.com",
        password: "Password123!",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(200);

    expect(body).toEqual({
      success: true,
      firstName: "Sean",
      email: "sean@example.com",
      role: "USER",
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: "sean@example.com",
      },
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "Password123!",
      "hashed-password"
    );

    expect(createSession).toHaveBeenCalledWith(1);

    expect(
      response.headers.get("set-cookie")
    ).toContain(SESSION_COOKIE);
  });

  it("returns 401 when user does not exist", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const response = await POST(
      createLoginRequest({
        email: "missing@example.com",
        password: "Password123!",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(401);

    expect(body).toEqual({
      success: false,
      error: "Invalid email or password",
    });

    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("returns 401 when password is invalid", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
      mockUser as any
    );

    vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

    const response = await POST(
      createLoginRequest({
        email: "sean@example.com",
        password: "WrongPassword",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(401);

    expect(body).toEqual({
      success: false,
      error: "Invalid email or password",
    });

    expect(createSession).not.toHaveBeenCalled();
  });

  it("returns 403 when email is not verified", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      ...mockUser,
      emailVerified: false,
    } as any);

    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

    const response = await POST(
      createLoginRequest({
        email: "sean@example.com",
        password: "Password123!",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(403);

    expect(body).toEqual({
      success: false,
      error: "Please verify your email address before logging in.",
      emailVerificationRequired: true,
    });

    expect(createSession).not.toHaveBeenCalled();
  });

  it("returns 500 when request JSON parsing fails", async () => {
    const request = new Request(
      "http://localhost/api/auth/login",
      {
        method: "POST",
        body: "{bad-json",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const response = await POST(request);

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: "Login failed",
    });
  });

  it("returns 500 when database lookup throws", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValueOnce(
      new Error("Database unavailable")
    );

    const response = await POST(
      createLoginRequest({
        email: "sean@example.com",
        password: "Password123!",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: "Login failed",
    });
  });

  it("returns 500 when createSession throws", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(
      mockUser as any
    );

    vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

    vi.mocked(createSession).mockRejectedValueOnce(
      new Error("Session creation failed")
    );

    const response = await POST(
      createLoginRequest({
        email: "sean@example.com",
        password: "Password123!",
      })
    );

    const body = await response.json();

    expect(response.status).toBe(500);

    expect(body).toEqual({
      success: false,
      error: "Login failed",
    });
  });
});