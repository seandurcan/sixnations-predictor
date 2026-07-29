import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import VerifyEmailPage from "./page";

let mockToken: string | null = "valid-token";

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "token") {
        return mockToken;
      }

      return null;
    },
  }),
}));

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    mockToken = "valid-token";

    global.fetch = vi.fn();

    Object.defineProperty(window, "location", {
      value: {
        href: "",
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the email verification page", () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<VerifyEmailPage />);

    expect(
      screen.getByRole("heading", {
        name: "Email Verification",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Verifying...")
    ).toBeInTheDocument();
  });

  it("shows loading state while verification is pending", async () => {
    let resolveFetch!: (value: Response) => void;

    const fetchPromise =
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });

    vi.mocked(global.fetch).mockReturnValueOnce(
      fetchPromise
    );

    render(<VerifyEmailPage />);

    expect(
      screen.getByText("Verifying...")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Verifying Email")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Please wait while we verify your email."
      )
    ).toBeInTheDocument();

    resolveFetch({
      json: async () => ({
        success: true,
      }),
    } as Response);

    expect(
      await screen.findByText(
        "Email successfully verified. You may now log in."
      )
    ).toBeInTheDocument();
  });

  it("shows success message when email verification succeeds", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<VerifyEmailPage />);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/verify-email",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: "valid-token",
        }),
      })
    );

    expect(
      await screen.findByText(
        "Email successfully verified. You may now log in."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Verification Successful")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Go To Login",
      })
    ).toBeInTheDocument();
  });

  it("navigates to login after successful verification when login button is clicked", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<VerifyEmailPage />);

    await screen.findByText(
      "Email successfully verified. You may now log in."
    );

    await user.click(
      screen.getByRole("button", {
        name: "Go To Login",
      })
    );

    expect(window.location.href).toBe("/login");
  });

  it("shows error message when token is missing", async () => {
    mockToken = null;

    render(<VerifyEmailPage />);

    expect(
      await screen.findByText(
        "Missing verification token."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Verification Failed")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();

    expect(
      screen.queryByRole("button", {
        name: "Try Again",
      })
    ).not.toBeInTheDocument();
  });

  it("shows error message when token is empty string", async () => {
    mockToken = "";

    render(<VerifyEmailPage />);

    expect(
      await screen.findByText(
        "Missing verification token."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Verification Failed")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();

    expect(
      screen.queryByRole("button", {
        name: "Try Again",
      })
    ).not.toBeInTheDocument();
  });

  it("shows API error when verification fails", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: "Invalid verification token.",
      }),
    } as Response);

    render(<VerifyEmailPage />);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/verify-email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          token: "valid-token",
        }),
      })
    );

    expect(
      await screen.findByText(
        "Invalid verification token."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Verification Failed")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Try Again",
      })
    ).toBeInTheDocument();
  });

  it("shows expired token error when API reports expired verification token", async () => {
    mockToken = "expired-token";

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: "Verification token has expired.",
      }),
    } as Response);

    render(<VerifyEmailPage />);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/verify-email",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          token: "expired-token",
        }),
      })
    );

    expect(
      await screen.findByText(
        "Verification token has expired."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Verification Failed")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Try Again",
      })
    ).toBeInTheDocument();
  });

  it("shows fallback error when API returns failure without error message", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: false,
      }),
    } as Response);

    render(<VerifyEmailPage />);

    expect(
      await screen.findByText(
        "Email verification failed."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Verification Failed")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Try Again",
      })
    ).toBeInTheDocument();
  });

  it("submits the correct verification token payload", async () => {
    mockToken = "abc-123-token";

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/verify-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: "abc-123-token",
          }),
        }
      );
    });
  });

  it("handles network failure during verification", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Network error")
    );

    render(<VerifyEmailPage />);

    expect(
      await screen.findByText(
        "Email verification failed."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Verification Failed")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Try Again",
      })
    ).toBeInTheDocument();
  });

  it("retries verification when Try Again is clicked after API failure", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        json: async () => ({
          success: false,
          error: "Invalid verification token.",
        }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
        }),
      } as Response);

    render(<VerifyEmailPage />);

    expect(
      await screen.findByText(
        "Invalid verification token."
      )
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Try Again",
      })
    );

    expect(global.fetch).toHaveBeenCalledTimes(2);

    expect(
      await screen.findByText(
        "Email successfully verified. You may now log in."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Verification Successful")
    ).toBeInTheDocument();
  });

  it("retries verification when Try Again is clicked after network failure", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch)
      .mockRejectedValueOnce(
        new Error("Network error")
      )
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
        }),
      } as Response);

    render(<VerifyEmailPage />);

    expect(
      await screen.findByText(
        "Email verification failed."
      )
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Try Again",
      })
    );

    expect(global.fetch).toHaveBeenCalledTimes(2);

    expect(
      await screen.findByText(
        "Email successfully verified. You may now log in."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Verification Successful")
    ).toBeInTheDocument();
  });
}
);