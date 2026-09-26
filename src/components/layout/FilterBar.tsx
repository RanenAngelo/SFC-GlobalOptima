import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, X } from 'lucide-react';
import { useFilters } from '../../hooks/useFilters';
import { Filters, PerformanceClass } from '../../api/types';

function Select({
  label, value, onChange, options, anyLabel = 'All',
}: {
  label: string; value: string | undefined; onChange: (v: string | undefined) => void;
  options: { id: string; name: string }[]; anyLabel?: string;
}) {
  return (
    <label className="field" style={{ minWidth: 148, flex: '1 1 148px' }}>
      {label}
      <select className="select" value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
        <option value="">{anyLabel}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </label>
  );
}

/**
 * Unified global filter system — Step 48.
 * One surface → one filter state → every subscribed component updates.
 */
export function FilterBar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { filters, setFilter, reset, options, activeCount } = useFilters();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          style={{ overflow: 'hidden', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)' }}
        >
          <div style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ minWidth: 0 }}>
              <div className="eyebrow">Global filters</div>
              <div className="faint" style={{ fontSize: 10 }}>{activeCount} active</div>
            </div>

            <label className="field" style={{ width: 150 }}>
              From
              <input className="input" type="date" value={filters.dateFrom ?? ''} onChange={(e) => setFilter('dateFrom', e.target.value || undefined)} />
            </label>
            <label className="field" style={{ width: 150 }}>
              To
              <input className="input" type="date" value={filters.dateTo ?? ''} onChange={(e) => setFilter('dateTo', e.target.value || undefined)} />
            </label>

            <Select label="Location" value={filters.location} onChange={(v) => setFilter('location', v)} options={options?.locations ?? []} />
            <Select label="Category" value={filters.category} onChange={(v) => setFilter('category', v)} options={(options?.categories ?? []).map((c) => ({ id: c, name: c }))} />
            <Select label="Menu item" value={filters.menuItem} onChange={(v) => setFilter('menuItem', v)} options={options?.menuItems ?? []} />
            <Select label="Segment" value={filters.segment} onChange={(v) => setFilter('segment', v)} options={options?.segments ?? []} />
            <Select label="Channel" value={filters.channel} onChange={(v) => setFilter('channel', v)} options={(options?.channels ?? []).map((c) => ({ id: c, name: c }))} />
            <Select label="Promotion" value={filters.promotion} onChange={(v) => setFilter('promotion', v)} options={options?.promotions ?? []} />
            <Select
              label="Performance class" value={filters.performanceClass === 'all' ? '' : filters.performanceClass}
              onChange={(v) => setFilter('performanceClass', (v as PerformanceClass) || 'all')}
              options={options?.performanceClasses ?? []}
            />

            <label className="field" style={{ width: 110 }}>
              Price min
              <input className="input" type="number" placeholder="0" value={filters.priceMin ?? ''}
                onChange={(e) => setFilter('priceMin', e.target.value === '' ? undefined : Number(e.target.value))} />
            </label>
            <label className="field" style={{ width: 110 }}>
              Price max
              <input className="input" type="number" placeholder="∞" value={filters.priceMax ?? ''}
                onChange={(e) => setFilter('priceMax', e.target.value === '' ? undefined : Number(e.target.value))} />
            </label>
            <label className="field" style={{ width: 106 }}>
              Rating ≥
              <input className="input" type="number" step="0.1" min={0} max={5} placeholder="0" value={filters.ratingMin ?? ''}
                onChange={(e) => setFilter('ratingMin', e.target.value === '' ? undefined : Number(e.target.value))} />
            </label>
            <label className="field" style={{ width: 116 }}>
              Wastage ≥ %
              <input className="input" type="number" step="0.5" min={0} placeholder="0" value={filters.wastageMin ?? ''}
                onChange={(e) => setFilter('wastageMin', e.target.value === '' ? undefined : Number(e.target.value))} />
            </label>

            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button className="btn btn-sm" onClick={reset}>
                <RotateCcw size={13} /> Reset
              </button>
              <button className="btn btn-ghost btn-sm only-mobile" onClick={onClose} aria-label="Close filters">
                <X size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export type { Filters };
