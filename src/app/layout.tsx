import "./globals.css";
import type { Metadata } from "next";
import { Red_Hat_Display } from "next/font/google";

const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Bee Link - Sua loja e redes sociais em um único link",
  description: "Centralize produtos, redes sociais e contatos em uma página profissional. Facilite a conexão com seus clientes e aumente suas vendas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${redHatDisplay.className} bg-background-primary text-content-body`} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
} 