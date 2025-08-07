import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Logging removido para evitar problemas de hidratação

  // Se a página inicial tem parâmetros de auth, redirecionar para callback
  if (req.nextUrl.pathname === '/' && req.nextUrl.searchParams.get('code')) {
    const callbackUrl = new URL('/auth/callback', req.url);
    // Copiar todos os parâmetros
    req.nextUrl.searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(callbackUrl);
  }

  // Se há erro de token expirado, mostrar mensagem específica
  if (req.nextUrl.pathname === '/' && req.nextUrl.searchParams.get('error_code') === 'otp_expired') {
    const homeUrl = new URL('/', req.url);
    homeUrl.searchParams.set('message', 'Link de recuperação expirado. Solicite um novo.');
    return NextResponse.redirect(homeUrl);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Session logging removido para evitar problemas de hidratação

  // Rotas que precisam de autenticação
  const protectedRoutes = ['/dashboard', '/admin', '/create-store'];
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Se está tentando acessar rota protegida sem estar logado
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/create-store'],
}; 