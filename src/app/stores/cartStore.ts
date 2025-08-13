import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  name: string;
  price: string;
  image: string;
  description?: string;
  quantity: number;
  selectedColor?: string | null;
  selectedSize?: string | null;
}

interface CartStore {
  // Estado
  cart: CartItem[];
  storeSlug: string | null;
  isLoading: boolean;
  
  // Ações
  setStoreSlug: (slug: string) => void;
  setLoading: (loading: boolean) => void;
  addToCart: (product: { name: string; price: string; image: string; selectedColor?: string | null; selectedSize?: string | null }) => void;
  removeFromCart: (productName: string, selectedColor?: string | null, selectedSize?: string | null) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  getCartItemQuantity: (productName: string, selectedColor?: string | null, selectedSize?: string | null) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      cart: [],
      storeSlug: null,
      isLoading: true,

      // Ações
      setStoreSlug: (slug: string) => {
        set((state) => {
          // Se mudou de loja OU se não há storeSlug definido, limpar o carrinho
          if (!state.storeSlug || state.storeSlug !== slug) {
            return { storeSlug: slug, cart: [] };
          }
          return { storeSlug: slug };
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      addToCart: (product: { name: string; price: string; image: string; description?: string; selectedColor?: string | null; selectedSize?: string | null }) => {
        set((state) => {
          // Verificar se o storeSlug está definido
          if (!state.storeSlug) {
            console.error('Tentativa de adicionar produto sem storeSlug definido');
            return state;
          }

          // Verificar se já existe um item com o mesmo nome, cor e tamanho
          const existingItem = state.cart.find(item => 
            item.name === product.name && 
            item.selectedColor === product.selectedColor && 
            item.selectedSize === product.selectedSize
          );
          
          if (existingItem) {
            return {
              cart: state.cart.map(item =>
                item.name === product.name && 
                item.selectedColor === product.selectedColor && 
                item.selectedSize === product.selectedSize
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            };
          }
          return {
            cart: [...state.cart, { ...product, quantity: 1 }]
          };
        });
      },

      removeFromCart: (productName, selectedColor, selectedSize) => {
        set((state) => {
          const existingItem = state.cart.find(item => 
            item.name === productName && 
            item.selectedColor === selectedColor && 
            item.selectedSize === selectedSize
          );
          
          if (existingItem && existingItem.quantity > 1) {
            return {
              cart: state.cart.map(item =>
                item.name === productName && 
                item.selectedColor === selectedColor && 
                item.selectedSize === selectedSize
                  ? { ...item, quantity: item.quantity - 1 }
                  : item
              )
            };
          }
          return {
            cart: state.cart.filter(item => 
              !(item.name === productName && 
                item.selectedColor === selectedColor && 
                item.selectedSize === selectedSize)
            )
          };
        });
      },

      clearCart: () => {
        set({ cart: [], isLoading: false });
      },

      getCartTotal: () => {
        const { cart } = get();
        return cart.reduce((total, item) => {
          // Garantir que price seja uma string antes de usar replace
          const priceString = typeof item.price === 'string' ? item.price : String(item.price);
          const price = Number.parseFloat(priceString.replace('R$ ', '').replace(',', '.'));
          return total + (price * item.quantity);
        }, 0);
      },

      getCartItemCount: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.quantity, 0);
      },

      getCartItemQuantity: (productName, selectedColor, selectedSize) => {
        const { cart } = get();
        const item = cart.find(item => 
          item.name === productName && 
          item.selectedColor === selectedColor && 
          item.selectedSize === selectedSize
        );
        return item?.quantity || 0;
      },
    }),
    {
      name: 'cart-storage', // nome da chave no localStorage
      partialize: (state) => ({ 
        cart: state.cart, 
        storeSlug: state.storeSlug 
      }), // salva apenas cart e storeSlug
      onRehydrateStorage: () => (state) => {
        // Quando os dados são carregados do localStorage, seta loading como false
        if (state) {
          state.setLoading(false);
        }
      },
    }
  )
); 