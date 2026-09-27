import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { SectionHeader } from '../components/ui/Narrative';
import { Chip } from '../components/ui/Badges';
import { useAuth } from '../hooks/useAuth';
import { useFilters } from '../hooks/useFilters';
import { ReportDescriptor, ReportKind } from '../api/types';
import { downloadText, toCsv } from '../utils/format';

export default function ReportsPage() {
  const reports = useApi((f) => DineIQApi.getReports(f));
  const { canExport } = useAuth();
  const { filters, activeCount } = useFilters();
  const [building, setBuilding] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const generate = async (r: ReportDescriptor) => {
    setBuilding(r.kind);
    setDone(null);
    try {
      const rows = await DineIQApi.getReportRows(r.kind, filters);
      const csv = toCsv(rows);
      downloadText(`dineiq_${r.kind}.csv`, csv);
      setDone(r.kind);
    } finally {
      setBuilding(null);
      setTimeout(() => setDone(null), 2600);
    }
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Reports · Data Export"
        title="Reports & Export"
        desc="All twelve report types, generated against the current global filters and downloaded as CSV (Excel-compatible)."
        right={
          <>
            <span className="chip">{activeCount} filters active</span>
            <span className={`chip ${canExport ? 'success' : 'danger'}`}>{canExport ? 'export permitted' : 'role restricted'}</span>
          </>
        }
      />

      {!canExport && (
        <div className="chip danger" style={{ marginBottom: 14, whiteSpace: 'normal', textAlign: 'left' }}>
          Your role does not have export permission (role-gated exports). Sign in as manager / admin to enable downloads.
        </div>
      )}

      {reports.status === 'loading' ? (
        <div className="grid grid-3">
          {Array.from({ length: 9 }, (_, i) => <div key={i} className="skeleton" style={{ height: 170 }} />)}
        </div>
      ) : reports.status === 'error' ? (
        <Panel>
          <p className="muted" style={{ textAlign: 'center', padding: 30 }}>
            Unable to load this analysis.{' '}
            <button className="btn btn-sm" onClick={reports.reload}>Retry</button>
          </p>
        </Panel>
      ) : (reports.data ?? []).length === 0 ? (
        <Panel><p className="muted" style={{ textAlign: 'center', padding: 30 }}>No data available for this selection.</p></Panel>
      ) : (
        <div className="grid grid-3">
          {(reports.data ?? []).map((r) => (
            <article key={r.kind} className="panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  <FileText size={18} />
                </div>
                <Chip>{r.rows.toLocaleString()} rows</Chip>
              </div>
              <div>
                <h3 style={{ fontSize: '1rem' }}>{r.name}</h3>
                <p className="muted" style={{ fontSize: 'var(--fs-xs)', marginTop: 5 }}>{r.description}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 'auto', flexWrap: 'wrap' }}>
                {r.formats.map((f) => <span key={f} className="chip" style={{ fontSize: 9.5 }}>{f.toUpperCase()}</span>)}
              </div>
              <button
                className="btn"
                disabled={!canExport || building === r.kind}
                onClick={() => generate(r)}
                style={{ width: '100%' }}
                title={canExport ? 'Download CSV (Excel-compatible)' : 'Export restricted for your role'}
              >
                {building === r.kind ? <Loader2 size={14} className="spin" /> : done === r.kind ? <FileSpreadsheet size={14} /> : <Download size={14} />}
                {building === r.kind ? 'Generating…' : done === r.kind ? 'Downloaded' : 'Generate report'}
              </button>
            </article>
          ))}
        </div>
      )}

      <div className="grid grid-2" style={{ marginTop: 18 }}>
        <div className="chip" style={{ whiteSpace: 'normal', textAlign: 'left', padding: 12, alignItems: 'flex-start', lineHeight: 1.6 }}>
          Reports honor the <b>global filter state</b> (date range, location, segment, class …) — change filters in the top bar and regenerate.
        </div>
        <div className="chip info" style={{ whiteSpace: 'normal', textAlign: 'left', padding: 12, alignItems: 'flex-start', lineHeight: 1.6 }}>
          CSV is generated client-side from the active data adapter in this build; the external backend can serve the same report kinds later through <span className="mono">getReportRows(kind, filters)</span> without UI changes.
        </div>
      </div>
    </div>
  );
}
