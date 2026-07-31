import {
  act,
  fireEvent,
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

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
}));

const fetchMock = vi.fn<typeof fetch>();

type LoginResponse = {
  success?: boolean;
  error?: string;
  emailVerificationRequired?: boolean;
};

type DeferredResponse = {
  promise: Promise<Response>;
  resolve: (response: Response) => void;
};

function createJsonResponse(
  body: LoginResponse,
  status = 200
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function createInvalidJsonResponse(
  status = 500
): Response {
  return {
    ok: false,
    status,
    json: vi
      .fn()
      .mockRejectedValue(
        new Error("Invalid JSON")
      ),
  } as unknown as Response;
}

function createDeferredResponse(): DeferredResponse {
  let resolve!: (
    response: Response
  ) => void;

  const promise = new Promise<Response>(
    (resolvePromise) => {
      resolve = resolvePromise;
    }
  );

  return {
    promise,
    resolve,
  };
}

function getEmailInput() {
  return screen.getByLabelText("Email");
}

function getPasswordInput() {
  return screen.getByPlaceholderText(
    "Password"
  );
}

function getLoginButton() {
  return screen.getByRole("button", {
    name: "Login",
  });
}

function fillLoginForm(
  email = "sean@example.com",
  password = "Password123!"
) {
  fireEvent.change(getEmailInput(), {
    target: { value: email },
  });

  fireEvent.change(getPasswordInput(), {
    target: { value: password },
  });
}

async function submitLogin() {
  const user = userEvent.setup();

  await user.click(getLoginButton());
}

describe("LoginPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();

    Object.values(
      navigationMocks
    ).forEach((mock) => {
      mock.mockReset();
    });

    vi.stubGlobal("fetch", fetchMock);

    vi.spyOn(
      console,
      "error"
    ).mockImplementation(() => {
      // Expected in network-failure tests.
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the login page", () => {
    render(<LoginPage />);

    expect(
      screen.getByRole("heading", {
        name: "Login",
      })
    ).toBeInTheDocument();

    expect(
      getEmailInput()
    ).toBeInTheDocument();

    expect(
      getPasswordInput()
    ).toBeInTheDocument();

    expect(
      getLoginButton()
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

  it("allows an email address to be entered", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    const emailInput = getEmailInput();

    await user.type(
      emailInput,
      "sean@example.com"
    );

    expect(emailInput).toHaveValue(
      "sean@example.com"
    );
  });

  it("allows a password to be entered", async () => {
    const user = userEvent.setup();

    render(<LoginPage />);

    const passwordInput =
      getPasswordInput();

    await user.type(
      passwordInput,
      "Password123!"
    );

    expect(passwordInput).toHaveValue(
      "Password123!"
    );
  });

  it("shows an error when email is empty", async () => {
    render(<LoginPage />);

    fireEvent.change(
      getPasswordInput(),
      {
        target: {
          value: "Password123!",
        },
      }
    );

    await submitLogin();

    expect(
      await screen.findByText(
        "Email is required."
      )
    ).toBeInTheDocument();

    expect(
      fetchMock
    ).not.toHaveBeenCalled();
  });

  it("shows an error when password is empty", async () => {
    render(<LoginPage />);

    fireEvent.change(getEmailInput(), {
      target: {
        value: "sean@example.com",
      },
    });

    await submitLogin();

    expect(
      await screen.findByText(
        "Password is required."
      )
    ).toBeInTheDocument();

    expect(
      fetchMock
    ).not.toHaveBeenCalled();
  });

  it("posts the login credentials to the API", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        success: true,
      })
    );

    render(<LoginPage />);

    fillLoginForm();
    await submitLogin();

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

    fillLoginForm();
    await submitLogin();

    await waitFor(() => {
      expect(
        navigationMocks.replace
      ).toHaveBeenCalledWith(
        "/dashboard"
      );
    });

    expect(
      navigationMocks.replace
    ).toHaveBeenCalledTimes(1);
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

    fillLoginForm(
      "sean@example.com",
      "BadPassword"
    );

    await submitLogin();

    expect(
      await screen.findByText(
        "Invalid email or password."
      )
    ).toBeInTheDocument();

    expect(
      navigationMocks.replace
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

    fillLoginForm();
    await submitLogin();

    expect(
      await screen.findByText(
        "Please verify your email address before logging in."
      )
    ).toBeInTheDocument();

    expect(
      navigationMocks.replace
    ).not.toHaveBeenCalled();
  });

  it("shows the fallback error when the API supplies no error text", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({}, 500)
    );

    render(<LoginPage />);

    fillLoginForm();
    await submitLogin();

    expect(
      await screen.findByText(
        "Login failed. Please try again."
      )
    ).toBeInTheDocument();

    expect(
      navigationMocks.replace
    ).not.toHaveBeenCalled();
  });

  it("shows the fallback error when the response is not valid JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      createInvalidJsonResponse()
    );

    render(<LoginPage />);

    fillLoginForm();
    await submitLogin();

    expect(
      await screen.findByText(
        "Login failed. Please try again."
      )
    ).toBeInTheDocument();

    expect(
      navigationMocks.replace
    ).not.toHaveBeenCalled();
  });

  it("shows a connection error when fetch rejects", async () => {
    fetchMock.mockRejectedValueOnce(
      new Error("Network unavailable")
    );

    render(<LoginPage />);

    fillLoginForm();
    await submitLogin();

    expect(
      await screen.findByText(
        "Unable to connect. Please try again."
      )
    ).toBeInTheDocument();

    expect(
      navigationMocks.replace
    ).not.toHaveBeenCalled();
  });

  it("shows the loading state while login is processing", async () => {
    const deferred =
      createDeferredResponse();

    fetchMock.mockReturnValueOnce(
      deferred.promise
    );

    render(<LoginPage />);

    fillLoginForm();
    await submitLogin();

    expect(
      screen.getByRole("button", {
        name: "Logging in...",
      })
    ).toBeDisabled();

    expect(
      getEmailInput()
    ).toBeDisabled();

    expect(
      getPasswordInput()
    ).toBeDisabled();

    await act(async () => {
      deferred.resolve(
        createJsonResponse({
          success: true,
        })
      );

      await deferred.promise;
    });

    await waitFor(() => {
      expect(
        navigationMocks.replace
      ).toHaveBeenCalledWith(
        "/dashboard"
      );
    });
  });

  it("prevents duplicate submission while the request is pending", async () => {
    const deferred =
      createDeferredResponse();

    fetchMock.mockReturnValueOnce(
      deferred.promise
    );

    render(<LoginPage />);

    fillLoginForm();
    await submitLogin();

    const loadingButton =
      screen.getByRole("button", {
        name: "Logging in...",
      });

    expect(
      loadingButton
    ).toBeDisabled();

    fireEvent.click(loadingButton);

    expect(
      fetchMock
    ).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve(
        createJsonResponse({
          success: true,
        })
      );

      await deferred.promise;
    });

    await waitFor(() => {
      expect(
        navigationMocks.replace
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

    fillLoginForm(
      "  SEAN@EXAMPLE.COM  ",
      "Password123!"
    );

    await submitLogin();

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

    const emailInput = getEmailInput();

    fillLoginForm(
      "sean@example.com",
      "wrong-password"
    );

    await submitLogin();

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