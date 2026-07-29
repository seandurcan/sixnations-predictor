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
import ForgotPasswordPage from "./page";

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the forgot password form", () => {
    render(<ForgotPasswordPage />);

    expect(
      screen.getByRole("heading", {
        name: "Forgot Password",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Email")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Send Reset Link",
      })
    ).toBeInTheDocument();
  });

  it("shows validation error when email field is empty", async () => {
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);

    await user.click(
      screen.getByRole("button", {
        name: "Send Reset Link",
      })
    );

    expect(
      await screen.findByText("Email is required.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when email field contains only spaces", async () => {
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "   "
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send Reset Link",
      })
    );

    expect(
      await screen.findByText("Email is required.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email format", async () => {
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "invalid-email"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send Reset Link",
      })
    );

    expect(
      await screen.findByText(
        "Enter a valid email address."
      )
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when email is missing @ symbol", async () => {
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "userexample.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send Reset Link",
      })
    );

    expect(
      await screen.findByText(
        "Enter a valid email address."
      )
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when email has no domain extension", async () => {
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "user@example"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send Reset Link",
      })
    );

    expect(
      await screen.findByText(
        "Enter a valid email address."
      )
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("accepts valid email addresses", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<ForgotPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "user+test@example.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send Reset Link",
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/forgot-password",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("shows loading state while request is processing", async () => {
    const user = userEvent.setup();

    let resolveFetch!: (value: Response) => void;

    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(global.fetch).mockReturnValueOnce(fetchPromise);

    render(<ForgotPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "user@example.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send Reset Link",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Sending...",
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
          "Password reset link sent. Please check your email."
        )
      ).toBeInTheDocument();
    });
  });

  it("shows success alert when reset link is sent", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<ForgotPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "user@example.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send Reset Link",
      })
    );

    expect(
      await screen.findByText(
        "Password reset link sent. Please check your email."
      )
    ).toBeInTheDocument();
  });

  it("shows API error when request fails", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: "User not found.",
      }),
    } as Response);

    render(<ForgotPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "user@example.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send Reset Link",
      })
    );

    expect(
      await screen.findByText("User not found.")
    ).toBeInTheDocument();
  });

  it("shows fallback error when API returns no message", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: false,
      }),
    } as Response);

    render(<ForgotPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "user@example.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send Reset Link",
      })
    );

    expect(
      await screen.findByText(
        "Unable to send password reset link."
      )
    ).toBeInTheDocument();
  });

  it("shows connection error when request throws", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Network error")
    );

    render(<ForgotPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "user@example.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send Reset Link",
      })
    );

    expect(
      await screen.findByText(
        "Unable to connect. Please try again."
      )
    ).toBeInTheDocument();
  });

  it("submits the correct payload", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<ForgotPasswordPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "user@example.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Send Reset Link",
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/forgot-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "user@example.com",
        }),
      }
    );
  });
});