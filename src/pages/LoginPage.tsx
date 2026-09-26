import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { DineIQLogo } from '../components/DineIQLogo';

const PREVIEW_KPIS = [
  { label: 'Revenue', value: '₨ 5.84 Cr', delta: '+8.4%' },
  { label: 'Orders', value: '186,430', delta: '+6.2%' },
  { label: 'Menu class agreement', value: '90.8%', delta: 'Spark ↔ Python' },
  { label: 'Critical actions', value: '7', delta: 'evidence-backed' },
];

export default function LoginPage() {
  const { session, login, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && session) return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      nav('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(360px, 0.85fr)' }} className="login-grid">
      {/* brand / preview */}
      <section style={{
        position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: 'clamp(28px, 5vw, 64px)', overflow: 'hidden',
        background:
          'radial-gradient(900px 500px at 12% 0%, rgba(217,164,65,0.12), transparent 60%),' +
          'radial-gradient(800px 500px at 90% 90%, rgba(91,140,255,0.14), transparent 60%),' +
          'linear-gradient(160deg, var(--bg-1), var(--bg-0))',
        borderRight: '1px solid var(--border)',
      }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: 'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)', backgroundSize: '44px 44px', maskImage: 'radial-gradient(circle at 50% 40%, #000 30%, transparent 78%)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <DineIQLogo mode="icon" size={44} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem' }}>
              Dine<span style={{ color: 'var(--accent)' }}>IQ</span> Analytics
            </div>
            <div className="eyebrow" style={{ letterSpacing: '0.26em', fontSize: 9.5 }}>RESTAURANT INTELLIGENCE COMMAND CENTER</div>
          </div>
        </div>

        <div style={{ position: 'relative', maxWidth: 620 }}>
          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{ fontSize: 'var(--fs-display)', lineHeight: 1.06, letterSpacing: '-0.03em' }}
          >
            What happened.<br />
            <span style={{ color: 'var(--accent)' }}>Why.</span> What&apos;s next.
          </motion.h1>
          <p className="muted" style={{ marginTop: 18, maxWidth: 520, fontSize: 'var(--fs-sm)' }}>
            Big Data + dual ML pipelines (Spark MLlib ↔ Python DS) across menu, customer, pricing,
            wastage and forecast intelligence — presented as decisions, not just charts.
          </p>

          <div className="grid grid-2" style={{ marginTop: 30, maxWidth: 520 }}>
            {PREVIEW_KPIS.map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.09, duration: 0.6 }}
                className="panel panel-pad"
                style={{ padding: 14 }}
              >
                <div className="eyebrow" style={{ fontSize: 9 }}>{k.label}</div>
                <div className="tabular" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginTop: 4 }}>{k.value}</div>
                <div className="faint" style={{ fontSize: 10.5, marginTop: 2 }}>{k.delta}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="faint" style={{ fontSize: 10, letterSpacing: '0.14em', position: 'relative' }}>
          ENTERPRISE REST UI · ENTERPRISE REST API · VERIFIED DATA
        </div>
      </section>

      {/* form */}
      <section style={{ display: 'grid', placeItems: 'center', padding: 'clamp(24px, 4vw, 56px)', background: 'var(--bg-0)' }}>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 400 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Secure sign-in</div>
          <h2 style={{ fontSize: 'var(--fs-h1)', marginBottom: 6 }}>Welcome back</h2>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 26 }}>
            Managers, analysts, regional managers &amp; administrators — role-based access.
          </p>

          <div style={{ display: 'grid', gap: 14 }}>
            <label className="field">
              Username or Email
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input className="input" style={{ paddingLeft: 36 }} type="text" required autoComplete="username"
                  value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin or you@restaurant.com" />
              </div>
            </label>
            <label className="field">
              Password
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input className="input" style={{ paddingLeft: 36 }} type="password" required autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
            </label>
          </div>

          {error && (
            <div role="alert" className="chip danger" style={{ marginTop: 14, padding: '8px 12px', width: '100%', justifyContent: 'flex-start' }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary" disabled={busy} style={{ width: '100%', marginTop: 18, padding: '12px 16px' }}>
            {busy ? <span className="spinner" style={{ borderTopColor: 'var(--accent-contrast)' }} /> : <ArrowRight size={16} />}
            {busy ? 'Signing in…' : 'Enter command center'}
          </button>
        </form>
      </section>
    </div>
  );
}
