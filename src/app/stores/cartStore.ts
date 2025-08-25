import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fixCorruptedPrice } from '../../lib/price-utils';

export interface CartItem {
  name: string;
  price: string;
  image: string;
  description?: string;
  quantity: number;
}

interface CartStore {
  // Estado
  cart: CartItem[];
  storeSlug: string | null;
  isLoading: boolean;
  
  // Ações
  setStoreSlug: (slug: string) => void;
  setLoading: (loading: boolean) => void;
  addToCart: (product: { name: string; price: string; image: string }) => void;
  removeFromCart: (productName: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  getCartItemQuantity: (productName: string) => number;
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

      addToCart: (product: { name: string; price: string; image: string; description?: string }) => {
        set((state) => {
          // Verificar se o storeSlug está definido
          if (!state.storeSlug) {
            console.error('Tentativa de adicionar produto sem storeSlug definido');
            return state;
          }

          const existingItem = state.cart.find(item => item.name === product.name);
          if (existingItem) {
            return {
              cart: state.cart.map(item =>
                item.name === product.name
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

      removeFromCart: (productName) => {
        set((state) => {
          const existingItem = state.cart.find(item => item.name === productName);
          if (existingItem && existingItem.quantity > 1) {
            return {
              cart: state.cart.map(item =>
                item.name === productName
                  ? { ...item, quantity: item.quantity - 1 }
                  : item
              )
            };
          }
          return {
            cart: state.cart.filter(item => item.name !== productName)
          };
        });
      },

      clearCart: () => {
        set({ cart: [], isLoading: false });
      },

      getCartTotal: () => {
        const { cart } = get();
        return cart.reduce((total, item) => {
          // Usar fixCorruptedPrice para converter o preço formatado para centavos
          const priceInCents = fixCorruptedPrice(item.price);
          const priceInReais = priceInCents / 100;
          return total + (priceInReais * item.quantity);
        }, 0);
      },

      getCartItemCount: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.quantity, 0);
      },

      getCartItemQuantity: (productName) => {
        const { cart } = get();
        const item = cart.find(item => item.name === productName);
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