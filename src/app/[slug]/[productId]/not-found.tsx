import { ArrowLeft, Package } from 'lucide-react';

export default function ProductNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <Package className="w-12 h-12 text-gray-400" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Produto não encontrado
        </h1>
        
        <p className="text-gray-600 mb-8">
          O produto que você está procurando não existe ou foi removido.
        </p>
        
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a loja
        </button>
      </div>
    </div>
  );
} 