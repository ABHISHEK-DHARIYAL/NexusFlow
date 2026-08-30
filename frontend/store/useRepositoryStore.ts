import { create } from 'zustand';
import { Repository } from '../types';
import { mockRepositories } from '../mocks/repositories';

interface RepositoryState {
  repositories: Repository[];
  selectedRepo: Repository | null;
  searchQuery: string;
  selectedLanguage: string;
  selectedVisibility: string;
  sortBy: 'healthScore' | 'starsCount' | 'name' | 'lastSyncedAt';
  sortOrder: 'asc' | 'desc';
  setSearchQuery: (query: string) => void;
  setLanguageFilter: (lang: string) => void;
  setVisibilityFilter: (vis: string) => void;
  setSorting: (field: 'healthScore' | 'starsCount' | 'name' | 'lastSyncedAt', order?: 'asc' | 'desc') => void;
  selectRepo: (id: string | null) => void;
}

export const useRepositoryStore = create<RepositoryState>((set, get) => ({
  repositories: mockRepositories,
  selectedRepo: mockRepositories[0],
  searchQuery: '',
  selectedLanguage: 'ALL',
  selectedVisibility: 'ALL',
  sortBy: 'healthScore',
  sortOrder: 'desc',
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setLanguageFilter: (lang: string) => set({ selectedLanguage: lang }),
  setVisibilityFilter: (vis: string) => set({ selectedVisibility: vis }),
  setSorting: (field, order) => {
    const currentOrder = get().sortOrder;
    const newOrder = order || (get().sortBy === field ? (currentOrder === 'asc' ? 'desc' : 'asc') : 'desc');
    set({ sortBy: field, sortOrder: newOrder });
  },
  selectRepo: (id: string | null) => {
    if (!id) {
      set({ selectedRepo: null });
      return;
    }
    const repo = get().repositories.find((r) => r.id === id) || null;
    set({ selectedRepo: repo });
  },
}));
