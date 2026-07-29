import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import RegisterPage from "./page";

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the register form", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", {
        name: "Register",
      })
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("First Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Last Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Mobile")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm Password")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Register",
      })
    ).toBeInTheDocument();
  });

  it("shows validation error when submitting empty form", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("First name is required.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when first name is missing", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("First name is required.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("allows special characters in first and last names", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Seán-John");
    await user.type(screen.getByPlaceholderText("Last Name"), "O'Connor-Smith");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "0871234567");
    await user.type(screen.getByPlaceholderText("Password"), "Password123!");
    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          firstName: "Seán-John",
          lastName: "O'Connor-Smith",
          email: "sean@example.com",
          mobile: "0871234567",
          password: "Password123!",
          confirmPassword: "Password123!",
        }),
      })
    );

    expect(
      await screen.findByText(
        "Registration successful. Please verify your email before logging in."
      )
    ).toBeInTheDocument();
  });

  it("shows validation error when last name is missing", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Last name is required.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when email is missing", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Email is required.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when email does not contain @ symbol", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "seanexample.com");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Enter a valid email address.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when email has no domain extension", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Enter a valid email address.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when email has spaces", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean @example.com");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Enter a valid email address.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when email format is invalid", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "not-an-email");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Enter a valid email address.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("accepts email addresses with plus signs and subdomains", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(
      screen.getByPlaceholderText("Email"),
      "sean+test@mail.example.com"
    );
    await user.type(screen.getByPlaceholderText("Mobile"), "0871234567");
    await user.type(screen.getByPlaceholderText("Password"), "Password123!");
    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          firstName: "Sean",
          lastName: "Durcan",
          email: "sean+test@mail.example.com",
          mobile: "0871234567",
          password: "Password123!",
          confirmPassword: "Password123!",
        }),
      })
    );

    expect(
      await screen.findByText(
        "Registration successful. Please verify your email before logging in."
      )
    ).toBeInTheDocument();
  });

  it("shows validation error when mobile is missing", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Mobile number is required.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when mobile contains letters", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "abc123");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Enter a valid mobile number.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when mobile is too short", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "123");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Enter a valid mobile number.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when mobile contains invalid symbols", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "08712@345!");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Enter a valid mobile number.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("accepts valid Irish-style mobile format", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "0871234567");
    await user.type(screen.getByPlaceholderText("Password"), "Password123!");
    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/register",
      expect.objectContaining({
        method: "POST",
      })
    );

    expect(
      await screen.findByText(
        "Registration successful. Please verify your email before logging in."
      )
    ).toBeInTheDocument();
  });

  it("accepts valid international mobile format", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "+353 87 123 4567");
    await user.type(screen.getByPlaceholderText("Password"), "Password123!");
    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/register",
      expect.objectContaining({
        method: "POST",
      })
    );

    expect(
      await screen.findByText(
        "Registration successful. Please verify your email before logging in."
      )
    ).toBeInTheDocument();
  });

  it("shows validation error when password is missing", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "0871234567");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Password is required.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when password field is empty but confirm password is filled", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "0871234567");
    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Password is required.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when confirm password field is empty", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "0871234567");
    await user.type(screen.getByPlaceholderText("Password"), "Password123!");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Please confirm your password.")
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when password has no special character", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "0871234567");
    await user.type(screen.getByPlaceholderText("Password"), "Password123");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
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

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "0871234567");
    await user.type(screen.getByPlaceholderText("Password"), "password123!");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
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

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "0871234567");
    await user.type(screen.getByPlaceholderText("Password"), "PASSWORD123!");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
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

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "0871234567");
    await user.type(screen.getByPlaceholderText("Password"), "Password!");

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      )
    ).toBeInTheDocument();

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation warning when passwords do not match", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("Password"), "Password123!");
    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Different123!"
    );

    expect(
      await screen.findByText("Passwords do not match.")
    ).toBeInTheDocument();
  });

  it("toggles password visibility for password field", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    const passwordInput = screen.getByPlaceholderText("Password");

    expect(passwordInput).toHaveAttribute("type", "password");

    const showButtons = screen.getAllByRole("button", {
      name: "Show",
    });

    await user.click(showButtons[0]);

    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(
      screen.getAllByRole("button", {
        name: "Hide",
      })[0]
    );

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("toggles password visibility for confirm password field", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    const confirmPasswordInput =
      screen.getByPlaceholderText("Confirm Password");

    expect(confirmPasswordInput).toHaveAttribute("type", "password");

    const showButtons = screen.getAllByRole("button", {
      name: "Show",
    });

    await user.click(showButtons[1]);

    expect(confirmPasswordInput).toHaveAttribute("type", "text");

    await user.click(
      screen.getAllByRole("button", {
        name: "Hide",
      })[1]
    );

    expect(confirmPasswordInput).toHaveAttribute("type", "password");
  });

  it("submits valid registration form successfully", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "0871234567");
    await user.type(screen.getByPlaceholderText("Password"), "Password123!");
    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/register",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: "Sean",
          lastName: "Durcan",
          email: "sean@example.com",
          mobile: "0871234567",
          password: "Password123!",
          confirmPassword: "Password123!",
        }),
      })
    );

    expect(
      await screen.findByText(
        "Registration successful. Please verify your email before logging in."
      )
    ).toBeInTheDocument();
  });

  it("shows API error when registration fails", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: "Email already registered.",
      }),
    } as Response);

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "0871234567");
    await user.type(screen.getByPlaceholderText("Password"), "Password123!");
    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Email already registered.")
    ).toBeInTheDocument();
  });

  it("shows connection error when request fails", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Network error")
    );

    render(<RegisterPage />);

    await user.type(screen.getByPlaceholderText("First Name"), "Sean");
    await user.type(screen.getByPlaceholderText("Last Name"), "Durcan");
    await user.type(screen.getByPlaceholderText("Email"), "sean@example.com");
    await user.type(screen.getByPlaceholderText("Mobile"), "0871234567");
    await user.type(screen.getByPlaceholderText("Password"), "Password123!");
    await user.type(
      screen.getByPlaceholderText("Confirm Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Register",
      })
    );

    expect(
      await screen.findByText("Unable to connect. Please try again.")
    ).toBeInTheDocument();
  });
});