import {
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

import RegisterPage from "./page";

type RegistrationForm = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
};

const fetchMock = vi.fn<typeof fetch>();

const VALID_FORM: RegistrationForm = {
  firstName: "Sean",
  lastName: "Durcan",
  email: "sean@example.com",
  mobile: "0871234567",
  password: "Password123!",
  confirmPassword: "Password123!",
};

const SUCCESS_MESSAGE =
  "Registration successful. Please verify your email before logging in.";

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

function setField(
  placeholder: string,
  value: string
) {
  fireEvent.change(
    screen.getByPlaceholderText(placeholder),
    {
      target: { value },
    }
  );
}

function fillForm(
  overrides: Partial<RegistrationForm> = {}
) {
  const form = {
    ...VALID_FORM,
    ...overrides,
  };

  setField("First Name", form.firstName);
  setField("Last Name", form.lastName);
  setField("Email", form.email);
  setField("Mobile", form.mobile);
  setField("Password", form.password);
  setField(
    "Confirm Password",
    form.confirmPassword
  );
}

async function submitForm() {
  const user = userEvent.setup();

  await user.click(
    screen.getByRole("button", {
      name: "Register",
    })
  );
}

function mockSuccessfulRegistration() {
  fetchMock.mockResolvedValueOnce(
    createJsonResponse({
      success: true,
    })
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the register form", () => {
    render(<RegisterPage />);

    expect(
      screen.getByRole("heading", {
        name: "Register",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(
        "First Name"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(
        "Last Name"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Email")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText("Mobile")
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(
        "Password"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(
        "Confirm Password"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Register",
      })
    ).toBeInTheDocument();
  });

  it("shows validation error when submitting an empty form", async () => {
    render(<RegisterPage />);

    await submitForm();

    expect(
      await screen.findByText(
        "First name is required."
      )
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows validation error when first name is missing", async () => {
    render(<RegisterPage />);

    fillForm({
      firstName: "",
    });

    await submitForm();

    expect(
      await screen.findByText(
        "First name is required."
      )
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows special characters in first and last names", async () => {
    mockSuccessfulRegistration();

    render(<RegisterPage />);

    fillForm({
      firstName: "Seán-John",
      lastName: "O'Connor-Smith",
    });

    await submitForm();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/register",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            ...VALID_FORM,
            firstName: "Seán-John",
            lastName: "O'Connor-Smith",
          }),
        })
      );
    });

    expect(
      await screen.findByText(
        SUCCESS_MESSAGE
      )
    ).toBeInTheDocument();
  });

  it("shows validation error when last name is missing", async () => {
    render(<RegisterPage />);

    fillForm({
      lastName: "",
    });

    await submitForm();

    expect(
      await screen.findByText(
        "Last name is required."
      )
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows validation error when email is missing", async () => {
    render(<RegisterPage />);

    fillForm({
      email: "",
    });

    await submitForm();

    expect(
      await screen.findByText(
        "Email is required."
      )
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      "does not contain an @ symbol",
      "seanexample.com",
    ],
    [
      "has no domain extension",
      "sean@example",
    ],
    [
      "contains spaces",
      "sean @example.com",
    ],
    [
      "has an invalid format",
      "not-an-email",
    ],
  ])(
    "shows validation error when email %s",
    async (_description, email) => {
      render(<RegisterPage />);

      fillForm({ email });

      await submitForm();

      expect(
        await screen.findByText(
          "Enter a valid email address."
        )
      ).toBeInTheDocument();

      expect(
        fetchMock
      ).not.toHaveBeenCalled();
    }
  );

  it("accepts email addresses with plus signs and subdomains", async () => {
    mockSuccessfulRegistration();

    render(<RegisterPage />);

    fillForm({
      email:
        "sean+test@mail.example.com",
    });

    await submitForm();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/register",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            ...VALID_FORM,
            email:
              "sean+test@mail.example.com",
          }),
        })
      );
    });

    expect(
      await screen.findByText(
        SUCCESS_MESSAGE
      )
    ).toBeInTheDocument();
  });

  it("shows validation error when mobile is missing", async () => {
    render(<RegisterPage />);

    fillForm({
      mobile: "",
    });

    await submitForm();

    expect(
      await screen.findByText(
        "Mobile number is required."
      )
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["contains letters", "abc123"],
    ["is too short", "123"],
    [
      "contains invalid symbols",
      "08712@345!",
    ],
  ])(
    "shows validation error when mobile %s",
    async (_description, mobile) => {
      render(<RegisterPage />);

      fillForm({ mobile });

      await submitForm();

      expect(
        await screen.findByText(
          "Enter a valid mobile number."
        )
      ).toBeInTheDocument();

      expect(
        fetchMock
      ).not.toHaveBeenCalled();
    }
  );

  it("accepts a valid Irish-style mobile number", async () => {
    mockSuccessfulRegistration();

    render(<RegisterPage />);

    fillForm({
      mobile: "0871234567",
    });

    await submitForm();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/register",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(
            VALID_FORM
          ),
        })
      );
    });

    expect(
      await screen.findByText(
        SUCCESS_MESSAGE
      )
    ).toBeInTheDocument();
  });

  it("accepts a valid international mobile number", async () => {
    mockSuccessfulRegistration();

    render(<RegisterPage />);

    fillForm({
      mobile: "+353 87 123 4567",
    });

    await submitForm();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/register",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            ...VALID_FORM,
            mobile: "+353 87 123 4567",
          }),
        })
      );
    });

    expect(
      await screen.findByText(
        SUCCESS_MESSAGE
      )
    ).toBeInTheDocument();
  });

  it("shows validation error when password is missing", async () => {
    render(<RegisterPage />);

    fillForm({
      password: "",
      confirmPassword: "",
    });

    await submitForm();

    expect(
      await screen.findByText(
        "Password is required."
      )
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows validation error when password is empty but confirmation is filled", async () => {
    render(<RegisterPage />);

    fillForm({
      password: "",
      confirmPassword:
        "Password123!",
    });

    await submitForm();

    expect(
      await screen.findByText(
        "Password is required."
      )
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows validation error when confirm password is empty", async () => {
    render(<RegisterPage />);

    fillForm({
      confirmPassword: "",
    });

    await submitForm();

    expect(
      await screen.findByText(
        "Please confirm your password."
      )
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      "has no special character",
      "Password123",
    ],
    [
      "has no uppercase letter",
      "password123!",
    ],
    [
      "has no lowercase letter",
      "PASSWORD123!",
    ],
    ["has no number", "Password!"],
  ])(
    "shows validation error when password %s",
    async (_description, password) => {
      render(<RegisterPage />);

      fillForm({
        password,
        confirmPassword: password,
      });

      await submitForm();

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

  it("shows a warning when passwords do not match", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    await user.type(
      screen.getByPlaceholderText(
        "Password"
      ),
      "Password123!"
    );

    await user.type(
      screen.getByPlaceholderText(
        "Confirm Password"
      ),
      "Different123!"
    );

    expect(
      await screen.findByText(
        "Passwords do not match."
      )
    ).toBeInTheDocument();
  });

  it("toggles password visibility for the password field", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

    const passwordInput =
      screen.getByPlaceholderText(
        "Password"
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

  it("toggles password visibility for the confirm-password field", async () => {
    const user = userEvent.setup();

    render(<RegisterPage />);

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

  it("submits a valid registration successfully", async () => {
    mockSuccessfulRegistration();

    render(<RegisterPage />);

    fillForm();

    await submitForm();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/register",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            VALID_FORM
          ),
        }
      );
    });

    expect(
      await screen.findByText(
        SUCCESS_MESSAGE
      )
    ).toBeInTheDocument();
  });

  it("shows an API error when registration fails", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          success: false,
          error:
            "Email already registered.",
        },
        409
      )
    );

    render(<RegisterPage />);

    fillForm();

    await submitForm();

    expect(
      await screen.findByText(
        "Email already registered."
      )
    ).toBeInTheDocument();
  });

  it("shows a connection error when the request fails", async () => {
    fetchMock.mockRejectedValueOnce(
      new Error("Network error")
    );

    render(<RegisterPage />);

    fillForm();

    await submitForm();

    expect(
      await screen.findByText(
        "Unable to connect. Please try again."
      )
    ).toBeInTheDocument();
  });
});