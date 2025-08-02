'use client';

import { ExternalLink, Heart, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { StoreData } from '../../[slug]/data';

interface StoreGalleryProps {
  store: StoreData;
}

interface ProductModalProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
}

function ProductModal({ image, isOpen, onClose }: ProductModalProps) {
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full">
        <Image
          src={image}
          alt="Produto"
          fill
          className="object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function StoreGallery({ store }: StoreGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (image: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(image)) {
      newFavorites.delete(image);
    } else {
      newFavorites.add(image);
    }
    setFavorites(newFavorites);
  };

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
  };

  const handleModalClose = () => {
    setSelectedImage(null);
  };

  return (
    <>
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header da seção */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-content-headline mb-4">
              Nossos Produtos
            </h2>
            <p className="text-lg text-content-body max-w-2xl mx-auto">
              Cada peça é única, feita com carinho e atenção aos detalhes. 
              Descubra a beleza do crochê artesanal.
            </p>
          </div>

          {/* Grid de produtos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {store.products.map((product, index) => (
              <div
                key={`product-${index}-${product}`}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                {/* Container da imagem */}
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Overlay com ações */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      {/* Ações */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleImageClick(product.image)}
                          className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                        >
                          <ZoomIn size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavorite(product.image)}
                          className={`w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors ${
                            favorites.has(product.image)
                              ? 'bg-red-500 text-white'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          <Heart size={18} fill={favorites.has(product.image) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      
                      {/* Botão de interesse */}
                      <button type="button" className="px-4 py-2 bg-accent-green text-white text-sm font-medium rounded-full hover:bg-accent-green/90 transition-colors flex items-center gap-2">
                        <span>Tenho interesse</span>
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Badge de produto artesanal */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-content-headline rounded-full">
                      Artesanal
                    </span>
                  </div>
                </div>

                {/* Info do produto */}
                <div className="p-6">
                  <h3 className="font-semibold text-content-headline mb-2">
                    Produto #{index + 1}
                  </h3>
                  <p className="text-content-body text-sm">
                    Peça única feita à mão com materiais de qualidade
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Call to action */}
          <div className="text-center mt-16">
            <div className="inline-block p-8 bg-gradient-to-r from-accent-purple/10 to-accent-pink/10 rounded-3xl border border-border-primary">
              <h3 className="text-2xl font-bold text-content-headline mb-4">
                Gostou de alguma peça?
              </h3>
              <p className="text-content-body mb-6 max-w-md mx-auto">
                Entre em contato conosco pelo WhatsApp e saiba mais sobre nossos produtos!
              </p>
              <button className="px-8 py-4 bg-accent-green text-white rounded-full font-semibold hover:bg-accent-green/90 transition-all duration-300 shadow-lg">
                Conversar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal para visualizar imagem */}
      <ProductModal
        image={selectedImage || ''}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
}