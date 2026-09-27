import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { SettingsProvider } from './hooks/useSettings';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { FiltersProvider } from './hooks/useFilters';
import { AppShell } from './components/layout/AppShell';
import { KpiSkeleton } from './components/ui/States';
import { navigationForRole } from './components/layout/nav';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const JourneyPage = lazy(() => import('./pages/JourneyPage'));
const PerformancePage = lazy(() => import('./pages/PerformancePage'));
const ForecastPage = lazy(() => import('./pages/ForecastPage'));
const AnomaliesPage = lazy(() => import('./pages/AnomaliesPage'));
const LocationsPage = lazy(() => import('./pages/LocationsPage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const BasketPage = lazy(() => import('./pages/BasketPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'));
const ModelLabPage = lazy(() => import('./pages/ModelLabPage'));
const WastagePage = lazy(() => import('./pages/WastagePage'));
const WhatIfPage = lazy(() => import('./pages/WhatIfPage'));
const DataQualityPage = lazy(() => import('./pages/DataQualityPage'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function PageFallback() {
  return (
    <div style={{ display: 'grid', gap: 16, paddingTop: 12 }}>
      <KpiSkeleton count={4} />
      <div className="panel panel-pad"><div className="skeleton" style={{ height: 260 }} /></div>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const loc = useLocation();
  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}

function RequireRoleRoute({ path, children }: { path: string; children: React.ReactNode }) {
  const { role } = useAuth();
  const allowed = navigationForRole(role).some((group) => group.items.some((item) => item.to === path));
  return allowed ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <FiltersProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<RequireAuth><AppShell /></RequireAuth>}>
                <Route index element={<RequireRoleRoute path="/"><JourneyPage /></RequireRoleRoute>} />
                <Route path="/performance" element={<RequireRoleRoute path="/performance"><PerformancePage /></RequireRoleRoute>} />
                <Route path="/forecast" element={<RequireRoleRoute path="/forecast"><ForecastPage /></RequireRoleRoute>} />
                <Route path="/anomalies" element={<RequireRoleRoute path="/anomalies"><AnomaliesPage /></RequireRoleRoute>} />
                <Route path="/locations" element={<RequireRoleRoute path="/locations"><LocationsPage /></RequireRoleRoute>} />
                <Route path="/menu" element={<RequireRoleRoute path="/menu"><MenuPage /></RequireRoleRoute>} />
                <Route path="/customers" element={<RequireRoleRoute path="/customers"><CustomersPage /></RequireRoleRoute>} />
                <Route path="/basket" element={<RequireRoleRoute path="/basket"><BasketPage /></RequireRoleRoute>} />
                <Route path="/pricing" element={<RequireRoleRoute path="/pricing"><PricingPage /></RequireRoleRoute>} />
                <Route path="/recommendations" element={<RequireRoleRoute path="/recommendations"><RecommendationsPage /></RequireRoleRoute>} />
                <Route path="/model-lab" element={<RequireRoleRoute path="/model-lab"><ModelLabPage /></RequireRoleRoute>} />
                <Route path="/wastage" element={<RequireRoleRoute path="/wastage"><WastagePage /></RequireRoleRoute>} />
                <Route path="/what-if" element={<RequireRoleRoute path="/what-if"><WhatIfPage /></RequireRoleRoute>} />
                <Route path="/data-quality" element={<RequireRoleRoute path="/data-quality"><DataQualityPage /></RequireRoleRoute>} />
                <Route path="/jobs" element={<RequireRoleRoute path="/jobs"><JobsPage /></RequireRoleRoute>} />
                <Route path="/reports" element={<RequireRoleRoute path="/reports"><ReportsPage /></RequireRoleRoute>} />
                <Route path="/settings" element={<RequireRoleRoute path="/settings"><SettingsPage /></RequireRoleRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </FiltersProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
