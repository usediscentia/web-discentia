import type { Metadata } from "next";
import "./globals.css";
import "dialkit/styles.css";
import { DialRoot } from "dialkit";

export const metadata: Metadata = {
  title: "discentia",
  description: "AI-powered learning platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="font-sans antialiased h-full">
        {children}
        <DialRoot />
      </body>
    </html>
  );
}
