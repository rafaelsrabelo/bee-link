'use client';

import { Store, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { ResetPasswordForm } from './reset-password-form';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      {/* Header */}
      <header className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                  Bee Link
                </h1>
                <p className="text-sm text-gray-600">Sua loja em um link</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Suspense fallback={<LoadingFallback />}>
            <ResetPasswordForm />
          </Suspense>
          
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-purple-600 hover:text-purple-700 font-medium transition-colors"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      </main>

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