import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataVault - Market Data",
  description: "Market data platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full antialiased text-base"
    >
      <body className="min-h-full flex flex-col font-sans bg-black text-white selection:bg-blue-500/30">
        {children}
      </body>
    </html>
  );
}
