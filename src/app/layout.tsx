import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bee Link",
  description: "Bee Link Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
