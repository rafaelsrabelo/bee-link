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
    set({ pendingCount: count });
  },
  incrementCount: () => {
    const current = get().pendingCount;
    set({ pendingCount: current + 1 });
  },
  decrementCount: () => {
    const current = get().pendingCount;
    const newCount = Math.max(0, current - 1);
    set({ pendingCount: newCount });
  },
}));
