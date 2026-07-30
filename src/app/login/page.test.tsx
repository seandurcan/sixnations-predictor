import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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

const {
  replaceMock,
} = vi.hoisted(() => ({
  replaceMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const fetchMock = vi.fn<typeof fetch>();

function createJsonResponse(
  body: unknown,
  status = 200
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

async function completeLoginForm(
  email = "sean@example.com",
  password = "Password123!"
) {
  const user = userEvent.setup();

  await user.type(
    screen.getByLabelText(/email/i),
    email
  );

  await user.type(
    screen.getByLabelText(/password/i),
    password
  );

  return user;
}

describe("LoginPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    replaceMock.mockReset();

    vi.stubGlobal("fetch", fetchMock);

    vi.spyOn(
      console,
      "error"
    ).mockImplementation(() => {
      // Suppress expected errors in failure tests.
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the login page", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", {
        name: "Login",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Email")
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Password")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Login",
      })
    ).toBeInTheDocument();
  });

  it("renders the register link", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("link", {
        name: "Register",
      })
    ).toHaveAttribute(
      "href",
      "/register"
    );
  });

  it("renders the forgot-password link", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("link", {
        name: /forgot password/i,
      })
    ).toHaveAttribute(
      "href",
      "/forgot-password"
    );
  });

  it("allows the email address to be entered", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    const emailInput =
      screen.getByLabelText("Email");

    await user.type(
      emailInput,
      "sean@example.com"
    );

    expect(emailInput).toHaveValue(
      "sean@example.com"
    );
  });

  it("allows the password to be entered", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    const passwordInput =
      screen.getByLabelText("Password");

    await user.type(
      passwordInput,
      "Password123!"
    );

    expect(passwordInput).toHaveValue(
      "Password123!"
    );
  });

  it("shows an error when email is empty", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(
      screen.getByLabelText("Password"),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText(
        "Email is required."
      )
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows an error when password is empty", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(
      screen.getByLabelText("Email"),
      "sean@example.com"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText(
        "Password is required."
      )
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the login credentials to the API", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        success: true,
      })
    );

    render(<LoginPage />);

    const user =
      await completeLoginForm();

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: "sean@example.com",
            password: "Password123!",
          }),
        }
      );
    });
  });

  it("redirects to the dashboard after successful login", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        success: true,
      })
    );

    render(<LoginPage />);

    const user =
      await completeLoginForm();

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    await waitFor(() => {
      expect(
        replaceMock
      ).toHaveBeenCalledWith(
        "/dashboard"
      );
    });

    expect(replaceMock).toHaveBeenCalledTimes(
      1
    );
  });

  it("shows an invalid-credentials error", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          success: false,
          error:
            "Invalid email or password.",
        },
        401
      )
    );

    render(<LoginPage />);

    const user =
      await completeLoginForm(
        "sean@example.com",
        "BadPassword"
      );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText(
        "Invalid email or password."
      )
    ).toBeInTheDocument();

    expect(
      replaceMock
    ).not.toHaveBeenCalled();
  });

  it("shows an email-verification error supplied by the API", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          success: false,
          error:
            "Please verify your email address before logging in.",
          emailVerificationRequired:
            true,
        },
        403
      )
    );

    render(<LoginPage />);

    const user =
      await completeLoginForm();

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText(
        "Please verify your email address before logging in."
      )
    ).toBeInTheDocument();
  });

  it("shows the fallback error when no API error is supplied", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({}, 500)
    );

    render(<LoginPage />);

    const user =
      await completeLoginForm();

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText(
        "Login failed. Please try again."
      )
    ).toBeInTheDocument();
  });

  it("shows the fallback error when the response is not valid JSON", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi
        .fn()
        .mockRejectedValue(
          new Error("Invalid JSON")
        ),
    } as unknown as Response);

    render(<LoginPage />);

    const user =
      await completeLoginForm();

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText(
        "Login failed. Please try again."
      )
    ).toBeInTheDocument();
  });

  it("shows a connection error when fetch rejects", async () => {
    fetchMock.mockRejectedValueOnce(
      new Error("Network unavailable")
    );

    render(<LoginPage />);

    const user =
      await completeLoginForm();

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText(
        "Unable to connect. Please try again."
      )
    ).toBeInTheDocument();

    expect(
      replaceMock
    ).not.toHaveBeenCalled();
  });

  it("shows the loading state while login is processing", async () => {
    let resolveRequest!: (
      response: Response
    ) => void;

    const pendingRequest =
      new Promise<Response>(
        (resolve) => {
          resolveRequest = resolve;
        }
      );

    fetchMock.mockReturnValueOnce(
      pendingRequest
    );

    render(<LoginPage />);

    const user =
      await completeLoginForm();

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    const loadingButton =
      screen.getByRole("button", {
        name: "Logging in...",
      });

    expect(
      loadingButton
    ).toBeDisabled();

    expect(
      screen.getByLabelText("Email")
    ).toBeDisabled();

    expect(
      screen.getByLabelText("Password")
    ).toBeDisabled();

    resolveRequest(
      createJsonResponse({
        success: true,
      })
    );

    await waitFor(() => {
      expect(
        replaceMock
      ).toHaveBeenCalledWith(
        "/dashboard"
      );
    });
  });

  it("prevents duplicate submission while the request is pending", async () => {
    let resolveRequest!: (
      response: Response
    ) => void;

    const pendingRequest =
      new Promise<Response>(
        (resolve) => {
          resolveRequest = resolve;
        }
      );

    fetchMock.mockReturnValueOnce(
      pendingRequest
    );

    render(<LoginPage />);

    const user =
      await completeLoginForm();

    const loginButton =
      screen.getByRole("button", {
        name: "Login",
      });

    await user.click(loginButton);

    const loadingButton =
      screen.getByRole("button", {
        name: "Logging in...",
      });

    expect(
      loadingButton
    ).toBeDisabled();

    await user.click(loadingButton);

    expect(fetchMock).toHaveBeenCalledTimes(
      1
    );

    resolveRequest(
      createJsonResponse({
        success: true,
      })
    );

    await waitFor(() => {
      expect(
        replaceMock
      ).toHaveBeenCalledWith(
        "/dashboard"
      );
    });
  });

  it("trims and lowercases the email before submission", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        success: true,
      })
    );

    render(<LoginPage />);

    const user =
      await completeLoginForm(
        "  SEAN@EXAMPLE.COM  ",
        "Password123!"
      );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          body: JSON.stringify({
            email: "sean@example.com",
            password: "Password123!",
          }),
        })
      );
    });
  });

  it("preserves the entered email after a failed login", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          success: false,
          error:
            "Invalid email or password.",
        },
        401
      )
    );

    render(<LoginPage />);

    const emailInput =
      screen.getByLabelText("Email");

    const user =
      await completeLoginForm(
        "sean@example.com",
        "wrong-password"
      );

    await user.click(
      screen.getByRole("button", {
        name: "Login",
      })
    );

    expect(
      await screen.findByText(
        "Invalid email or password."
      )
    ).toBeInTheDocument();

    expect(emailInput).toHaveValue(
      "sean@example.com"
    );
  });
});