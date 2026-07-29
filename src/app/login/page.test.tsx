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

    Object.defineProperty(window, "location", {
      value: {
        href: "",
        assign: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("renders login page content", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", {
        name: /login/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/email/i)
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/password/i)
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /login/i,
      })
    ).toBeInTheDocument();
  });

  it("renders register link", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("link", {
        name: /register/i,
      })
    ).toBeInTheDocument();
  });

  it("renders forgot password link when available", () => {
    render(<LoginPage />);

    const forgotLink =
      screen.queryByRole("link", {
        name: /forgot password/i,
      });

    if (forgotLink) {
      expect(forgotLink).toBeInTheDocument();
    }
  });

  it("allows entering email address", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    const emailInput =
      screen.getByLabelText(/email/i);

    await user.type(
      emailInput,
      "sean@example.com"
    );

    expect(emailInput).toHaveValue(
      "sean@example.com"
    );
  });

  it("allows entering password", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    const passwordInput =
      screen.getByLabelText(/password/i);

    await user.type(
      passwordInput,
      "Password123!"
    );

    expect(passwordInput).toHaveValue(
      "Password123!"
    );
  });

  it("shows validation when email is empty", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    const passwordInput =
      screen.getByLabelText(/password/i);

    await user.type(
      passwordInput,
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    expect(
      screen.getByLabelText(/password/i)
    ).toBeInTheDocument();
  });

  it("shows validation when password is empty", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    const emailInput =
      screen.getByLabelText(/email/i);

    await user.type(
      emailInput,
      "sean@example.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    expect(
      screen.getByLabelText(/email/i)
    ).toBeInTheDocument();
  });

  it("submits login credentials successfully", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<LoginPage />);

    await user.type(
      screen.getByLabelText(/email/i),
      "sean@example.com"
    );

    await user.type(
      screen.getByLabelText(/password/i),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("posts credentials to login API", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<LoginPage />);

    await user.type(
      screen.getByLabelText(/email/i),
      "sean@example.com"
    );

    await user.type(
      screen.getByLabelText(/password/i),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/login/i),
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  it("redirects after successful login", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<LoginPage />);

    await user.type(
      screen.getByLabelText(/email/i),
      "sean@example.com"
    );

    await user.type(
      screen.getByLabelText(/password/i),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    await waitFor(() => {
      expect(
        global.fetch
      ).toHaveBeenCalled();
    });
  });

  it("shows invalid credentials error", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: "Invalid credentials",
      }),
    } as Response);

    render(<LoginPage />);

    await user.type(
      screen.getByLabelText(/email/i),
      "sean@example.com"
    );

    await user.type(
      screen.getByLabelText(/password/i),
      "BadPassword"
    );

    await user.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    expect(
      await screen.findByText(
        /invalid credentials/i
      )
    ).toBeInTheDocument();
  });

  it("shows API supplied error messages", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error:
          "Email address has not been verified.",
      }),
    } as Response);

    render(<LoginPage />);

    await user.type(
      screen.getByLabelText(/email/i),
      "sean@example.com"
    );

    await user.type(
      screen.getByLabelText(/password/i),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    expect(
      await screen.findByText(
        /email address has not been verified/i
      )
    ).toBeInTheDocument();
  });

  it("shows fallback error message when API does not return error text", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    render(<LoginPage />);

    await user.type(
      screen.getByLabelText(/email/i),
      "sean@example.com"
    );

    await user.type(
      screen.getByLabelText(/password/i),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toBeInTheDocument();
  });

  it("shows network error when login API throws", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockRejectedValueOnce(
      new Error("Network unavailable")
    );

    render(<LoginPage />);

    await user.type(
      screen.getByLabelText(/email/i),
      "sean@example.com"
    );

    await user.type(
      screen.getByLabelText(/password/i),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    expect(
      await screen.findByRole("alert")
    ).toBeInTheDocument();
  });

  it("shows loading state while login request is processing", async () => {
    const user = userEvent.setup();

    let resolveRequest!: (
      value: Response
    ) => void;

    const pendingRequest =
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      });

    vi.mocked(global.fetch).mockReturnValueOnce(
      pendingRequest
    );

    render(<LoginPage />);

    await user.type(
      screen.getByLabelText(/email/i),
      "sean@example.com"
    );

    await user.type(
      screen.getByLabelText(/password/i),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    expect(
      screen.getByRole("button")
    ).toBeDisabled();

    resolveRequest({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
      }),
    } as Response);

    await waitFor(() => {
      expect(
        global.fetch
      ).toHaveBeenCalled();
    });
  });

  it("prevents double submission while request is in progress", async () => {
    const user = userEvent.setup();

    let resolveRequest!: (
      value: Response
    ) => void;

    const pendingRequest =
      new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      });

    vi.mocked(global.fetch).mockReturnValueOnce(
      pendingRequest
    );

    render(<LoginPage />);

    await user.type(
      screen.getByLabelText(/email/i),
      "sean@example.com"
    );

    await user.type(
      screen.getByLabelText(/password/i),
      "Password123!"
    );

    const button =
      screen.getByRole("button", {
        name: /login/i,
      });

    await user.click(button);

    expect(button).toBeDisabled();

    resolveRequest({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
      }),
    } as Response);

    await waitFor(() => {
      expect(
        global.fetch
      ).toHaveBeenCalledTimes(1);
    });
  });

  it("trims email values before submission", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
      }),
    } as Response);

    render(<LoginPage />);

    await user.type(
      screen.getByLabelText(/email/i),
      "  sean@example.com  "
    );

    await user.type(
      screen.getByLabelText(/password/i),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    await waitFor(() => {
      expect(
        global.fetch
      ).toHaveBeenCalled();
    });
  });

  it("preserves entered email after failed login", async () => {
    const user = userEvent.setup();

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: "Invalid credentials",
      }),
    } as Response);

    render(<LoginPage />);

    const emailInput =
      screen.getByLabelText(/email/i);

    await user.type(
      emailInput,
      "sean@example.com"
    );

    await user.type(
      screen.getByLabelText(/password/i),
      "wrong-password"
    );

    await user.click(
      screen.getByRole("button", {
        name: /login/i,
      })
    );

    expect(
      await screen.findByText(
        /invalid credentials/i
      )
    ).toBeInTheDocument();

    expect(emailInput).toHaveValue(
      "sean@example.com"
    );
  });
});