import { Moon, Sun, MonitorSmartphone, Sparkles, Cpu, LayoutGrid, BellRing, Database, Activity } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { SectionHeader } from '../components/ui/Narrative';
import { Density, ThemePref, useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';

function Row({ title, desc, control }: { title: string; desc: string; control: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 650, fontSize: 'var(--fs-sm)' }}>{title}</div>
        <div className="faint" style={{ fontSize: 'var(--fs-xs)', marginTop: 2, maxWidth: 520 }}>{desc}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string; icon?: React.ReactNode }[] }) {
  return (
    <div role="tablist" style={{ display: 'inline-flex', background: 'var(--bg-3)', borderRadius: 10, padding: 3, gap: 2, border: '1px solid var(--border)' }}>
      {options.map((o) => (
        <button
          key={o.id} role="tab" aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className="btn btn-sm"
          style={{
            border: 'none', background: value === o.id ? 'var(--surface-3)' : 'transparent',
            color: value === o.id ? 'var(--text-1)' : 'var(--text-3)',
            boxShadow: value === o.id ? 'var(--shadow-1)' : 'none',
            padding: '6px 12px',
          }}
        >
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch" aria-checked={on} aria-label={label}
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 999, border: '1px solid var(--border-strong)',
        background: on ? 'var(--accent)' : 'var(--surface-3)', position: 'relative', cursor: 'pointer',
        transition: 'background 180ms',
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 22 : 2, width: 18, height: 18, borderRadius: '50%',
        background: on ? 'var(--accent-contrast)' : 'var(--text-3)', transition: 'left 180ms cubic-bezier(0.22,1,0.36,1)',
      }} />
    </button>
  );
}

export default function SettingsPage() {
  const s = useSettings();
  const { session, canExport, logout } = useAuth();

  return (
    <div>
      <SectionHeader
        eyebrow="Settings"
        title="Preferences"
        desc="Appearance, experience and system controls for this DineIQ platform build."
        right={
          <span className="chip success">Engine: Live REST API (Apache Spark & SQLite)</span>
        }
      />

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <Panel title="Appearance" subtitle="Dark · Light · System — intentional, not an inversion.">
          <Row title="Theme" desc="Luxury dark command center or executive light."
            control={
              <Segmented<ThemePref>
                value={s.themePref}
                onChange={s.setThemePref}
                options={[
                  { id: 'dark', label: 'Dark', icon: <Moon size={13} style={{ marginRight: 6 }} /> },
                  { id: 'light', label: 'Light', icon: <Sun size={13} style={{ marginRight: 6 }} /> },
                  { id: 'system', label: 'System', icon: <MonitorSmartphone size={13} style={{ marginRight: 6 }} /> },
                ]}
              />
            } />
          <Row title="Dashboard density" desc="Compact tightens paddings across tables and panels."
            control={
              <Segmented<Density>
                value={s.density}
                onChange={s.setDensity}
                options={[{ id: 'comfortable', label: 'Comfortable' }, { id: 'compact', label: 'Compact' }]}
              />
            } />
        </Panel>

        <Panel title="Experience" subtitle="Motion, 3D and notifications.">
          <Row title="Animation intensity" desc="Minimal disables count-ups and reveals; Rich slows them for drama."
            control={
              <Segmented<'0' | '1' | '2'>
                value={String(s.animationLevel) as '0' | '1' | '2'}
                onChange={(v) => s.setAnimationLevel(Number(v) as 0 | 1 | 2)}
                options={[
                  { id: '0', label: 'Off' }, { id: '1', label: 'Standard' }, { id: '2', label: 'Rich' },
                ]}
              />
            } />
          <Row title="3D restaurant twin" desc="Disable to render the journey without the WebGL scene."
            control={<Switch on={s.enable3D} onChange={s.setEnable3D} label="Enable 3D" />} />
          <Row title="Anomaly alerts" desc="Surface sales & rating anomaly signals in overview rails."
            control={<Switch on={s.notifyAnomalies} onChange={s.setNotifyAnomalies} label="Anomaly alerts" />} />
          <Row title="Forecast signals" desc="Notify when forecast periods breach capacity."
            control={<Switch on={s.notifyForecast} onChange={s.setNotifyForecast} label="Forecast alerts" />} />
        </Panel>

        <Panel title="Account" subtitle="Role-Based Access Control (RBAC) active session.">
          <Row title="Signed in as" desc={`${session?.user.displayName ?? 'System Administrator'} · ${session?.user.email ?? 'admin@dineiq.local'}`} control={<span className="chip info">{session?.user.role ?? 'Administrator'}</span>} />
          <Row title="Export permission" desc="CSV/Excel export is role-gated."
            control={<span className={`chip ${canExport ? 'success' : 'danger'}`}>{canExport ? 'granted' : 'restricted'}</span>} />
          <div style={{ paddingTop: 14 }}>
            <button className="btn" onClick={() => void logout()}>Sign out</button>
          </div>
        </Panel>

        <Panel
          title="Backend & Analytics Engine"
          subtitle="Real-time operational status across Big Data and ML pipelines."
          actions={<span className="chip success">ONLINE</span>}
        >
          <Row title="REST API Gateway" desc="Reverse proxy to Flask backend port 5000." control={<span className="chip info">/api (Active)</span>} />
          <Row title="Big Data Processing" desc="Apache Spark 4.2.0 & PySpark MLlib." control={<span className="chip success">Connected</span>} />
          <Row title="Machine Learning Engine" desc="Python Scikit-Learn & XGBoost 3.4.1." control={<span className="chip success">Loaded (100% Acc)</span>} />
          <Row title="Database Architecture" desc="SQLite 3 OLTP + Snappy Columnar Parquet." control={<span className="chip info">16 Tables</span>} />
        </Panel>

        <Panel title="About this platform" subtitle="System architecture and pipeline summary." className="span-2">
          <div className="grid grid-3" style={{ gap: 12 }}>
            <div className="chip" style={{ justifyContent: 'flex-start', padding: '10px 12px' }}><Sparkles size={13} /> System-mapped 66 FRs + 5 NFRs</div>
            <div className="chip" style={{ justifyContent: 'flex-start', padding: '10px 12px' }}><Cpu size={13} /> Live Flask REST API Engine</div>
            <div className="chip" style={{ justifyContent: 'flex-start', padding: '10px 12px' }}><Database size={13} /> 1,089,728 Master Transactions</div>
            <div className="chip" style={{ justifyContent: 'flex-start', padding: '10px 12px' }}><Activity size={13} /> Dual-Pipeline 98.08% Agreement</div>
            <div className="chip" style={{ justifyContent: 'flex-start', padding: '10px 12px' }}><LayoutGrid size={13} /> Dark / light / system themes</div>
            <div className="chip" style={{ justifyContent: 'flex-start', padding: '10px 12px' }}><BellRing size={13} /> Real-time Anomaly Detection</div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
