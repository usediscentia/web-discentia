import type { Metadata } from "next";
import "./globals.css";
import "dialkit/styles.css";
import { DialRoot } from "dialkit";
import { getAppearanceBootScript } from "@/lib/appearance";

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
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: getAppearanceBootScript() }} />
      </head>
      <body className="h-full bg-background font-sans text-foreground antialiased">
        {children}
        <DialRoot />
      </body>
    </html>
  );
}
