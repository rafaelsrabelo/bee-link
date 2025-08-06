'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signUp: (email: string, password: string) => Promise<{ error: { message: string } | null }>;
  signInWithGoogle: () => Promise<{ error: { message: string } | null }>;
  resetPassword: (email: string) => Promise<{ error: { message: string } | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Verificar sessão atual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // Se há erro, retornar com mensagem amigável
      if (error) {
        let userMessage = 'Credenciais inválidas';
        
        if (error.message.includes('Invalid login credentials')) {
          userMessage = 'Email ou senha incorretos';
        } else if (error.message.includes('Email not confirmed')) {
          userMessage = 'Email não confirmado. Verifique sua caixa de entrada';
        } else if (error.message.includes('Too many requests')) {
          userMessage = 'Muitas tentativas. Tente novamente em alguns minutos';
        }
        
        return { 
          error: { 
            ...error, 
            message: userMessage 
          } 
        };
      }
      
      return { error: null };
    } catch {
      // Capturar erros inesperados e retornar como erro
      return { 
        error: { 
          message: 'Erro inesperado. Tente novamente' 
        } 
      };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      // Se há erro, retornar com mensagem amigável
      if (error) {
        let userMessage = 'Erro ao criar conta';
        
        if (error.message.includes('User already registered')) {
          userMessage = 'Este email já está cadastrado';
        } else if (error.message.includes('Password should be at least')) {
          userMessage = 'A senha deve ter pelo menos 6 caracteres';
        } else if (error.message.includes('Invalid email')) {
          userMessage = 'Email inválido';
        } else if (error.message.includes('Too many requests')) {
          userMessage = 'Muitas tentativas. Tente novamente em alguns minutos';
        }
        
        return { 
          error: { 
            ...error, 
            message: userMessage 
          } 
        };
      }
      
      return { error: null };
    } catch {
      // Capturar erros inesperados e retornar como erro
      return { 
        error: { 
          message: 'Erro inesperado. Tente novamente' 
        } 
      };
    }
  };

  const signInWithGoogle = async () => {
    return { 
      error: { 
        message: 'Login com Google não está disponível no momento' 
      } 
    };
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      
      return { error };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar email de recuperação';
      // Error logging removido para evitar problemas de hidratação
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    try {
      // Limpar a sessão do Supabase
      await supabase.auth.signOut();
      
      // Limpar o estado local
      setUser(null);
      setSession(null);
      
      // Forçar redirecionamento para login
      if (typeof window !== 'undefined') {
        // Limpar qualquer cache ou estado persistente
        window.localStorage.clear();
        window.sessionStorage.clear();
        
        // Redirecionar para login
        window.location.href = '/';
      }
    } catch {
      // Mesmo com erro, tentar redirecionar
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 