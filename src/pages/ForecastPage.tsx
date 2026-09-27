import { useState } from 'react';
import { Clock, GitBranch } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { ChartCard } from '../components/ui/ChartCard';
import { AnalyticNarrative, SectionHeader } from '../components/ui/Narrative';
import { KpiTile, Reveal } from '../components/ui/Motion';
import { ForecastChart } from '../components/charts/ForecastChart';
import { DataTable, Column } from '../components/ui/DataTable';
import { PriorityBadge, Chip } from '../components/ui/Badges';
import { ForecastPoint, HighRiskPeriod } from '../api/types';
import { fmtInt, fmtDate } from '../utils/format';

type Scope = 'item' | 'category' | 'location';

export default function ForecastPage() {
  const [scope, setScope] = useState<Scope>('category');
  const [horizon, setHorizon] = useState(30);

  const fc = useApi((f) => DineIQApi.getForecastAnalytics(f, horizon, scope), [horizon, scope]);
  const data = fc.data;

  const riskCols: Column<HighRiskPeriod>[] = [
    { key: 'date', header: 'Date', value: (r) => r.date, render: (r) => <span style={{ fontWeight: 600 }}>{fmtDate(r.date)}</span> },
    { key: 'demand', header: 'Expected demand', value: (r) => r.expectedDemand, align: 'right', render: (r) => <span className="tabular">{fmtInt(r.expectedDemand)}</span> },
    { key: 'cap', header: 'Capacity index', value: (r) => r.capacityIndex, align: 'right', render: (r) => (
      <span className={`chip ${r.capacityIndex > 1.22 ? 'danger' : 'warn'}`}>{r.capacityIndex.toFixed(2)}×</span>
    ) },
    { key: 'risk', header: 'Risk', value: (r) => r.risk, render: (r) => <PriorityBadge priority={r.risk} /> },
    { key: 'reason', header: 'Why', value: (r) => r.reason, render: (r) => <span className="faint" style={{ fontSize: 11.5 }}>{r.reason}</span> },
  ];

  const actualVsPred = (data?.points ?? [])
    .filter((p: ForecastPoint) => p.actual !== undefined && p.predicted !== undefined)
    .slice(-14)
    .reverse();

  const avpCols: Column<ForecastPoint>[] = [
    { key: 'date', header: 'Date', value: (r) => r.date, render: (r) => fmtDate(r.date) },
    { key: 'actual', header: 'Actual', value: (r) => r.actual ?? 0, align: 'right', render: (r) => <span className="tabular">{fmtInt(r.actual ?? 0)}</span> },
    { key: 'pred', header: 'Predicted', value: (r) => r.predicted ?? 0, align: 'right', render: (r) => <span className="tabular" style={{ color: 'var(--chart-2)' }}>{fmtInt(r.predicted ?? 0)}</span> },
    { key: 'err', header: 'Error', value: (r) => Math.abs((r.actual ?? 0) - (r.predicted ?? 0)), align: 'right',
      render: (r) => <span className="tabular">{fmtInt(Math.abs((r.actual ?? 0) - (r.predicted ?? 0)))}</span> },
  ];

  const seg = (v: string) => (
    <div style={{ display: 'inline-flex', background: 'var(--bg-3)', borderRadius: 10, padding: 3, border: '1px solid var(--border)', gap: 2 }}>
      {(['category', 'item', 'location'] as Scope[]).map((s) => (
        <button key={s} className="btn btn-sm" onClick={() => setScope(s)}
          style={{
            border: 'none', textTransform: 'capitalize',
            background: scope === s ? 'var(--surface-3)' : 'transparent',
            color: scope === s ? 'var(--text-1)' : 'var(--text-3)',
          }}>
          {s}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <SectionHeader
        eyebrow="Analytics · Demand Forecasting"
        title="Demand Forecasting"
        desc="Historical → predicted demand with confidence range, accuracy metrics and high-risk periods. Forecast horizon is configurable."
        right={
          <>
            {seg(scope)}
            <div style={{ display: 'inline-flex', gap: 6 }}>
              {[7, 30, 90].map((h) => (
                <button key={h} className={`btn btn-sm ${horizon === h ? 'btn-primary' : ''}`} onClick={() => setHorizon(h)}>{h}d</button>
              ))}
            </div>
          </>
        }
      />

      <Reveal>
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <KpiTile label="MAE" value={data?.metrics.mae ?? 0} format={(v) => v.toFixed(1)} foot="mean absolute error" />
          <KpiTile label="RMSE" value={data?.metrics.rmse ?? 0} format={(v) => v.toFixed(1)} foot="root mean squared error" />
          <KpiTile label="MAPE" value={data?.metrics.mape ?? 0} format={(v) => `${v.toFixed(2)}%`} foot={`baseline ${data ? data.metrics.baselineMape.toFixed(2) : '—'}%`} accent />
          <KpiTile label="R²" value={data?.metrics.r2 ?? 0} format={(v) => v.toFixed(3)} foot={data ? `beats baseline by ${data.metrics.improvementPct}%` : ''} />
        </div>
      </Reveal>

      <Reveal>
        <ChartCard
          title={`Forecast · ${scope} scope${data ? ` — ${data.scopeLabel}` : ''}`}
          subtitle={`Actual vs predicted with ${horizon}-day forward view`}
          loading={fc.status === 'loading'} error={fc.status === 'error' ? fc.error : null} onRetry={fc.reload}
          empty={!data || data.points.length === 0}
          height={330}
          footer={data && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="chip"><span style={{ width: 14, height: 2.5, background: 'var(--chart-1)', borderRadius: 2 }} /> Actual</span>
              <span className="chip"><span style={{ width: 14, height: 2.5, background: 'var(--chart-2)', borderRadius: 2, borderTop: '2px dashed' }} /> Forecast</span>
              <span className="chip info"><GitBranch size={11} /> {data.splitNote}</span>
            </div>
          )}
        >
          <ForecastChart points={data?.points ?? []} height={330} />
        </ChartCard>
      </Reveal>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <Reveal>
          <Panel title="High-risk demand periods" subtitle="Forecast breaches vs prepared capacity">
            <DataTable
              columns={riskCols} rows={data?.highRiskPeriods ?? []}
              loading={fc.status === 'loading'} error={fc.status === 'error' ? fc.error : null}
              onRetry={fc.reload} rowKey={(r) => r.date} pageSize={6}
              emptyMessage="No high-risk periods in this horizon."
              exportName="dineiq-high-risk-periods"
            />
          </Panel>
        </Reveal>
        <Reveal delay={0.05}>
          <Panel title="Actual vs predicted" subtitle="Most recent evaluated days (time-aware holdout)">
            <DataTable
              columns={avpCols} rows={actualVsPred}
              loading={fc.status === 'loading'} error={fc.status === 'error' ? fc.error : null}
              onRetry={fc.reload} rowKey={(r) => r.date ?? ''} pageSize={6}
              exportName="dineiq-forecast-accuracy"
            />
          </Panel>
        </Reveal>
      </div>

      <div style={{ marginTop: 16 }}>
        <AnalyticNarrative narrative={data?.narrative} />
      </div>

      {data && (
        <div className="chip info" style={{ marginTop: 14 }}>
          <Clock size={12} /> {data.splitNote}
        </div>
      )}
    </div>
  );
}
