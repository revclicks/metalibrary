import { create } from 'zustand'
import type { FilterState, ViewMode, UserType, FolderType, TagType } from '@/types'

interface AppState {
  // Auth
  user: UserType | null
  token: string | null
  setUser: (user: UserType | null) => void
  setToken: (token: string | null) => void
  logout: () => void

  // View
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Filters
  filters: FilterState
  setFilters: (filters: Partial<FilterState>) => void
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
  clearFilters: () => void

  // Filter panel
  filterPanelOpen: boolean
  setFilterPanelOpen: (open: boolean) => void

  // Saved filters
  savedFilters: { id: string; name: string; filters: FilterState }[]
  setSavedFilters: (filters: { id: string; name: string; filters: FilterState }[]) => void

  // Selection
  selectedAds: string[]
  toggleAdSelection: (id: string) => void
  selectAllAds: (ids: string[]) => void
  clearSelection: () => void

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Dark mode
  darkMode: boolean
  toggleDarkMode: () => void

  // Folders cache
  folders: FolderType[]
  setFolders: (folders: FolderType[]) => void

  // Tags cache
  tags: TagType[]
  setTags: (tags: TagType[]) => void

  // Active folder
  activeFolderId: string | null
  setActiveFolderId: (id: string | null) => void

  // Pagination
  currentPage: number
  totalPages: number
  totalItems: number
  setCurrentPage: (page: number) => void
  setPagination: (totalItems: number, totalPages: number) => void
}

const defaultFilters: FilterState = {
  search: '',
  folders: [],
  tags: [],
  advertiser: '',
  format: [],
  formats: [],
  status: [],
  statuses: [],
  dateRange: { start: null, end: null },
  ctaType: [],
  ctaTypes: [],
  platforms: [],
  starred: null,
  tagLogic: 'OR',
  sortBy: 'savedAt',
  sortOrder: 'desc',
}

export const useStore = create<AppState>((set) => ({
  // Auth
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    }
    set({ token })
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
    set({ user: null, token: null })
  },

  // View
  viewMode: 'grid',
  setViewMode: (viewMode) => set({ viewMode }),

  // Search
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  // Filters
  filters: defaultFilters,
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  updateFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),
  clearFilters: () => set({ filters: defaultFilters }),

  // Filter panel
  filterPanelOpen: false,
  setFilterPanelOpen: (filterPanelOpen) => set({ filterPanelOpen }),

  // Saved filters
  savedFilters: [],
  setSavedFilters: (savedFilters) => set({ savedFilters }),

  // Selection
  selectedAds: [],
  toggleAdSelection: (id) =>
    set((state) => ({
      selectedAds: state.selectedAds.includes(id)
        ? state.selectedAds.filter((i) => i !== id)
        : [...state.selectedAds, id],
    })),
  selectAllAds: (ids) => set({ selectedAds: ids }),
  clearSelection: () => set({ selectedAds: [] }),

  // Sidebar
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  // Dark mode
  darkMode: false,
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

  // Folders cache
  folders: [],
  setFolders: (folders) => set({ folders }),

  // Tags cache
  tags: [],
  setTags: (tags) => set({ tags }),

  // Active folder
  activeFolderId: null,
  setActiveFolderId: (activeFolderId) => set({ activeFolderId }),

  // Pagination
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  setCurrentPage: (currentPage) => set({ currentPage }),
  setPagination: (totalItems, totalPages) => set({ totalItems, totalPages }),
}))
