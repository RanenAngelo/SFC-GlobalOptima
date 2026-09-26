import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu as MenuIcon, Moon, Search, SlidersHorizontal, Sun } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useFilters } from '../../hooks/useFilters';
import { useSettings } from '../../hooks/useSettings';
import { navigationForRole } from './nav';

interface TopbarProps {
  onOpenSidebar: () => void;
  onToggleFilters: () => void;
  filtersOpen: boolean;
}

export function Topbar({ onOpenSidebar, onToggleFilters, filtersOpen }: TopbarProps) {
  const { session, logout, role } = useAuth();
  const { filters, setFilter, activeCount } = useFilters();
  const { resolvedTheme, setThemePref } = useSettings();
  const loc = useLocation();
  const nav = useNavigate();

  const title =
    navigationForRole(role).flatMap((g) => g.items).find((i) => (i.to === '/' ? loc.pathname === '/' : loc.pathname.startsWith(i.to)))?.label
    ?? 'DineIQ';

  const initials = session?.user.displayName.split(' ').map((p) => p[0]).slice(0, 2).join('') ?? 'U';

  return (
    <header
      className="panel-glass app-topbar"
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        display: 'flex', alignItems: 'center', gap: 10,
        height: 'var(--topbar-h)', padding: '0 16px',
        background: 'var(--glass)', backdropFilter: 'blur(22px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <button className="btn btn-ghost btn-sm only-mobile" onClick={onOpenSidebar} aria-label="Open navigation">
        <MenuIcon size={17} />
      </button>

      <div style={{ minWidth: 0 }} className="truncate">
        <div className="eyebrow" style={{ fontSize: 9, letterSpacing: '0.2em' }}>DineIQ Analytics</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em' }} className="truncate">{title}</div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ position: 'relative', width: 210 }} className="hide-sm">
        <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input
          className="input"
          style={{ paddingLeft: 31, height: 36, fontSize: 'var(--fs-sm)' }}
          placeholder="Search items, alerts…"
          value={filters.query ?? ''}
          onChange={(e) => setFilter('query', e.target.value || undefined)}
          aria-label="Global search"
        />
      </div>

      <button className={`btn btn-sm ${filtersOpen ? 'btn-primary' : ''}`} onClick={onToggleFilters} aria-expanded={filtersOpen}>
        <SlidersHorizontal size={13} />
        <span className="hide-sm">Filters</span>
        {activeCount > 0 && (
          <span className="chip" style={{ padding: '0 5px', background: 'var(--bg-3)', color: 'var(--text-1)', borderColor: 'transparent', fontSize: 10 }}>
            {activeCount}
          </span>
        )}
      </button>

      <button
        className="btn btn-ghost btn-sm"
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        onClick={() => setThemePref(resolvedTheme === 'dark' ? 'light' : 'dark')}
      >
        {resolvedTheme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      <button className="btn btn-ghost btn-sm hide-sm" aria-label="Notifications" title="3 unread signals">
        <Bell size={15} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
        <button
          onClick={() => nav('/settings')}
          title={`${session?.user.displayName} · ${session?.user.role}`}
          aria-label="Account"
          style={{
            width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border-accent)',
            background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 750, fontSize: 12,
            cursor: 'pointer', display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-display)',
          }}
        >
          {initials}
        </button>
        <button className="btn btn-ghost btn-sm hide-sm" onClick={() => void logout()} title="Sign out" aria-label="Sign out">
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}
