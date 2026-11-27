import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cashie — Markets dashboard",
  description: "A sample stocks and crypto market dashboard.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
