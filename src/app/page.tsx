'use client';

import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Store } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const { signIn, resetPassword, user, loading } = useAuth();
  const router = useRouter();

  const checkUserStore = useCallback(async () => {
    // Verificar se o usuário ainda existe antes de fazer a requisição
    if (!user?.id) {
      return;
    }

    try {
      const response = await fetch('/api/user/stores');
      
      if (response.status === 401) {
        // Usuário não está autenticado, não fazer nada
        return;
      }
      
      if (!response.ok) {
        return;
      }
      
      const stores = await response.json();
      
      // Buscar a store do usuário logado (deveria ser apenas uma por usuário)
      const userStore = stores.find((store: { user_id: string }) => store.user_id === user?.id);
      
      if (userStore) {
        router.push(`/admin/${userStore.slug}`);
      } else {
        router.push('/create-store');
      }
    } catch {
      // Erro silencioso ao verificar loja
    }
  }, [user?.id, router]);

  useEffect(() => {
    if (user && !loading && user.id) {
      // Só verificar loja se o usuário estiver logado e tiver ID
      checkUserStore();
    }
  }, [user, loading, checkUserStore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Login realizado com sucesso!');
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotEmail.trim()) {
      toast.error('Digite seu email');
      return;
    }

    setIsResettingPassword(true);

    const { error } = await resetPassword(forgotEmail);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setShowForgotPassword(false);
      setForgotEmail('');
    }
    
    setIsResettingPassword(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  Bee Link
                </h1>
                <p className="text-sm text-gray-600">Sua loja em um link</p>
              </div>
            </div>
            
            <Link 
              href="/create" 
              className="hidden sm:flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              <span>Criar conta</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Bem-vindo de volta!
            </h2>
            <p className="text-lg text-gray-600">
              Acesse sua conta para gerenciar sua loja online
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            {/* Forgot Password Link */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Create Account Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Não tem uma conta?{' '}
                <Link 
                  href="/create" 
                  className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Esqueci minha senha</h3>
            <p className="text-gray-600 text-sm mb-6">
              Digite seu email para receber as instruções de recuperação de senha.
            </p>
            
            <form onSubmit={handleForgotPassword}>
              <div className="mb-4">
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotEmail('');
                  }}
                  className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 px-4 rounded-xl font-medium hover:from-purple-700 hover:to-violet-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResettingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isResettingPassword ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-4 w-24 h-24 bg-purple-100/50 rounded-full" />
        <div className="absolute top-32 right-8 w-16 h-16 bg-violet-100/50 rounded-full" />
        <div className="absolute bottom-40 left-8 w-28 h-28 bg-purple-100/30 rounded-full" />
        <div className="absolute bottom-60 right-12 w-36 h-36 bg-violet-100/30 rounded-full" />
      </div>
    </div>
  );
} 