import { create } from 'zustand';
import type { User, Institute, InstituteCourse, City, ExamType, LeadFilters, InstituteFilters, SubscriptionTier } from '@/types';

interface AdminState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsAuthenticated: (val: boolean) => void;
  setIsLoading: (val: boolean) => void;
  logout: () => void;

  // Leads
  leads: User[];
  leadFilters: LeadFilters;
  selectedLeadIds: string[];
  setLeads: (leads: User[]) => void;
  setLeadFilters: (filters: LeadFilters) => void;
  setSelectedLeadIds: (ids: string[]) => void;
  toggleLeadSelection: (id: string) => void;
  selectAllLeads: (ids: string[]) => void;
  clearLeadSelection: () => void;

  // Institutes
  institutes: Institute[];
  instituteFilters: InstituteFilters;
  setInstitutes: (institutes: Institute[]) => void;
  setInstituteFilters: (filters: InstituteFilters) => void;

  // Courses
  courses: InstituteCourse[];
  setCourses: (courses: InstituteCourse[]) => void;

  // Master
  cities: City[];
  examTypes: ExamType[];
  setCities: (cities: City[]) => void;
  setExamTypes: (examTypes: ExamType[]) => void;

  // UI
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  // Auth
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setIsAuthenticated: (val) => set({ isAuthenticated: val }),
  setIsLoading: (val) => set({ isLoading: val }),
  logout: () => {
    localStorage.removeItem('superAdminToken');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },

  // Leads
  leads: [],
  leadFilters: {},
  selectedLeadIds: [],
  setLeads: (leads) => set({ leads }),
  setLeadFilters: (filters) => set({ leadFilters: filters }),
  setSelectedLeadIds: (ids) => set({ selectedLeadIds: ids }),
  toggleLeadSelection: (id) =>
    set((state) => ({
      selectedLeadIds: state.selectedLeadIds.includes(id)
        ? state.selectedLeadIds.filter((x) => x !== id)
        : [...state.selectedLeadIds, id],
    })),
  selectAllLeads: (ids) => set({ selectedLeadIds: ids }),
  clearLeadSelection: () => set({ selectedLeadIds: [] }),

  // Institutes
  institutes: [],
  instituteFilters: {},
  setInstitutes: (institutes) => set({ institutes }),
  setInstituteFilters: (filters) => set({ instituteFilters: filters }),

  // Courses
  courses: [],
  setCourses: (courses) => set({ courses }),

  // Master
  cities: [],
  examTypes: [],
  setCities: (cities) => set({ cities }),
  setExamTypes: (examTypes) => set({ examTypes }),

  // UI
  sidebarCollapsed: false,
  mobileNavOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
