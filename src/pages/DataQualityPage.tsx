import { Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { SectionHeader, AnalyticNarrative } from '../components/ui/Narrative';
import { DataTable, Column } from '../components/ui/DataTable';
import { PriorityBadge } from '../components/ui/Badges';
import { useAuth } from '../hooks/useAuth';
import { DataQualityIssue } from '../api/types';
import { fmtInt } from '../utils/format';

export default function DataQualityPage() {
  const { status, data, error, reload } = useApi((f) => DineIQApi.getDataQualityReport(f));
  const { canExport } = useAuth();

  const issueCols: Column<DataQualityIssue>[] = [
    { key: 'category', header: 'Issue category', value: (r) => r.category, render: (r) => <span style={{ fontWeight: 600 }}>{r.category}</span> },
    { key: 'severity', header: 'Severity', value: (r) => r.severity, render: (r) => <PriorityBadge priority={r.severity} /> },
    { key: 'count', header: 'Records', value: (r) => r.count, align: 'right', render: (r) => <span className="tabular">{fmtInt(r.count)}</span> },
    { key: 'rule', header: 'Rule', value: (r) => r.rule, render: (r) => <span className="faint" style={{ fontSize: 11.5 }}>{r.rule}</span> },
    { key: 'action', header: 'Cleaning action', value: (r) => r.action, render: (r) => <Chipish text={r.action} /> },
  ];

  return (
    <div>
      <SectionHeader
        eyebrow="Operations"
        title="Data Quality Report"
        desc="Pre-analysis identification of missing, duplicate, invalid and anomalous records + documented cleaning decisions."
        right={
          <button className="btn btn-sm" onClick={reload}><RefreshCw size={13} /> Re-scan</button>
        }
      />

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="panel panel-pad">
          <div className="eyebrow">Rows scanned</div>
          <div className="tabular" style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 700, marginTop: 6 }}>
            {status === 'ready' ? fmtInt(data!.scannedRows) : '—'}
          </div>
          <div className="faint" style={{ fontSize: 11, marginTop: 4 }}>order lines + related tables</div>
        </div>
        <div className="panel panel-pad">
          <div className="eyebrow">Pass rate</div>
          <div className="tabular" style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 700, marginTop: 6, color: 'var(--success)' }}>
            {status === 'ready' ? `${data!.passRatePct}%` : '—'}
          </div>
          <div className="faint" style={{ fontSize: 11, marginTop: 4 }}>after cleaning rules applied</div>
        </div>
        <div className="panel panel-pad">
          <div className="eyebrow">Rule categories</div>
          <div className="tabular" style={{ fontFamily: 'var(--font-display)', fontSize: '1.9rem', fontWeight: 700, marginTop: 6 }}>
            {status === 'ready' ? data!.issues.length : '—'}
          </div>
          <div className="faint" style={{ fontSize: 11, marginTop: 4 }}>validation checklist</div>
        </div>
      </div>

      <div className="grid" style={{ gap: 16 }}>
        <Panel title="Issue categories & cleaning rules" subtitle="Every cleaning decision is recorded.">
          <DataTable
            columns={issueCols}
            rows={data?.issues ?? []}
            loading={status === 'loading'}
            error={status === 'error' ? error : null}
            onRetry={reload}
            rowKey={(r) => r.category}
            pageSize={8}
            exportName="dineiq-data-quality"
            canExport={canExport}
          />
        </Panel>

        <Panel title="Cleaning decisions applied" subtitle="Quarantine / correct / remove — documented rules only.">
          {status === 'loading' ? (
            <div style={{ display: 'grid', gap: 10 }}>{Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}</div>
          ) : (
            <div className="grid grid-2">
              {(data?.cleaningDecisions ?? []).map((d) => (
                <div key={d.rule} className="panel panel-pad" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <ShieldCheck size={15} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 650 }}>{d.decision}</div>
                      <div className="faint" style={{ fontSize: 11, marginTop: 3 }}>{d.rule}</div>
                      <div style={{ marginTop: 8 }}><span className="chip info">{fmtInt(d.recordsAffected)} records affected</span></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="grid grid-2">
          <AnalyticNarrative narrative={{
            happened: `Data-quality scan covers ${status === 'ready' ? fmtInt(data!.scannedRows) : '1M+'} rows across all integrated tables.`,
            why: '15 defined rules (missing values → invalid location references) run before any analysis touches the data.',
            next: 'Quarantined records are excluded from revenue metrics but retained for audit — review the cleaning log before model retraining.',
            severity: 'medium',
          }} />
          <Panel title="Export" subtitle="Full quality report as CSV (role-gated).">
            <div style={{ display: 'grid', gap: 10 }}>
              <button className="btn" disabled={!canExport || status !== 'ready'}
                onClick={() => {
                  const rows = (data?.issues ?? []).map((i) => ({ category: i.category, severity: i.severity, count: i.count, rule: i.rule, action: i.action }));
                  const header = Object.keys(rows[0] ?? {}).join(',');
                  const csv = [header, ...rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = 'dineiq-data-quality-report.csv';
                  a.click();
                }}>
                <Download size={14} /> Download quality report
              </button>
              {!canExport && <span className="faint" style={{ fontSize: 11 }}>Your role does not have export permission.</span>}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Chipish({ text }: { text: string }) {
  return <span className="chip" style={{ fontWeight: 500 }}>{text}</span>;
}
