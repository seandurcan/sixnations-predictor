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
import ResetPasswordPage from "./page";

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

describe("ResetPasswordPage", () => {
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
    vi.useRealTimers();
  });

  it("renders the reset password form", () => {
    render(<ResetPasswordPage />);

    expect(
      screen.getByRole("heading", {
        name: "Reset Password",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("New Password")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Confirm Password")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    ).toBeInTheDocument();
  });

  it("shows validation error when reset token is missing", async () => {
    const user = userEvent.setup();

    mockToken = null;

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText("Reset token is missing.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when reset token is empty string", async () => {
    const user = userEvent.setup();

    mockToken = "";

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText("Reset token is missing.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when password is missing", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText("Password is required.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when password is too short", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Pass1!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Pass1!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      )
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when password has no uppercase letter", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "password123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      )
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when password has no lowercase letter", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "PASSWORD123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "PASSWORD123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      )
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when password has no number", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      )
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when password has no special character", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      )
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when confirm password is missing", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText("Please confirm your password.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation warning when passwords do not match", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Different123!"
    );

    expect(
      await screen.findByText("Passwords do not match.")
    ).toBeInTheDocument();
  });

  it("shows validation error on submit when passwords do not match", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Different123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText("Passwords do not match.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows password criteria and strength meter for new password", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    expect(
      screen.getAllByText("Password strength:")[0]
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("Strong")[0]
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("At least 8 characters")[0]
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("At least one uppercase letter")[0]
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("At least one lowercase letter")[0]
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("At least one number")[0]
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("At least one special character")[0]
    ).toBeInTheDocument();
  });

  it("toggles visibility for new password field", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    const passwordInput =
      screen.getByPlaceholderText("New Password");

    expect(passwordInput).toHaveAttribute(
      "type",
      "password"
    );

    const showButtons = screen.getAllByRole("button", {
      name: "Show",
    });

    await user.click(showButtons[0]);

    expect(passwordInput).toHaveAttribute(
      "type",
      "text"
    );

    await user.click(
      screen.getAllByRole("button", {
        name: "Hide",
      })[0]
    );

    expect(passwordInput).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("toggles visibility for confirm password field", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    const confirmPasswordInput =
      screen.getByPlaceholderText("Confirm Password");

    expect(confirmPasswordInput).toHaveAttribute(
      "type",
      "password"
    );

    const showButtons = screen.getAllByRole("button", {
      name: "Show",
    });

    await user.click(showButtons[1]);

    expect(confirmPasswordInput).toHaveAttribute(
      "type",
      "text"
    );

    await user.click(
      screen.getAllByRole("button", {
        name: "Hide",
      })[1]
    );

    expect(confirmPasswordInput).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("shows loading state while reset request is processing", async () => {
    const user = userEvent.setup();

    let resolveFetch!: (value: Response) => void;

    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(global.fetch).mockReturnValueOnce(fetchPromise);

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Updating...",
      })
    ).toBeDisabled();

    resolveFetch({
      json: async () => ({
        success: true,
      }),
    } as Response);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Password updated successfully. Redirecting to login..."
        )
      ).toBeInTheDocument();
    });
  });

  it("submits valid reset password request successfully", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/reset-password",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: "valid-token",
          password: "Password123!",
          confirmPassword: "Password123!",
        }),
      })
    );

    expect(
      await screen.findByText(
        "Password updated successfully. Redirecting to login..."
      )
    ).toBeInTheDocument();
  });

  it("shows API error when reset request fails", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: "Password reset failed.",
      }),
    } as Response);

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText("Password reset failed.")
    ).toBeInTheDocument();
  });

  it("shows expired token error when API reports expired reset token", async () => {
    const user = userEvent.setup();

    mockToken = "expired-token";

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: "Reset token has expired.",
      }),
    } as Response);

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/reset-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          token: "expired-token",
          password: "Password123!",
          confirmPassword: "Password123!",
        }),
      })
    );

    expect(
      await screen.findByText("Reset token has expired.")
    ).toBeInTheDocument();
  });

  it("shows invalid or expired token message when API returns combined token error", async () => {
    const user = userEvent.setup();

    mockToken = "expired-token";

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: "Invalid or expired reset token.",
      }),
    } as Response);

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/reset-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          token: "expired-token",
          password: "Password123!",
          confirmPassword: "Password123!",
        }),
      })
    );

    expect(
      await screen.findByText("Invalid or expired reset token.")
    ).toBeInTheDocument();
  });

  it("shows token expiration error when API reports token expiration explicitly", async () => {
    const user = userEvent.setup();

    mockToken = "token-expired-at-server";

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: "Token expiration time has passed.",
      }),
    } as Response);

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/reset-password",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          token: "token-expired-at-server",
          password: "Password123!",
          confirmPassword: "Password123!",
        }),
      })
    );

    expect(
      await screen.findByText("Token expiration time has passed.")
    ).toBeInTheDocument();
  });

  it("shows fallback error when API returns no error message", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: false,
      }),
    } as Response);

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText("Password reset failed.")
    ).toBeInTheDocument();
  });

  it("shows connection error when request throws", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Network error")
    );

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("New Password"),
      "Password123!"
    );

    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText(
        "Unable to connect. Please try again."
      )
    ).toBeInTheDocument();
  });
});