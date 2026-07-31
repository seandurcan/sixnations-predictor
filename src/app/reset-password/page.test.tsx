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

import ResetPasswordPage from "./page";

const navigationMocks = vi.hoisted(() => ({
  token: "valid-token" as string | null,
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) =>
      key === "token"
        ? navigationMocks.token
        : null,
  }),
  useRouter: () => ({
    push: navigationMocks.push,
    replace: navigationMocks.replace,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const fetchMock = vi.fn<typeof fetch>();

const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";

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

async function enterPasswords(
  password = "Password123!",
  confirmPassword = password
) {
  const user = userEvent.setup();

  await user.type(
    screen.getByPlaceholderText(
      "New Password"
    ),
    password
  );

  await user.type(
    screen.getByPlaceholderText(
      "Confirm Password"
    ),
    confirmPassword
  );

  return user;
}

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    navigationMocks.token =
      "valid-token";

    navigationMocks.push.mockReset();
    navigationMocks.replace.mockReset();

    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
      screen.getByPlaceholderText(
        "New Password"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(
        "Confirm Password"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    ).toBeInTheDocument();
  });

  it("shows an error when the reset token is missing", () => {
    navigationMocks.token = null;

    render(<ResetPasswordPage />);

    expect(
      screen.getByText(
        "Invalid or missing reset token. Please check the link from your email."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(
        "New Password"
      )
    ).toBeDisabled();

    expect(
      screen.getByPlaceholderText(
        "Confirm Password"
      )
    ).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    ).toBeDisabled();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows an error when the reset token is an empty string", () => {
    navigationMocks.token = "";

    render(<ResetPasswordPage />);

    expect(
      screen.getByText(
        "Invalid or missing reset token. Please check the link from your email."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    ).toBeDisabled();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a validation error when the password is missing", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText(
        "Confirm Password"
      ),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText(
        "Password is required."
      )
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["too short", "Pass1!"],
    [
      "without an uppercase letter",
      "password123!",
    ],
    [
      "without a lowercase letter",
      "PASSWORD123!",
    ],
    ["without a number", "Password!"],
    [
      "without a special character",
      "Password123",
    ],
  ])(
    "rejects a password %s",
    async (_description, invalidPassword) => {
      render(<ResetPasswordPage />);

      const user = await enterPasswords(
        invalidPassword
      );

      await user.click(
        screen.getByRole("button", {
          name: "Reset Password",
        })
      );

      expect(
        await screen.findByText(
          PASSWORD_REQUIREMENTS_MESSAGE
        )
      ).toBeInTheDocument();

      expect(
        fetchMock
      ).not.toHaveBeenCalled();
    }
  );

  it("shows a validation error when confirm password is missing", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText(
        "New Password"
      ),
      "Password123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText(
        "Please confirm your password."
      )
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a warning while the passwords do not match", async () => {
    render(<ResetPasswordPage />);

    await enterPasswords(
      "Password123!",
      "Different123!"
    );

    expect(
      await screen.findByText(
        "Passwords do not match."
      )
    ).toBeInTheDocument();
  });

  it("shows a validation error on submit when passwords do not match", async () => {
    render(<ResetPasswordPage />);

    const user = await enterPasswords(
      "Password123!",
      "Different123!"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findAllByText(
        "Passwords do not match."
      )
    ).toHaveLength(2);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the password criteria and strength meter", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await user.type(
      screen.getByPlaceholderText(
        "New Password"
      ),
      "Password123!"
    );

    expect(
      screen.getByText(
        /Password strength:/
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Strong")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /At least 8 characters/
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /At least one uppercase letter/
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /At least one lowercase letter/
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /At least one number/
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /At least one special character/
      )
    ).toBeInTheDocument();
  });

  it("toggles visibility for the new-password field", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    const passwordInput =
      screen.getByPlaceholderText(
        "New Password"
      );

    expect(passwordInput).toHaveAttribute(
      "type",
      "password"
    );

    await user.click(
      screen.getAllByRole("button", {
        name: "Show",
      })[0]
    );

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

  it("toggles visibility for the confirm-password field", async () => {
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    const confirmPasswordInput =
      screen.getByPlaceholderText(
        "Confirm Password"
      );

    expect(
      confirmPasswordInput
    ).toHaveAttribute("type", "password");

    await user.click(
      screen.getAllByRole("button", {
        name: "Show",
      })[1]
    );

    expect(
      confirmPasswordInput
    ).toHaveAttribute("type", "text");

    await user.click(
      screen.getAllByRole("button", {
        name: "Hide",
      })[1]
    );

    expect(
      confirmPasswordInput
    ).toHaveAttribute("type", "password");
  });

  it("shows a loading state while the reset request is processing", async () => {
    let resolveFetch!: (
      value: Response
    ) => void;

    const fetchPromise =
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });

    fetchMock.mockReturnValueOnce(
      fetchPromise
    );

    render(<ResetPasswordPage />);

    const user = await enterPasswords();

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

    resolveFetch(
      createJsonResponse({
        success: true,
      })
    );

    expect(
      await screen.findByText(
        "Password updated successfully. Redirecting to login..."
      )
    ).toBeInTheDocument();
  });

  it("submits a valid reset-password request successfully", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        success: true,
      })
    );

    render(<ResetPasswordPage />);

    const user = await enterPasswords();

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/reset-password",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            token: "valid-token",
            password: "Password123!",
            confirmPassword:
              "Password123!",
          }),
        })
      );
    });

    expect(
      await screen.findByText(
        "Password updated successfully. Redirecting to login..."
      )
    ).toBeInTheDocument();
  });

  it("shows the API error when the reset request fails", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          success: false,
          error:
            "Password reset failed.",
        },
        400
      )
    );

    render(<ResetPasswordPage />);

    const user = await enterPasswords();

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText(
        "Password reset failed."
      )
    ).toBeInTheDocument();
  });

  it.each([
    [
      "expired-token",
      "Reset token has expired.",
    ],
    [
      "expired-token",
      "Invalid or expired reset token.",
    ],
    [
      "token-expired-at-server",
      "Token expiration time has passed.",
    ],
  ])(
    "shows the token error returned by the API",
    async (token, message) => {
      navigationMocks.token = token;

      fetchMock.mockResolvedValueOnce(
        createJsonResponse(
          {
            success: false,
            error: message,
          },
          400
        )
      );

      render(<ResetPasswordPage />);

      const user =
        await enterPasswords();

      await user.click(
        screen.getByRole("button", {
          name: "Reset Password",
        })
      );

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/reset-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            token,
            password: "Password123!",
            confirmPassword:
              "Password123!",
          }),
        })
      );

      expect(
        await screen.findByText(message)
      ).toBeInTheDocument();
    }
  );

  it("shows a fallback error when the API returns no error message", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          success: false,
        },
        500
      )
    );

    render(<ResetPasswordPage />);

    const user = await enterPasswords();

    await user.click(
      screen.getByRole("button", {
        name: "Reset Password",
      })
    );

    expect(
      await screen.findByText(
        "Password reset failed."
      )
    ).toBeInTheDocument();
  });

  it("shows a connection error when the request throws", async () => {
    fetchMock.mockRejectedValueOnce(
      new Error("Network error")
    );

    render(<ResetPasswordPage />);

    const user = await enterPasswords();

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