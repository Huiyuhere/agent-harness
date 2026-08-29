import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Harness",
  description: "Design React applications on a code-native, multi-route canvas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
