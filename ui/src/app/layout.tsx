import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deriv Trading",
  description: "Deriv trading dashboard powered by Claude MCP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-[#0f1117]">{children}</body>
    </html>
  );
}
