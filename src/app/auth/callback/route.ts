import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  console.log('🚀 DEBUG CALLBACK - INICIADO!');
  console.log('Debug Callback - URL completa:', requestUrl.toString());
  console.log('Debug Callback - Parâmetros recebidos:', {
    code: code ? 'Presente' : 'Ausente',
    type,
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  });

  if (code) {
    console.log('Debug Callback - Processando código:', code);
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      // Para recovery, primeiro verificamos se é um token de recovery válido
      // Se não conseguir trocar o código, pode ser um link de recovery direto
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Debug Callback - Erro ao trocar código:', error);
        
        // Se é erro de PKCE, pode ser um token de recovery direto
        if (error.message?.includes('code verifier')) {
          console.log('Debug Callback - Tentando processar como token de recovery...');
          
          // Tentar usar o código diretamente como token de recovery
          try {
            // Para tokens de recovery, redirecionamos para a página com o token
            return NextResponse.redirect(new URL(`/auth/reset-password?token=${code}`, requestUrl.origin));
          } catch (recoveryError) {
            console.error('Debug Callback - Erro no processamento de recovery:', recoveryError);
            return NextResponse.redirect(new URL('/?error=recovery_error', requestUrl.origin));
          }
        }
        
        return NextResponse.redirect(new URL('/?error=callback_error', requestUrl.origin));
      }

      console.log('Debug Callback - Sessão criada com sucesso');

      // Se conseguiu criar sessão normalmente
      const session = data.session;
      if (session?.user) {
        console.log('Debug Callback - Usuário logado, redirecionando para reset password');
        return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
      } else {
        console.log('Debug Callback - Sessão inválida');
        return NextResponse.redirect(new URL('/?error=invalid_session', requestUrl.origin));
      }

    } catch (error) {
      console.error('Debug Callback - Erro geral:', error);
      return NextResponse.redirect(new URL('/?error=session_error', requestUrl.origin));
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/', requestUrl.origin));
} 