import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AccountPage from "./page";

const account = {
  id: 7,
  firstName: "Old",
  lastName: "Name",
  email: "old@example.com",
  mobile: "0870000000",
  emailVerified: true,
};

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

describe("My Account page", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValueOnce(response({ success: true, user: account }));
    Object.defineProperty(window, "location", { value: { href: "" }, writable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "location", { value: originalLocation, writable: true });
  });

  it("loads editable details and saves a name correction", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce(response({
      success: true,
      message: "Your account details were saved.",
      user: { ...account, firstName: "New" },
    }));
    render(<AccountPage />);

    const firstName = await screen.findByLabelText("First name");
    await user.clear(firstName);
    await user.type(firstName, "New");
    await user.click(screen.getByRole("button", { name: "Save Account Details" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expect(vi.mocked(global.fetch).mock.calls[1][1]).toMatchObject({ method: "PATCH" });
    expect(await screen.findByText("Your account details were saved.")).toBeInTheDocument();
  });

  it("requires the current password field only when the email changes", async () => {
    const user = userEvent.setup();
    render(<AccountPage />);
    const email = await screen.findByLabelText("Email address");
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
    await user.clear(email);
    await user.type(email, "new@example.com");
    expect(screen.getByLabelText("Current password")).toBeRequired();
  });
});
