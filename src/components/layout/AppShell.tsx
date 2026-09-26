import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { FilterBar } from './FilterBar';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('dineiq.sidebar.collapsed') === 'true'; } catch { return false; }
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('dineiq.sidebar.collapsed', String(sidebarCollapsed)); } catch { /* Keep the current session state when storage is unavailable. */ }
  }, [sidebarCollapsed]);

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleFilters = useCallback(() => setFiltersOpen((v) => !v), []);

  return (
    <div
      className={`app-shell${sidebarCollapsed ? ' app-shell--sidebar-collapsed' : ''}`}
      style={{
        minHeight: '100vh',
        '--sidebar-current-width': sidebarCollapsed ? '76px' : 'var(--sidebar-w)',
      } as CSSProperties}
    >
      <Sidebar open={sidebarOpen} onClose={closeSidebar} collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)} />
      <div className="app-main" style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
      }}>
        <Topbar onOpenSidebar={openSidebar} onToggleFilters={toggleFilters} filtersOpen={filtersOpen} />
        <FilterBar open={filtersOpen} onClose={() => setFiltersOpen(false)} />
        <main style={{ flex: 1, padding: '20px 20px 72px', width: '100%', maxWidth: 1600, margin: '0 auto' }}>
          <Outlet />
        </main>
        <footer style={{ padding: '12px 20px 20px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
          <span className="faint" style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            DineIQ Analytics · Restaurant Intelligence Platform · Live Production Engine
          </span>
        </footer>
      </div>
    </div>
  );
}
