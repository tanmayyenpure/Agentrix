import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Hexagon, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../ui';

function AuthShell({ children, title, sub }: { children: React.ReactNode; title: string; sub: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--forge-bg)' }}>
      {/* BG glow */}
      <div style={{ position: 'fixed', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            style={{
              background: 'radial-gradient(circle at 30% 25%, #67e8f9 0%, #6366f1 42%, #111827 100%)',
              boxShadow: '0 0 32px rgba(99,102,241,0.65), inset 0 0 18px rgba(255,255,255,0.2)',
              border: '1px solid rgba(125,211,252,0.55)',
              marginBottom: '16px',
            }}
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
          >
            <Hexagon size={30} className="text-white" />
            <Sparkles size={13} className="absolute right-2 top-2 text-cyan-200" />
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{sub}</p>
        </div>

        <div style={{ background: 'var(--forge-surface)', border: '1px solid var(--forge-border)' }} className="rounded-2xl p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form);
      navigate('/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Welcome back" sub="Sign in to your workspace">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }} className="rounded-lg px-3 py-2.5 text-xs text-red-400">{error}</div>
        )}
        <Input label="Email" type="email" placeholder="you@example.com" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
        <div className="relative">
          <Input label="Password" type={showPw ? 'text' : 'password'} placeholder="••••••••"
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <button type="button" onClick={() => setShowPw(p => !p)}
            style={{ position: 'absolute', right: '12px', bottom: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--forge-muted)' }}>
            {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <Button type="submit" loading={loading} style={{ marginTop: '4px', justifyContent: 'center' }}>
          Sign in
        </Button>
      </form>
      <p className="text-center text-xs text-slate-500 mt-5">
        No account? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">Create one</Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(msg || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Create workspace" sub="Build once. Automate with Agentrix.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }} className="rounded-lg px-3 py-2.5 text-xs text-red-400">{error}</div>
        )}
        <Input label="Full name" placeholder="Tanmay Yenpure" value={form.fullName}
          onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required />
        <Input label="Email" type="email" placeholder="you@example.com" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
        <Input label="Password" type="password" placeholder="min. 6 characters"
          value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
        <Button type="submit" loading={loading} style={{ marginTop: '4px', justifyContent: 'center' }}>
          Create account
        </Button>
      </form>
      <p className="text-center text-xs text-slate-500 mt-5">
        Have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Sign in</Link>
      </p>
    </AuthShell>
  );
}

export function AcceptInvitePage() {
  const { acceptInvite } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ token: params.get('token') || '', fullName: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await acceptInvite(form);
      navigate('/');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : undefined;
      setError(msg || 'Invite activation failed. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Accept invite" sub="Activate your Agentrix account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }} className="rounded-lg px-3 py-2.5 text-xs text-red-400">{error}</div>
        )}
        <Input label="Invite token" value={form.token}
          onChange={e => setForm(f => ({ ...f, token: e.target.value }))} required />
        <Input label="Full name" value={form.fullName}
          onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required />
        <Input label="Password" type="password" placeholder="min. 6 characters"
          value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
        <Button type="submit" loading={loading} style={{ marginTop: '4px', justifyContent: 'center' }}>
          Activate account
        </Button>
      </form>
      <p className="text-center text-xs text-slate-500 mt-5">
        Already active? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">Sign in</Link>
      </p>
    </AuthShell>
  );
}
