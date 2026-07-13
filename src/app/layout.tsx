import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AcadTest - CBT & Assessment Platform",
  description: "Multi-tenant CBT and assessment platform for schools and organizations",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
