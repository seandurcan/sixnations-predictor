import type { Metadata } from "next";
import NavBar from "@/components/layout/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Six Nations Predictor",
  description:
    "Predict Six Nations scores, track your ranking, and compete on the leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}