import { create } from 'zustand';

interface PendingOrdersState {
  pendingCount: number;
  setPendingCount: (count: number) => void;
  incrementCount: () => void;
  decrementCount: () => void;
}

export const usePendingOrdersStore = create<PendingOrdersState>((set, get) => ({
  pendingCount: 0,
  setPendingCount: (count: number) => {
    console.log('🔄 Store: Atualizando pendingCount de', get().pendingCount, 'para', count);
    set({ pendingCount: count });
  },
  incrementCount: () => {
    const current = get().pendingCount;
    console.log('➕ Store: Incrementando de', current, 'para', current + 1);
    set({ pendingCount: current + 1 });
  },
  decrementCount: () => {
    const current = get().pendingCount;
    const newCount = Math.max(0, current - 1);
    console.log('➖ Store: Decrementando de', current, 'para', newCount);
    set({ pendingCount: newCount });
  },
}));

// Debug: Log quando o store mudar
usePendingOrdersStore.subscribe((state) => {
  console.log('📊 Store mudou:', state.pendingCount);
}); 