import { create } from 'zustand';
import type { User, Institute, InstituteCourse, City, ExamType, InstituteFilters, SubscriptionTier } from '@/types';

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
