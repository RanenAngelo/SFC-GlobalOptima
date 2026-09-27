import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { SectionHeader } from '../components/ui/Narrative';
import { EmptyState, ErrorState } from '../components/ui/States';
import { Chip, StatusDot } from '../components/ui/Badges';
import { SparkJob } from '../api/types';

const STATUS_TONE = {
  succeeded: 'success', running: 'warn', queued: 'info', failed: 'danger',
} as const;

export default function JobsPage() {
  const { status, data, error, reload } = useApi(() => DineIQApi.getSparkJobs());
  const [openLog, setOpenLog] = useState<string | null>(null);

  const jobs = data ?? [];
  const counts = {
    running: jobs.filter((j) => j.status === 'running').length,
    queued: jobs.filter((j) => j.status === 'queued').length,
    succeeded: jobs.filter((j) => j.status === 'succeeded').length,
    failed: jobs.filter((j) => j.status === 'failed').length,
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Operations"
        title="Spark Job Monitoring"
        desc="Live status of ingestion, quality, cleaning, integration, feature and model-training jobs (FR lxv)."
        right={<button className="btn btn-sm" onClick={reload}><RefreshCw size={13} /> Refresh</button>}
      />

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        {(['running', 'queued', 'succeeded', 'failed'] as const).map((k) => (
          <div key={k} className="panel panel-pad">
            <div className="eyebrow">{k}</div>
            <div className="tabular" style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 700, marginTop: 6 }}>
              {status === 'loading' ? '—' : counts[k]}
            </div>
          </div>
        ))}
      </div>

      <Panel pad={false}>
        {status === 'loading' && (
          <div style={{ padding: 20, display: 'grid', gap: 12 }}>
            {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" style={{ height: 54 }} />)}
          </div>
        )}
        {status === 'error' && <ErrorState message={error} onRetry={reload} />}
        {status === 'ready' && jobs.length === 0 && <EmptyState />}
        {status === 'ready' && jobs.length > 0 && (
          <div style={{ display: 'grid' }}>
            {jobs.map((j: SparkJob) => (
              <div
                key={j.id}
                onClick={() => setOpenLog(openLog === j.id ? null : j.id)}
                style={{
                  padding: '14px 18px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  display: 'grid', gridTemplateColumns: 'auto minmax(180px, 1.4fr) minmax(110px, 0.7fr) minmax(120px, 1fr) auto',
                  gap: 14, alignItems: 'center', transition: 'background 140ms',
                }}
              >
                <StatusDot status={j.status} />
                <div style={{ minWidth: 0 }}>
                  <div className="truncate" style={{ fontWeight: 650, fontSize: 'var(--fs-sm)' }}>{j.name}</div>
                  <div className="faint" style={{ fontSize: 10.5 }}>{j.id} · {j.stage}</div>
                </div>
                <Chip tone={STATUS_TONE[j.status]}>{j.status}</Chip>
                <div>
                  <div className="skeleton" style={{ height: 6, borderRadius: 4, background: 'var(--surface-2)' }}>
                    <div style={{
                      width: `${j.progressPct}%`, height: '100%', borderRadius: 4,
                      background: j.status === 'failed' ? 'var(--danger)' : 'var(--accent)',
                      transition: 'width 600ms cubic-bezier(0.22,1,0.36,1)',
                    }} />
                  </div>
                  <div className="faint" style={{ fontSize: 10, marginTop: 4 }}>
                    {j.progressPct}%{j.rowsProcessed ? ` · ${j.rowsProcessed.toLocaleString()} rows` : ''}
                    {j.durationMs ? ` · ${(j.durationMs / 1000).toFixed(1)}s` : ''}
                  </div>
                </div>
                <div className="faint" style={{ fontSize: 10.5, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {new Date(j.startedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>

                {openLog === j.id && j.logTail && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <pre className="mono" style={{
                      margin: 0, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-3)',
                      border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-2)', overflowX: 'auto',
                    }}>
                      {`[${j.id}] ${j.status.toUpperCase()} — ${j.logTail}`}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
