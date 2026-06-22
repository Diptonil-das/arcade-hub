import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arcade Hub",
  description:
    "A futuristic gaming portal featuring Cyber Snake, Space Dodger, and AI Tic-Tac-Toe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
