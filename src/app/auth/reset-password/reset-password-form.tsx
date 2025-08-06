'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Verificar se tem token direto na URL ou se está logado
    const checkAuthAndToken = async () => {
      try {
        // Verificar se há token direto na URL (só para debug, não precisamos processar)
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
          console.log('Debug - Token encontrado na URL:', tokenParam);
        }
        
        // Verificar se está logado (seja por token ou sessão existente)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Debug - Erro ao verificar sessão:', error);
          toast.error('Erro ao verificar autenticação');
          setTimeout(() => router.push('/'), 3000);
          return;
        }
        
        if (session?.user) {
          console.log('Debug - Usuário logado via sessão');
          setIsValidToken(true);
          toast.success('Você pode redefinir sua senha agora!');
        } else {
          console.log('Debug - Nenhuma autenticação válida encontrada');
          toast.error('Você precisa estar logado para redefinir a senha');
          setTimeout(() => router.push('/'), 3000);
        }
      } catch (error) {
        console.error('Debug - Erro geral:', error);
        toast.error('Erro ao verificar autenticação');
        setTimeout(() => router.push('/'), 3000);
      }
    };
    
    checkAuthAndToken();
  }, [searchParams, router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Senha alterada com sucesso! Você será redirecionado para o login.');
        
        // Fazer logout e redirecionar para login
        await supabase.auth.signOut();
        
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (error: unknown) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Validando link de recuperação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Redefinir Senha</h2>
          <p className="text-gray-600">Digite sua nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLoading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}