import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      // Para recovery, primeiro verificamos se é um token de recovery válido
      // Se não conseguir trocar o código, pode ser um link de recovery direto
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
  
        
        // Se é erro de PKCE, pode ser um token de recovery direto
        if (error.message?.includes('code verifier')) {
  
          
          // Tentar usar o código diretamente como token de recovery
          try {
            // Para tokens de recovery, redirecionamos para a página com o token
            return NextResponse.redirect(new URL(`/auth/reset-password?token=${code}`, requestUrl.origin));
          } catch (recoveryError) {
    
            return NextResponse.redirect(new URL('/?error=recovery_error', requestUrl.origin));
          }
        }
        
        return NextResponse.redirect(new URL('/?error=callback_error', requestUrl.origin));
      }

      // Se conseguiu criar sessão normalmente
      const session = data.session;
      if (session?.user) {

        return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
      } else {

        return NextResponse.redirect(new URL('/?error=invalid_session', requestUrl.origin));
      }

    } catch (error) {
  
      return NextResponse.redirect(new URL('/?error=session_error', requestUrl.origin));
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 