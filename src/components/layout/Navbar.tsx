"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type User = {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

type AuthResponse = {
  authenticated?: boolean;
  user?: User;
};

const publicLinks: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: "🏠",
  },
  {
    label: "Leaderboard",
    href: "/leaderboard",
    icon: "🏆",
  },
];

const authenticatedLinks: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "📊",
  },
  {
    label: "Predictions",
    href: "/predictions",
    icon: "📝",
  },
];

const adminLinks: NavItem[] = [
  {
    label: "Admin Results",
    href: "/admin",
    icon: "🛠️",
  },
  {
    label: "Admin Dashboard",
    href: "/admin/dashboard",
    icon: "📈",
  },
  {
    label: "Audit",
    href: "/admin/audit",
    icon: "📋",
  },
];

const guestLinks: NavItem[] = [
  {
    label: "Login",
    href: "/login",
    icon: "🔐",
  },
  {
    label: "Register",
    href: "/register",
    icon: "✅",
  },
];

export default function NavBar() {
  const pathname = usePathname();

  const desktopProfileMenuRef =
    useRef<HTMLDivElement | null>(null);

  const mobileProfileMenuRef =
    useRef<HTMLDivElement | null>(null);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);

  const [user, setUser] =
    useState<User | null>(null);

  const [loggingOut, setLoggingOut] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        if (!active) {
          return;
        }

        if (!response.ok) {
          setAuthenticated(false);
          setUser(null);
          return;
        }

        const result: AuthResponse =
          await response.json();

        if (
          result.authenticated &&
          result.user
        ) {
          setAuthenticated(true);
          setUser(result.user);
        } else {
          setAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        console.error(
          "Unable to load authenticated user:",
          error
        );

        setAuthenticated(false);
        setUser(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      const target = event.target as Node;

      const clickedDesktopMenu =
        desktopProfileMenuRef.current?.contains(
          target
        );

      const clickedMobileMenu =
        mobileProfileMenuRef.current?.contains(
          target
        );

      if (
        !clickedDesktopMenu &&
        !clickedMobileMenu
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const response = await fetch(
        "/api/logout",
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.error(
          "Logout request failed:",
          response.status
        );
      }
    } catch (error) {
      console.error(
        "Unable to complete logout request:",
        error
      );
    } finally {
      localStorage.removeItem("userId");

      setAuthenticated(false);
      setUser(null);
      setMenuOpen(false);
      setProfileOpen(false);
      setLoggingOut(false);

      window.location.assign("/login");
    }
  }

  function closeMenus() {
    setMenuOpen(false);
    setProfileOpen(false);
  }

  function toggleMobileMenu() {
    setMenuOpen((current) => {
      const nextValue = !current;

      if (!nextValue) {
        setProfileOpen(false);
      }

      return nextValue;
    });
  }

  function isActive(href: string) {
    if (
      href === "/" ||
      href === "/admin"
    ) {
      return pathname === href;
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  function linkClasses(href: string) {
    const active = isActive(href);

    return [
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
      active
        ? "bg-blue-50 text-blue-600"
        : "text-slate-700 hover:bg-lime-50 hover:text-slate-900",
    ].join(" ");
  }

  function mobileLinkClasses(
    href: string
  ) {
    const active = isActive(href);

    return [
      "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors duration-200",
      active
        ? "bg-blue-50 text-blue-600"
        : "text-slate-700 hover:bg-lime-50 hover:text-slate-900",
    ].join(" ");
  }

  function dropdownLinkClasses(
    href: string
  ) {
    const active = isActive(href);

    return [
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
      active
        ? "bg-blue-50 text-blue-600"
        : "text-slate-700 hover:bg-lime-50 hover:text-slate-900",
    ].join(" ");
  }

  function getInitials() {
    const firstInitial =
      user?.firstName?.[0] ?? "";

    const lastInitial =
      user?.lastName?.[0] ?? "";

    const initials =
      `${firstInitial}${lastInitial}`.trim();

    if (initials) {
      return initials.toUpperCase();
    }

    return (
      user?.email?.[0]?.toUpperCase() ??
      "U"
    );
  }

  function getDisplayName() {
    const fullName = [
      user?.firstName,
      user?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    return (
      fullName ||
      user?.email ||
      "User"
    );
  }

  const isAdmin =
    authenticated &&
    user?.role?.toUpperCase() === "ADMIN";

  const mainLinks: NavItem[] = [
    ...publicLinks,
    ...(authenticated
      ? authenticatedLinks
      : []),
    ...(isAdmin ? adminLinks : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          onClick={closeMenus}
          className="flex items-center"
          aria-label="Perfect XV home page"
        >
          <span className="relative block h-25 w-25 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
            <Image
              src="/images/logo.jpeg"
              alt="Perfect XV logo"
              fill
              sizes="64px"
              className="object-cover"
              priority
            />
          </span>
        </Link>

        <nav
          className="hidden items-center gap-2 lg:flex"
          aria-label="Main navigation"
        >
          {mainLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={linkClasses(
                item.href
              )}
              aria-current={
                isActive(item.href)
                  ? "page"
                  : undefined
              }
            >
              <span
                className="mr-1"
                aria-hidden="true"
              >
                {item.icon}
              </span>

              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {!loading &&
            !authenticated &&
            guestLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={linkClasses(
                  item.href
                )}
                aria-current={
                  isActive(item.href)
                    ? "page"
                    : undefined
                }
              >
                <span
                  className="mr-1"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>

                {item.label}
              </Link>
            ))}

          {!loading && authenticated && (
            <div
              ref={desktopProfileMenuRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setProfileOpen(
                    (current) => !current
                  )
                }
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-lime-50 hover:text-slate-900"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                aria-controls="desktop-profile-menu"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-lime-300 text-sm font-bold text-slate-900">
                  {getInitials()}
                </span>

                <span className="max-w-40 truncate">
                  {getDisplayName()}
                </span>

                <span
                  className="text-xs text-slate-500"
                  aria-hidden="true"
                >
                  {profileOpen ? "▲" : "▼"}
                </span>
              </button>

              {profileOpen && (
                <div
                  id="desktop-profile-menu"
                  role="menu"
                  className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
                >
                  <div className="border-b border-slate-100 px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-lime-300 text-sm font-bold text-slate-900">
                        {getInitials()}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {getDisplayName()}
                        </p>

                        {user?.email && (
                          <p className="truncate text-sm text-slate-500">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {user?.role && (
                      <p className="mt-3 inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                        {user.role}
                      </p>
                    )}
                  </div>

                  <div className="py-2">
                    <Link
                      href="/dashboard"
                      role="menuitem"
                      className={dropdownLinkClasses(
                        "/dashboard"
                      )}
                      onClick={() =>
                        setProfileOpen(false)
                      }
                    >
                      <span aria-hidden="true">
                        📊
                      </span>
                      <span>My Dashboard</span>
                    </Link>

                    <Link
                      href="/predictions"
                      role="menuitem"
                      className={dropdownLinkClasses(
                        "/predictions"
                      )}
                      onClick={() =>
                        setProfileOpen(false)
                      }
                    >
                      <span aria-hidden="true">
                        📝
                      </span>
                      <span>My Predictions</span>
                    </Link>

                    <Link
                      href="/leaderboard"
                      role="menuitem"
                      className={dropdownLinkClasses(
                        "/leaderboard"
                      )}
                      onClick={() =>
                        setProfileOpen(false)
                      }
                    >
                      <span aria-hidden="true">
                        🏆
                      </span>
                      <span>Leaderboard</span>
                    </Link>

                    {isAdmin && (
                      <>
                        <div className="my-2 border-t border-slate-100" />

                        <Link
                          href="/admin"
                          role="menuitem"
                          className={dropdownLinkClasses(
                            "/admin"
                          )}
                          onClick={() =>
                            setProfileOpen(false)
                          }
                        >
                          <span aria-hidden="true">
                            🛠️
                          </span>
                          <span>Admin Results</span>
                        </Link>

                        <Link
                          href="/admin/dashboard"
                          role="menuitem"
                          className={dropdownLinkClasses(
                            "/admin/dashboard"
                          )}
                          onClick={() =>
                            setProfileOpen(false)
                          }
                        >
                          <span aria-hidden="true">
                            📈
                          </span>
                          <span>Admin Dashboard</span>
                        </Link>

                        <Link
                          href="/admin/audit"
                          role="menuitem"
                          className={dropdownLinkClasses(
                            "/admin/audit"
                          )}
                          onClick={() =>
                            setProfileOpen(false)
                          }
                        >
                          <span aria-hidden="true">
                            📋
                          </span>
                          <span>Audit</span>
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span aria-hidden="true">
                        🚪
                      </span>

                      <span>
                        {loggingOut
                          ? "Logging Out..."
                          : "Logout"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-lime-50 lg:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={toggleMobileMenu}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-slate-200 bg-white px-6 py-4 lg:hidden"
        >
          <nav
            className="space-y-2"
            aria-label="Mobile navigation"
          >
            {mainLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={mobileLinkClasses(
                  item.href
                )}
                onClick={closeMenus}
                aria-current={
                  isActive(item.href)
                    ? "page"
                    : undefined
                }
              >
                <span aria-hidden="true">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </Link>
            ))}

            {!loading &&
              !authenticated &&
              guestLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={mobileLinkClasses(
                    item.href
                  )}
                  onClick={closeMenus}
                  aria-current={
                    isActive(item.href)
                      ? "page"
                      : undefined
                  }
                >
                  <span aria-hidden="true">
                    {item.icon}
                  </span>

                  <span>{item.label}</span>
                </Link>
              ))}

            {!loading && authenticated && (
              <div
                ref={mobileProfileMenuRef}
                className="mt-4 border-t border-slate-200 pt-4"
              >
                <button
                  type="button"
                  onClick={() =>
                    setProfileOpen(
                      (current) => !current
                    )
                  }
                  className="flex w-full items-center justify-between rounded-lg bg-lime-50 px-3 py-3 text-left transition-colors hover:bg-lime-100"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  aria-controls="mobile-profile-menu"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-lime-300 text-sm font-bold text-slate-900">
                      {getInitials()}
                    </span>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {getDisplayName()}
                      </p>

                      {user?.email && (
                        <p className="truncate text-sm text-slate-500">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className="text-sm text-slate-500"
                    aria-hidden="true"
                  >
                    {profileOpen
                      ? "▲"
                      : "▼"}
                  </span>
                </button>

                {profileOpen && (
                  <div
                    id="mobile-profile-menu"
                    role="menu"
                    className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-2"
                  >
                    {user?.role && (
                      <p className="mx-1 mb-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                        {user.role}
                      </p>
                    )}

                    <Link
                      href="/dashboard"
                      role="menuitem"
                      className={mobileLinkClasses(
                        "/dashboard"
                      )}
                      onClick={closeMenus}
                    >
                      <span aria-hidden="true">
                        📊
                      </span>
                      <span>My Dashboard</span>
                    </Link>

                    <Link
                      href="/predictions"
                      role="menuitem"
                      className={mobileLinkClasses(
                        "/predictions"
                      )}
                      onClick={closeMenus}
                    >
                      <span aria-hidden="true">
                        📝
                      </span>
                      <span>My Predictions</span>
                    </Link>

                    <Link
                      href="/leaderboard"
                      role="menuitem"
                      className={mobileLinkClasses(
                        "/leaderboard"
                      )}
                      onClick={closeMenus}
                    >
                      <span aria-hidden="true">
                        🏆
                      </span>
                      <span>Leaderboard</span>
                    </Link>

                    {isAdmin && (
                      <>
                        <div className="my-2 border-t border-slate-100" />

                        <Link
                          href="/admin"
                          role="menuitem"
                          className={mobileLinkClasses(
                            "/admin"
                          )}
                          onClick={closeMenus}
                        >
                          <span aria-hidden="true">
                            🛠️
                          </span>
                          <span>Admin Results</span>
                        </Link>

                        <Link
                          href="/admin/dashboard"
                          role="menuitem"
                          className={mobileLinkClasses(
                            "/admin/dashboard"
                          )}
                          onClick={closeMenus}
                        >
                          <span aria-hidden="true">
                            📈
                          </span>
                          <span>Admin Dashboard</span>
                        </Link>

                        <Link
                          href="/admin/audit"
                          role="menuitem"
                          className={mobileLinkClasses(
                            "/admin/audit"
                          )}
                          onClick={closeMenus}
                        >
                          <span aria-hidden="true">
                            📋
                          </span>
                          <span>Audit</span>
                        </Link>
                      </>
                    )}

                    <div className="my-2 border-t border-slate-100" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-base font-medium text-orange-600 transition-colors duration-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span aria-hidden="true">
                        🚪
                      </span>

                      <span>
                        {loggingOut
                          ? "Logging Out..."
                          : "Logout"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}