import "./globals.css";
import type { Metadata } from "next";
import { Red_Hat_Display } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import { StoreProvider } from '../contexts/StoreContext';

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
        <AuthProvider>
          <StoreProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 