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
import LoginPage from "./page";

describe("LoginPage", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();

    global.fetch = vi.fn();

    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

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

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("renders the login form", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", {
        name: "Login",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Email")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Password")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Login",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Forgot Password?",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Create Account",
      })
    ).toBeInTheDocument();
  });

  it("shows validation error when email is missing", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText("Email is required.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when email format is invalid", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "invalid-email"
    );

    await user.type(
      screen.getByPlaceholderText("Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText("Enter a valid email address.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when password is missing", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText("Password is required.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    const passwordInput =
      screen.getByPlaceholderText("Password");

    expect(passwordInput).toHaveAttribute(
      "type",
      "password"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Show",
      })
    );

    expect(passwordInput).toHaveAttribute(
      "type",
      "text"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Hide",
      })
    );

    expect(passwordInput).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("shows API error when login fails", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: false,
        error: "Invalid email or password.",
      }),
    } as Response);

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/login",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "test@example.com",
          password: "Password123!",
        }),
      })
    );

    expect(
      await screen.findByText("Invalid email or password.")
    ).toBeInTheDocument();
  });

  it("shows fallback error when login fails without API error message", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: false,
      }),
    } as Response);

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText("Login failed.")
    ).toBeInTheDocument();
  });

  it("shows connection error when request fails", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Network error")
    );

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText("Unable to connect. Please try again.")
    ).toBeInTheDocument();
  });

  it("shows loading state while logging in", async () => {
    const user = userEvent.setup();

    let resolveFetch: (value: Response) => void;

    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(global.fetch).mockReturnValueOnce(fetchPromise);

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Signing In...",
      })
    ).toBeDisabled();

    resolveFetch!(
      {
        json: async () => ({
          success: true,
          userId: "123",
        }),
      } as Response
    );

    await waitFor(() => {
      expect(
        screen.getByText("Login successful. Redirecting...")
      ).toBeInTheDocument();
    });
  });

  it("stores user id and shows success message when login succeeds", async () => {
    const user = userEvent.setup();

    vi.useFakeTimers();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        userId: "123",
      }),
    } as Response);

    render(<LoginPage />);

    await user.type(
      screen.getByPlaceholderText("Email"),
      "test@example.com"
    );

    await user.type(
      screen.getByPlaceholderText("Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText("Login successful. Redirecting...")
    ).toBeInTheDocument();

    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "userId",
      "123"
    );
  });

  it("navigates to forgot password page", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.click(
      screen.getByRole("button", {
        name: "Forgot Password?",
      })
    );

    expect(window.location.href).toBe("/forgot-password");
  });

  it("navigates to register page", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.click(
      screen.getByRole("button", {
        name: "Create Account",
      })
    );

    expect(window.location.href).toBe("/register");
  });
});