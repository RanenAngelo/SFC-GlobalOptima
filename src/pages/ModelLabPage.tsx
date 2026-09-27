import { useState } from 'react';
import { Cpu, GitCompareArrows, Sparkles } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { ChartCard } from '../components/ui/ChartCard';
import { AnalyticNarrative, SectionHeader } from '../components/ui/Narrative';
import { KpiTile, Reveal } from '../components/ui/Motion';
import { Donut } from '../components/charts/BasicCharts';
import { DataTable, Column } from '../components/ui/DataTable';
import { Chip, MatchBadge } from '../components/ui/Badges';
import { useAuth } from '../hooks/useAuth';
import { DualPipelineRow, ModelCandidate } from '../api/types';
import { fmtPctPlain } from '../utils/format';

export default function ModelLabPage() {
  const dp = useApi((f) => DineIQApi.getDualPipelineAnalytics(f));
  const [onlyMismatch, setOnlyMismatch] = useState(false);
  const { canExport } = useAuth();
  const data = dp.data;

  const rows = (data?.rows ?? []).filter((r) => !onlyMismatch || !r.match);

  const cols: Column<DualPipelineRow>[] = [
    { key: 'id', header: 'Record ID', value: (r) => r.recordId, render: (r) => <span className="mono" style={{ fontSize: 11.5 }}>{r.recordId}</span> },
    { key: 'actual', header: 'Actual class', value: (r) => r.actual, render: (r) => <span style={{ fontWeight: 650 }}>{r.actual}</span> },
    { key: 'spark', header: 'Spark MLlib', value: (r) => r.sparkResult,
      render: (r) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={11} style={{ color: 'var(--chart-1)' }} /> {r.sparkResult}
          {r.sparkConfidence !== undefined && <span className="faint" style={{ fontSize: 10 }}>{(r.sparkConfidence * 100).toFixed(0)}%</span>}
        </span>
      ) },
    { key: 'python', header: 'Python DS', value: (r) => r.pythonResult,
      render: (r) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={11} style={{ color: 'var(--chart-2)' }} /> {r.pythonResult}
          {r.pythonConfidence !== undefined && <span className="faint" style={{ fontSize: 10 }}>{(r.pythonConfidence * 100).toFixed(0)}%</span>}
        </span>
      ) },
    { key: 'match', header: 'Status', value: (r) => (r.match ? 1 : 0), render: (r) => <MatchBadge match={r.match} /> },
    { key: 'diff', header: 'Numeric diff', value: (r) => r.numericDiff ?? 0, align: 'right',
      render: (r) => <span className="tabular">{r.numericDiff !== undefined ? r.numericDiff.toFixed(3) : '—'}</span> },
    { key: 'expl', header: 'Explanation', value: (r) => r.explanation ?? '',
      render: (r) => r.explanation
        ? <span className="faint" style={{ fontSize: 11, display: 'block', maxWidth: 340 }}>{r.explanation}</span>
        : <span className="faint">agreement</span> },
  ];

  const candCols: Column<ModelCandidate>[] = [
    { key: 'pipe', header: 'Pipeline', value: (r) => r.pipeline,
      render: (r) => <Chip tone={r.pipeline === 'spark' ? 'accent' : 'info'}>{r.pipeline === 'spark' ? 'Spark MLlib' : 'Python DS'}</Chip> },
    { key: 'algo', header: 'Algorithm', value: (r) => r.algorithm, render: (r) => <span style={{ fontWeight: 650 }}>{r.algorithm}</span> },
    { key: 'ver', header: 'Model version', value: (r) => r.version, render: (r) => <span className="mono" style={{ fontSize: 11 }}>{r.version}</span> },
    { key: 'acc', header: 'Accuracy', value: (r) => r.accuracy, align: 'right', render: (r) => <span className="tabular">{fmtPctPlain(r.accuracy * 100)}</span> },
    { key: 'f1', header: 'Macro F1', value: (r) => r.f1 ?? 0, align: 'right',
      render: (r) => <span className="tabular" style={{ color: (r.f1 ?? 0) >= 0.8 ? 'var(--success)' : 'var(--warn)' }}>{r.f1?.toFixed(3) ?? '—'}</span> },
    { key: 'sel', header: 'Selected', value: (r) => (r.selected ? 1 : 0),
      render: (r) => r.selected ? <Chip tone="success">final</Chip> : <span className="faint">—</span> },
  ];

  return (
    <div>
      <SectionHeader
        eyebrow="Intelligence · Dual-Pipeline Verification"
        title="Model Lab · Spark ↔ Python"
        desc="Two independently trained pipelines, compared record by record. Predictions are generated separately — never copied between pipelines."
        right={<span className="chip accent"><GitCompareArrows size={12} /> dual-pipeline verification</span>}
      />

      <Reveal>
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <KpiTile label="Agreement" value={data?.agreementPct ?? 0} format={(v) => `${v.toFixed(1)}%`} foot="overall consistency" accent />
          <KpiTile label="Disagreements" value={data?.disagreementCount ?? 0} format={(v) => Math.round(v)} foot="explained individually" />
          <KpiTile label="Records compared" value={data?.comparedRecords ?? 0} format={(v) => Math.round(v)} foot="unseen holdout set" />
          <KpiTile label="Model candidates" value={data?.candidates.length ?? 0} format={(v) => Math.round(v)} foot="3+ candidates evaluated" />
        </div>
      </Reveal>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Reveal>
          <ChartCard
            title="Agreement donut" subtitle="Match vs mismatch across the compared set"
            loading={dp.status === 'loading'} error={dp.status === 'error' ? dp.error : null} onRetry={dp.reload}
            empty={!data || data.rows.length === 0} height={250}
          >
            <Donut
              data={data ? [{ name: 'Match', value: data.comparedRecords - data.disagreementCount }, { name: 'Mismatch', value: data.disagreementCount }] : []}
              height={250} format={(v) => String(v)}
            />
          </ChartCard>
        </Reveal>
        <Reveal delay={0.05}>
          <Panel title="Algorithm comparison" subtitle="≥3 algorithms trained per pipeline before final selection">
            <DataTable
              columns={candCols} rows={data?.candidates ?? []}
              loading={dp.status === 'loading'} error={dp.status === 'error' ? dp.error : null}
              onRetry={dp.reload} rowKey={(r) => `${r.pipeline}-${r.algorithm}`} pageSize={6}
              exportName="dineiq-model-comparison" canExport={canExport}
            />
          </Panel>
        </Reveal>
      </div>

      <Reveal>
        <Panel
          title="Record-level comparison report"
          subtitle="Record ID · actual · Spark · Python · match · numeric difference · explanation"
          pad={false}
          actions={
            <div style={{ display: 'inline-flex', gap: 6 }}>
              <button className={`btn btn-sm ${!onlyMismatch ? 'btn-primary' : ''}`} onClick={() => setOnlyMismatch(false)}>All</button>
              <button className={`btn btn-sm ${onlyMismatch ? 'btn-primary' : ''}`} onClick={() => setOnlyMismatch(true)}>Mismatches only</button>
            </div>
          }
        >
          <div style={{ padding: '4px 16px 16px' }}>
            <DataTable
              columns={cols} rows={rows}
              loading={dp.status === 'loading'} error={dp.status === 'error' ? dp.error : null}
              onRetry={dp.reload} rowKey={(r) => r.recordId} pageSize={10}
              emptyMessage={onlyMismatch ? 'No mismatches — full agreement on this filter.' : 'No data available for this selection.'}
              exportName="dineiq-dual-pipeline" canExport={canExport}
            />
          </div>
        </Panel>
      </Reveal>

      <div style={{ marginTop: 16 }}>
        <AnalyticNarrative narrative={data?.narrative} />
      </div>

      <div className="chip info" style={{ marginTop: 14, whiteSpace: 'normal', textAlign: 'left' }}>
        Independence guarantee: Spark predictions are never exported into the Python pipeline and vice versa — both engines read the same underlying records and produce their own outputs.
      </div>
    </div>
  );
}
