import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { authApi } from '@/api';
import AppShell from '@/components/layout/AppShell';
import PageTransition from '@/components/layout/PageTransition';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import LeadsPage from '@/pages/LeadsPage';
import DistributePage from '@/pages/DistributePage';
import InstitutesPage from '@/pages/InstitutesPage';
import CoursesPage from '@/pages/CoursesPage';
import CreditsPage from '@/pages/CreditsPage';
import LeadRequestsPage from '@/pages/LeadRequestsPage';
import FeaturedPurchasesPage from '@/pages/FeaturedPurchasesPage';
import AnalyticsPage from '@/pages/AnalyticsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, setToken, setIsAuthenticated, setIsLoading } = useAdminStore();

  useEffect(() => {
    const storedToken = localStorage.getItem('superAdminToken');
    if (storedToken) {
      setToken(storedToken);
      authApi
        .me()
        .then((u) => {
          setUser(u);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('superAdminToken');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [setUser, setToken, setIsAuthenticated, setIsLoading]);

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<PageTransition><DashboardPage /></PageTransition>} />
        <Route path="leads" element={<PageTransition><LeadsPage /></PageTransition>} />
        <Route path="distribute" element={<PageTransition><DistributePage /></PageTransition>} />
        <Route path="institutes" element={<PageTransition><InstitutesPage /></PageTransition>} />
        <Route path="courses" element={<PageTransition><CoursesPage /></PageTransition>} />
        <Route path="credits" element={<PageTransition><CreditsPage /></PageTransition>} />
        <Route path="lead-requests" element={<PageTransition><LeadRequestsPage /></PageTransition>} />
        <Route path="featured-purchases" element={<PageTransition><FeaturedPurchasesPage /></PageTransition>} />
        <Route path="analytics" element={<PageTransition><AnalyticsPage /></PageTransition>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthInitializer>
    </BrowserRouter>
  );
}

export default App;
