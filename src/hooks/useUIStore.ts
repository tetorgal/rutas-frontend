import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  selectedVendedorId: string | null;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedVendedorId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  selectedVendedorId: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSelectedVendedorId: (id) => set({ selectedVendedorId: id }),
}));
