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
      <body className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-grow">{children}</main>
        
        {/* Global Footer with Legal Links */}
        <footer className="bg-white text-slate-500 border-t border-slate-200 px-6 py-8 text-center">
          <p className="font-semibold text-slate-900">
            Perfect XV / Six Nations Predictor
          </p>
          <p className="mt-1 text-sm">
            Analyse. Predict. Win.
          </p>
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <a href="/legal/privacy" className="hover:text-slate-900 underline">Privacy Policy</a>
            <a href="/legal/terms" className="hover:text-slate-900 underline">Terms & Conditions</a>
            <a href="/legal/cookies" className="hover:text-slate-900 underline">Cookie Policy</a>
            <a href="/legal/rules" className="hover:text-slate-900 underline">Competition Rules</a>
          </div>
        </footer>
      </body>
    </html>
  );
}