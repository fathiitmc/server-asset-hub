import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Server Asset Hub",
  description: "Infrastructure asset management dashboard",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
