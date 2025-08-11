import { create } from 'zustand';

interface PrintSettings {
  default_printer?: string;
  auto_print?: boolean;
  print_format?: 'thermal' | 'a4';
  paper_width?: number;
  auto_cut?: boolean;
  print_logo?: boolean;
  print_address?: boolean;
}

interface PrintSettingsState {
  printSettings: Record<string, PrintSettings | null>; // storeSlug -> settings
  setPrintSettings: (storeSlug: string, settings: PrintSettings | null) => void;
  getPrintSettings: (storeSlug: string) => PrintSettings | null;
  loadPrintSettings: (storeSlug: string) => Promise<void>;
}

export const usePrintSettingsStore = create<PrintSettingsState>((set, get) => ({
  printSettings: {},
  
  setPrintSettings: (storeSlug: string, settings: PrintSettings | null) => {
    set((state) => ({
      printSettings: {
        ...state.printSettings,
        [storeSlug]: settings
      }
    }));
  },
  
  getPrintSettings: (storeSlug: string) => {
    return get().printSettings[storeSlug] || null;
  },
  
  loadPrintSettings: async (storeSlug: string) => {
    // Se já temos as configurações carregadas, não fazer nova chamada
    if (get().printSettings[storeSlug] !== undefined) {
      return;
    }
    
    try {
      const response = await fetch(`/api/stores/${storeSlug}/print-settings`);
      if (response.ok) {
        const data = await response.json();
        get().setPrintSettings(storeSlug, data.print_settings);
      } else {
        get().setPrintSettings(storeSlug, null);
      }
    } catch (error) {
      get().setPrintSettings(storeSlug, null);
    }
  }
}));
