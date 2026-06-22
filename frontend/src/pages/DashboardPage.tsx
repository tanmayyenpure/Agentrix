import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Workflow, Play, CheckCircle, ArrowRight, Plus, Zap, Sparkles, Cable } from 'lucide-react';
import { workflowApi } from '../api/endpoints';
import { Card, Button, Skeleton, SkeletonCards } from '../components/ui';
import { formatRelative } from '../utils';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowApi.list,
  });

  const activeCount = workflows.filter((w) => w.active).length;
  const recent = workflows.slice(0, 5);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-sm text-slate-500">Your automation workspace</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {isLoading ? Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5"><Skeleton className="h-20 rounded-lg" /></Card>
        )) : [
          { label: 'Total Workflows', value: workflows.length, icon: Workflow, color: '#6366f1' },
          { label: 'Active', value: activeCount, icon: Play, color: '#10b981' },
          { label: 'Drafts', value: workflows.length - activeCount, icon: CheckCircle, color: '#f59e0b' },
          { label: 'Node Types', value: 8, icon: Zap, color: '#0ea5e9' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{label}</p>
                <p style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-3xl font-bold text-white">{value}</p>
              </div>
              <div style={{ background: `${color}20`, border: `1px solid ${color}30` }} className="p-2 rounded-lg">
                <Icon size={18} style={{ color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--forge-border)' }}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-sm font-semibold text-white">Recent Workflows</h2>
              <Button size="sm" variant="ghost" onClick={() => navigate('/workflows')}>
                View all <ArrowRight size={12} />
              </Button>
            </div>
            <div>
              {isLoading ? (
                <div className="p-5">
                  <SkeletonCards count={3} />
                </div>
              ) : recent.length === 0 ? (
                <div className="p-10 flex flex-col items-center gap-3">
                  <Workflow size={32} style={{ color: 'var(--forge-muted)' }} className="opacity-40" />
                  <div className="text-center">
                    <p className="text-white text-sm font-medium">No workflows yet</p>
                    <p className="text-slate-500 text-xs mt-1">Build your first automation</p>
                  </div>
                  <Button size="sm" onClick={() => navigate('/workflows/new')}>
                    <Plus size={12} /> New workflow
                  </Button>
                </div>
              ) : (
                recent.map((wf, i) => (
                  <div key={wf.id}
                    style={{ borderBottom: i < recent.length - 1 ? '1px solid var(--forge-border)' : 'none' }}
                    className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() => navigate(`/workflows/${wf.id}`)}>
                    <div className="flex items-center gap-3">
                      <div style={{ background: wf.active ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', border: `1px solid ${wf.active ? '#10b98130' : '#64748b30'}` }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center">
                        <Workflow size={14} style={{ color: wf.active ? '#10b981' : '#64748b' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{wf.name}</p>
                        <p className="text-xs text-slate-500">{wf.nodes.length} nodes - {formatRelative(wf.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ background: wf.active ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.1)', color: wf.active ? '#10b981' : '#64748b', border: `1px solid ${wf.active ? '#10b98130' : '#64748b20'}` }}
                        className="text-xs px-2 py-0.5 rounded-full font-medium">
                        {wf.active ? 'Active' : 'Draft'}
                      </span>
                      <ArrowRight size={14} className="text-slate-600" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="p-5">
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-sm font-semibold text-white mb-3">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              <Button variant="primary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/workflows/new')}>
                <Plus size={14} /> New Workflow
              </Button>
              <Button variant="outline" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/workflows')}>
                <Workflow size={14} /> Browse Workflows
              </Button>
              <Button variant="outline" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/executions')}>
                <Play size={14} /> View Executions
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-sm font-semibold text-white mb-3">Node Types</h2>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Triggers', count: 3, color: '#7c3aed' },
                { label: 'Actions', count: 2, color: '#0ea5e9' },
                { label: 'Control Flow', count: 2, color: '#f59e0b' },
                { label: 'Data', count: 1, color: '#10b981' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div style={{ background: color }} className="w-2 h-2 rounded-full" />
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                  <span className="text-xs text-slate-500">{count}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(14,165,233,0.08))', border: '1px solid rgba(99,102,241,0.25)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} style={{ color: '#818cf8' }} />
              <span className="text-xs font-medium text-indigo-400">AI tools are ready</span>
            </div>
            <p className="text-xs text-slate-500">Generate workflow drafts, create agents, or install connector templates.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={() => navigate('/ai/generator')}>
                <Sparkles size={12} /> AI
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/integrations')}>
                <Cable size={12} /> Hub
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
