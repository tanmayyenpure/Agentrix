import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Workflow, Play, Settings, LogOut, Sparkles, Link2, CalendarClock, Bell, Users, ShieldCheck, Bot, Cable, Hexagon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { notificationApi } from '../../api/endpoints';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workflows', icon: Workflow, label: 'Workflows' },
  { to: '/executions', icon: Play, label: 'Executions' },
  { to: '/webhooks', icon: Link2, label: 'Webhooks' },
  { to: '/scheduler', icon: CalendarClock, label: 'Scheduler' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/audit', icon: ShieldCheck, label: 'Audit Log' },
  { to: '/ai/generator', icon: Sparkles, label: 'AI Generator' },
  { to: '/ai/agents', icon: Bot, label: 'AI Agents' },
  { to: '/integrations', icon: Cable, label: 'Integrations' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { data: notifications = [] } = useQuery({ queryKey: ['notifications'], queryFn: notificationApi.list });
  const unread = notifications.filter((item) => !item.read).length;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside style={{ background: 'var(--forge-surface)', borderRight: '1px solid var(--forge-border)', width: '220px', minWidth: '220px' }}
      className="flex flex-col h-full">
      <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--forge-border)' }}>
        <div className="flex items-center gap-2.5">
          <div
            style={{
              background: 'radial-gradient(circle at 30% 25%, #67e8f9 0%, #6366f1 42%, #111827 100%)',
              boxShadow: '0 0 22px rgba(99,102,241,0.55), inset 0 0 14px rgba(255,255,255,0.18)',
              border: '1px solid rgba(125,211,252,0.55)',
            }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
          >
            <Hexagon size={22} className="text-white" />
            <Sparkles size={10} className="absolute right-1.5 top-1.5 text-cyan-200" />
          </div>
          <div>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-white font-bold text-lg leading-none">Agentrix</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 12px', borderRadius: '8px', textDecoration: 'none',
              fontSize: '14px', fontWeight: 500, transition: 'all 0.15s',
              background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: isActive ? '#818cf8' : '#64748b',
              borderLeft: isActive ? '2px solid #6366f1' : '2px solid transparent',
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 flex flex-col gap-1" style={{ borderTop: '1px solid var(--forge-border)' }}>
        <button onClick={() => navigate('/notifications')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px', fontWeight: 500, transition: 'all 0.15s' }}>
          <span className="relative inline-flex">
            <Bell size={16} />
            {unread > 0 && <span className="absolute -right-2 -top-2 rounded-full px-1 text-[10px] leading-4 text-white" style={{ background: 'var(--forge-red)' }}>{unread}</span>}
          </span>
          Alerts
        </button>
        <button onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '14px', fontWeight: 500, transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#64748b'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
