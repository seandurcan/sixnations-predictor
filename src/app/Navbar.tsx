"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    {
      href: "/dashboard",
      label: "Dashboard",
    },
    {
      href: "/predictions",
      label: "Predictions",
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
    },
    {
      href: "/admin/dashboard",
      label: "Admin",
    },
  ];

  async function logout() {
    await fetch("/api/logout", {
      method: "POST",
    });

    window.location.href = "/login";
  }

  return (
    <nav className="bg-[#012169] text-white shadow-md">
      <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          /dashboard
            Six Nations Predictor
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {links.map((link) => {
              const active =
                pathname === link.href;

              return (
                {link.href}
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-md border border-white/20 hover:bg-white/10"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}