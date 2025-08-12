import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bee-link.vercel.app',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'static.vecteezy.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
  // Otimizações para evitar reloads desnecessários
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configurações de cache
  generateEtags: false,
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
