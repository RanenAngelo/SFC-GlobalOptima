import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: number;
}

/** Slide-over drill-down panel used across tables & charts. */
export function Drawer({ open, onClose, title, subtitle, children, width = 460 }: DrawerProps) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', zIndex: 60, backdropFilter: 'blur(4px)' }}
          />
          <motion.aside
            role="dialog" aria-modal="true"
            initial={{ x: '102%' }} animate={{ x: 0 }} exit={{ x: '102%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: `min(${width}px, 94vw)`,
              background: 'var(--bg-1)', borderLeft: '1px solid var(--border)', zIndex: 61,
              display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-3)',
            }}
          >
            <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ minWidth: 0 }}>
                <h3 style={{ fontSize: '1.1rem' }}>{title}</h3>
                {subtitle && <p className="faint" style={{ fontSize: 11.5, marginTop: 3 }}>{subtitle}</p>}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close details"><X size={16} /></button>
            </header>
            <div style={{ overflowY: 'auto', padding: 18, flex: 1 }}>{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
