import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { DineIQApi } from '../api/DineIQApi';
import { Panel } from '../components/ui/Panel';
import { ChartCard } from '../components/ui/ChartCard';
import { AnalyticNarrative, SectionHeader } from '../components/ui/Narrative';
import { KpiTile, Reveal } from '../components/ui/Motion';
import { RankBars, TrendChart } from '../components/charts/BasicCharts';
import { DataTable, Column } from '../components/ui/DataTable';
import { Chip, PriorityBadge } from '../components/ui/Badges';
import { useAuth } from '../hooks/useAuth';
import { InventorySnapshot, WastageRiskRow, WastageTopItem } from '../api/types';
import { fmtCurrency, fmtInt, fmtPctPlain, titleCase } from '../utils/format';

export default function WastagePage() {
  const ws = useApi((f) => DineIQApi.getWastageAnalytics(f));
  const inv = useApi((f) => DineIQApi.getInventorySnapshot(f));
  const [dimension, setDimension] = useState<string>('category');
  const { canExport } = useAuth();
  const data = ws.data;

  const itemCols: Column<WastageTopItem>[] = [
    { key: 'name', header: 'Item', value: (r) => r.name, render: (r) => <span style={{ fontWeight: 650 }}>{r.name}</span> },
    { key: 'kg', header: 'Wasted (kg)', value: (r) => r.kg, align: 'right', render: (r) => <span className="tabular">{fmtInt(r.kg)}</span> },
    { key: 'cost', header: 'Cost', value: (r) => r.cost, align: 'right', render: (r) => <span className="tabular">{fmtCurrency(r.cost)}</span> },
    { key: 'pct', header: '% of prep', value: (r) => r.pctOfPrep, align: 'right',
      render: (r) => <Chip tone={r.pctOfPrep > 9 ? 'danger' : r.pctOfPrep > 6 ? 'warn' : 'success'}>{fmtPctPlain(r.pctOfPrep)}</Chip> },
    { key: 'trend', header: 'Trend', value: (r) => r.trendPct, align: 'right',
      render: (r) => <Chip tone={r.trendPct > 0 ? 'danger' : 'success'}>{r.trendPct > 0 ? '+' : ''}{r.trendPct}%</Chip> },
  ];

  const riskCols: Column<WastageRiskRow>[] = [
    { key: 'name', header: 'Target', value: (r) => r.name,
      render: (r) => (
        <div>
          <div style={{ fontWeight: 650 }}>{r.name}</div>
          <div className="faint" style={{ fontSize: 10.5 }}>{titleCase(r.scope)} scope</div>
        </div>
      ) },
    { key: 'risk', header: 'Risk score', value: (r) => r.riskScore, align: 'right',
      render: (r) => <span className={`chip ${r.riskScore >= 80 ? 'danger' : 'warn'}`}>{r.riskScore}</span> },
    { key: 'kg', header: 'Predicted waste', value: (r) => r.predictedKg, align: 'right', render: (r) => <span className="tabular">{fmtInt(r.predictedKg)} kg</span> },
    { key: 'drivers', header: 'Risk drivers', value: (r) => r.drivers.join(', '),
      render: (r) => <span className="faint" style={{ fontSize: 11 }}>{r.drivers.join(' · ')}</span> },
    { key: 'sev', header: 'Priority', value: (r) => r.riskScore,
      render: (r) => <PriorityBadge priority={r.riskScore >= 85 ? 'critical' : r.riskScore >= 70 ? 'high' : 'medium'} /> },
  ];

  const invCols: Column<InventorySnapshot>[] = [
    { key: 'item', header: 'Item', value: (r) => r.item, render: (r) => <span style={{ fontWeight: 600 }}>{r.item}</span> },
    { key: 'hand', header: 'On hand', value: (r) => r.onHand, align: 'right', render: (r) => <span className="tabular">{r.onHand} {r.unit}</span> },
    { key: 'dos', header: 'Days of supply', value: (r) => r.daysOfSupply, align: 'right', render: (r) => <span className="tabular">{r.daysOfSupply}</span> },
    { key: 'rop', header: 'Reorder point', value: (r) => r.reorderPoint, align: 'right', render: (r) => <span className="tabular">{r.reorderPoint}</span> },
    { key: 'st', header: 'Status', value: (r) => r.status,
      render: (r) => <Chip tone={r.status === 'ok' ? 'success' : r.status === 'low' ? 'warn' : 'danger'}>{r.status}</Chip> },
  ];

  const breakdown = data?.breakdowns.find((b) => b.dimension === dimension) ?? data?.breakdowns[0];

  return (
    <div>
      <SectionHeader
        eyebrow="Operations · Loss Prevention"
        title="Inventory & Wastage"
        desc="Wastage by every core dimension, predictive risk scores and inventory health."
        right={
          <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
            {(['category', 'day', 'location', 'period', 'demand', 'promotion', 'prep'] as const).map((d) => (
              <button key={d} className={`btn btn-sm ${dimension === d ? 'btn-primary' : ''}`} onClick={() => setDimension(d)}
                style={{ textTransform: 'capitalize' }}>
                {d}
              </button>
            ))}
          </div>
        }
      />

      <Reveal>
        <div className="grid grid-4" style={{ marginBottom: 16 }}>
          <KpiTile label="Total wastage" value={data?.summary.totalKg ?? 0} format={(v) => `${fmtInt(v)} kg`} foot="selected period" />
          <KpiTile label="Wastage cost" value={data?.summary.totalCost ?? 0} format={(v) => fmtCurrency(v)} foot="cost of waste" accent />
          <KpiTile label="% of prep" value={data?.summary.wastagePctOfPrep ?? 0} format={(v) => fmtPctPlain(v)} foot="prep → plate conversion" />
          <KpiTile label="High-risk targets" value={data?.risk.length ?? 0} format={(v) => Math.round(v)} foot="items · periods · locations" />
        </div>
      </Reveal>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Reveal>
          <ChartCard title="Wastage trend" subtitle="Daily wastage (kg)"
            loading={ws.status === 'loading'} error={ws.status === 'error' ? ws.error : null} onRetry={ws.reload}
            empty={!data || data.summary.trend.length === 0} height={240}>
            <TrendChart data={(data?.summary.trend ?? []) as never[]} xKey="date"
              series={[{ key: 'value', name: 'Wastage kg', color: 'var(--chart-5)' }]} format={(v) => fmtInt(v)} />
          </ChartCard>
        </Reveal>
        <Reveal delay={0.05}>
          <ChartCard title={`Wastage by ${dimension}`} subtitle="Where to intervene first"
            loading={ws.status === 'loading'} error={ws.status === 'error' ? ws.error : null} onRetry={ws.reload}
            empty={!breakdown || breakdown.rows.length === 0} height={240}>
            <RankBars data={(breakdown?.rows ?? []).map((r) => ({ name: r.label, value: r.kg }))}
              format={(v) => fmtInt(v)} height={240} colorIndex={4} />
          </ChartCard>
        </Reveal>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Reveal>
          <Panel title="High-wastage items" subtitle="Key items driving kitchen loss" pad={false}>
            <div style={{ padding: '4px 16px 16px' }}>
              <DataTable
                columns={itemCols} rows={data?.topItems ?? []}
                loading={ws.status === 'loading'} error={ws.status === 'error' ? ws.error : null}
                onRetry={ws.reload} rowKey={(r) => r.id} pageSize={6}
                exportName="dineiq-wastage-items" canExport={canExport}
              />
            </div>
          </Panel>
        </Reveal>
        <Reveal delay={0.05}>
          <Panel title="Wastage-risk predictions" subtitle="Model-predicted high-risk items, periods & locations" pad={false}
            actions={<Chip tone="warn">ML-generated</Chip>}>
            <div style={{ padding: '4px 16px 16px' }}>
              <DataTable
                columns={riskCols} rows={data?.risk ?? []}
                loading={ws.status === 'loading'} error={ws.status === 'error' ? ws.error : null}
                onRetry={ws.reload} rowKey={(r) => r.id} pageSize={6}
                exportName="dineiq-wastage-risk" canExport={canExport}
              />
            </div>
          </Panel>
        </Reveal>
      </div>

      <Reveal>
        <ChartCard title="High-wastage locations" subtitle="Top 12 branches by wasted kilograms"
          loading={ws.status === 'loading'} error={ws.status === 'error' ? ws.error : null} onRetry={ws.reload}
          empty={!data || data.byLocation.length === 0} height={300}>
          <RankBars data={(data?.byLocation ?? []).slice(0, 12).map((l) => ({ name: l.location, value: l.kg }))}
            format={(v) => fmtInt(v)} height={300} colorIndex={4} />
        </ChartCard>
      </Reveal>

      <Reveal>
        <Panel title="Inventory snapshot" subtitle="Stock health feeding the wastage & forecast models" style={{ marginTop: 16 }} pad={false}>
          <div style={{ padding: '4px 16px 16px' }}>
            <DataTable
              columns={invCols} rows={inv.data ?? []}
              loading={inv.status === 'loading'} error={inv.status === 'error' ? inv.error : null}
              onRetry={inv.reload} rowKey={(r) => r.id} pageSize={6}
              exportName="dineiq-inventory" canExport={canExport}
            />
          </div>
        </Panel>
      </Reveal>

      <div style={{ marginTop: 16 }}>
        <AnalyticNarrative narrative={data?.narrative} />
      </div>
    </div>
  );
}
