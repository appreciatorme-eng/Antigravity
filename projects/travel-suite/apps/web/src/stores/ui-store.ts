import { create } from 'zustand';

interface UIState {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;

    commandMenuOpen: boolean;
    setCommandMenuOpen: (open: boolean) => void;
    toggleCommandMenu: () => void;

    activeFilter: string;
    setActiveFilter: (filter: string) => void;

    searchQuery: string;
    setSearchQuery: (query: string) => void;

    modalState: {
        isOpen: boolean;
        type: string | null;
        data: any | null;
    };
    openModal: (type: string, data?: any) => void;
    closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    commandMenuOpen: false,
    setCommandMenuOpen: (open) => set({ commandMenuOpen: open }),
    toggleCommandMenu: () => set((state) => ({ commandMenuOpen: !state.commandMenuOpen })),

    activeFilter: 'all',
    setActiveFilter: (filter) => set({ activeFilter: filter }),

    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),

    modalState: {
        isOpen: false,
        type: null,
        data: null,
    },
    openModal: (type, data = null) => set({
        modalState: { isOpen: true, type, data }
    }),
    closeModal: () => set({
        modalState: { isOpen: false, type: null, data: null }
    }),
}));
