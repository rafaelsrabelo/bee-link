import { ArrowLeft, Home, Search } from 'lucide-react';
import Link from 'next/link';

export default function StoreNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary to-background-secondary flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone grande */}
        <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-accent-purple to-accent-pink rounded-full flex items-center justify-center">
          <Search size={64} className="text-white" />
        </div>

        {/* Conteúdo */}
        <h1 className="text-4xl font-bold text-content-headline mb-4">
          Loja não encontrada
        </h1>
        
        <p className="text-lg text-content-body mb-8">
          Ops! A loja que você está procurando não existe ou foi removida.
          Verifique se o link está correto.
        </p>

        {/* Botões de ação */}
        <div className="space-y-4">
          <Link 
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-accent-purple text-white rounded-xl font-semibold hover:bg-accent-purple/90 transition-all duration-300 shadow-lg"
          >
            <Home size={20} />
            Voltar ao Início
          </Link>
          
          <button 
            type="button"
            onClick={() => history.back()}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-background-tertiary text-content-headline border border-border-primary rounded-xl font-semibold hover:bg-border-secondary transition-all duration-300"
          >
            <ArrowLeft size={20} />
            Página Anterior
          </button>
        </div>

        {/* Informação adicional */}
        <div className="mt-12 p-6 bg-white rounded-2xl border border-border-primary">
          <h3 className="font-bold text-content-headline mb-2">
            Você é um lojista?
          </h3>
          <p className="text-content-body text-sm mb-4">
            Crie sua própria página personalizada e centralize todos os seus links em um só lugar.
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-accent-purple font-semibold hover:text-accent-purple/80 transition-colors"
          >
            Criar minha loja
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}