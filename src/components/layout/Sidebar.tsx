import { useEffect, useState, type FocusEvent, type MouseEvent } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { DineIQLogo } from '../DineIQLogo';
import { useAuth } from '../../hooks/useAuth';
import { navigationForRole } from './nav';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({ open, onClose, collapsed, onToggleCollapsed }: SidebarProps) {
  const { role } = useAuth();
  const navGroups = navigationForRole(role);
  const [navTooltip, setNavTooltip] = useState<{ label: string; top: number; left: number } | null>(null);

  useEffect(() => {
    if (!collapsed) setNavTooltip(null);
  }, [collapsed]);

  const showTooltip = (event: MouseEvent<HTMLAnchorElement> | FocusEvent<HTMLAnchorElement>, label: string) => {
    if (!collapsed) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setNavTooltip({ label, top: rect.top + rect.height / 2, left: rect.right + 10 });
  };

  return (
    <>
      {open && <div onClick={onClose} aria-hidden style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', zIndex: 40, backdropFilter: 'blur(4px)' }} />}
      <aside
        aria-label="Primary navigation"
        className={`app-sidebar panel-glass${collapsed ? ' is-collapsed' : ''}`}
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: 50, transform: open ? 'translateX(0)' : 'translateX(-102%)',
          transition: 'width 260ms cubic-bezier(0.22, 1, 0.36, 1), transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div className="sidebar-brand-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '16px 14px 12px', borderBottom: '1px solid var(--border)' }}>
          <span className="sidebar-logo-full"><DineIQLogo size={36} /></span>
          <span className="sidebar-logo-icon"><DineIQLogo mode="icon" size={36} /></span>
          <button className="btn btn-ghost btn-sm sidebar-collapse-toggle" onClick={onToggleCollapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
          <button className="btn btn-ghost btn-sm only-mobile" onClick={onClose} aria-label="Close navigation">
            <X size={15} />
          </button>
        </div>

        <nav style={{ overflowY: 'auto', padding: '8px 10px 20px', flex: 1 }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: 20 }}>
              <div className="eyebrow sidebar-group-label" style={{ padding: '0 8px', marginBottom: 5, fontSize: 9, letterSpacing: '0.2em' }}>{group.label}</div>
              <div style={{ display: 'grid', gap: 1 }}>
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className="nav-link"
                    aria-label={collapsed ? item.label : undefined}
                    onMouseEnter={(event) => showTooltip(event, item.label)}
                    onMouseLeave={() => setNavTooltip(null)}
                    onFocus={(event) => showTooltip(event, item.label)}
                    onBlur={() => setNavTooltip(null)}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 10px', borderRadius: 8,
                      fontSize: 'var(--fs-sm)', fontWeight: isActive ? 650 : 500,
                      color: isActive ? 'var(--text-1)' : 'var(--text-2)',
                      background: isActive ? 'var(--accent-soft)' : 'transparent',
                      border: `1px solid ${isActive ? 'var(--border-accent)' : 'transparent'}`,
                      transition: 'background 140ms, color 140ms, border-color 140ms',
                      position: 'relative',
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span aria-hidden style={{ position: 'absolute', left: -10, top: '22%', bottom: '22%', width: 2.5, borderRadius: '0 3px 3px 0', background: 'var(--accent)' }} />}
                        <item.icon size={15} style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)', flexShrink: 0 }} />
                        <span className="truncate sidebar-nav-label">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div style={{ padding: '12px 14px 16px', borderTop: '1px solid var(--border)' }}>
          <div className="sidebar-status-panel" title="LIVE SYSTEM · ONLINE · Apache Spark · XGBoost Engine" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8, background: 'rgba(62, 207, 142, 0.07)', border: '1px solid rgba(62, 207, 142, 0.2)' }}>
            <span className="sidebar-status-dot" aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)', flexShrink: 0 }} />
            <span className="sidebar-status-label" style={{ fontSize: 10.5, fontWeight: 650, color: 'var(--success)', letterSpacing: '0.07em' }}>LIVE SYSTEM · ONLINE</span>
          </div>
          <p className="faint sidebar-footer-label" style={{ fontSize: 9.5, marginTop: 7, textAlign: 'center', lineHeight: 1.5 }}>
            Apache Spark · XGBoost Engine
          </p>
        </div>
      </aside>
      {collapsed && navTooltip && (
        <div className="sidebar-nav-tooltip" role="tooltip" style={{ top: navTooltip.top, left: navTooltip.left }}>
          {navTooltip.label}
        </div>
      )}
    </>
  );
}
