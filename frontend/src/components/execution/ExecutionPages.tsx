import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Play, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { executionApi, workflowApi } from '../../api/endpoints';
import { Card, StatusBadge, EmptyState, Button, SkeletonCards } from '../ui';
import { formatRelative, formatDuration } from '../../utils';

// Single execution detail
export function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: exec, isLoading } = useQuery({
    queryKey: ['execution', id],
    queryFn: () => executionApi.get(Number(id)),
    refetchInterval: (query) => {
      const d = query.state.data;
      return d && ['RUNNING', 'PENDING'].includes(d.status) ? 1500 : false;
    },
  });

  if (isLoading) return <div className="p-8 max-w-4xl"><SkeletonCards count={4} /></div>;
  if (!exec) return null;

  const duration = exec.finishedAt && exec.startedAt
    ? formatDuration(new Date(exec.finishedAt).getTime() - new Date(exec.startedAt).getTime())
    : exec.status === 'RUNNING' ? 'Running…' : '—';

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
        <div style={{ width: '1px', height: '16px', background: 'var(--forge-border)' }} />
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-xl font-bold text-white">Execution #{exec.id}</h1>
        <StatusBadge status={exec.status} />
      </div>

      {/* Meta */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Started', value: formatRelative(exec.startedAt) },
          { label: 'Duration', value: duration },
          { label: 'Nodes run', value: `${exec.logs?.length ?? 0}` },
        ].map(({ label, value }) => (
          <Card key={label} className="px-4 py-3">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</p>
            <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
          </Card>
        ))}
      </div>

      {/* Input payload */}
      {exec.inputPayload && (
        <Card className="mb-4 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Input Payload</p>
          <pre style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--forge-text)', margin: 0, overflowX: 'auto' }}>
            {JSON.stringify(JSON.parse(exec.inputPayload || '{}'), null, 2)}
          </pre>
        </Card>
      )}

      {/* Error */}
      {exec.errorMessage && (
        <Card className="mb-4 p-4" style={{ borderColor: '#ef444440' }}>
          <p className="text-xs text-red-400 uppercase tracking-wide font-medium mb-2">Error</p>
          <p className="text-sm text-red-300">{exec.errorMessage}</p>
        </Card>
      )}

      {/* Logs */}
      <Card>
        <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--forge-border)' }}>
          <p style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-sm font-semibold text-white">Execution Logs</p>
        </div>
        <div>
          {(!exec.logs || exec.logs.length === 0) ? (
            <div className="p-8 text-center text-slate-500 text-sm">No logs yet</div>
          ) : exec.logs.map((log, i) => (
            <div key={log.id} style={{ borderBottom: i < exec.logs.length - 1 ? '1px solid var(--forge-border)' : 'none' }}
              className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {log.status === 'SUCCESS' ? <CheckCircle size={13} style={{ color: '#10b981' }} /> : <XCircle size={13} style={{ color: '#ef4444' }} />}
                  <span className="text-sm font-medium text-white">{log.nodeLabel}</span>
                  <span className="text-xs text-slate-600 font-mono">{log.nodeClientId}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={10} /> {formatDuration(log.durationMs)}
                  </span>
                  <StatusBadge status={log.status} />
                </div>
              </div>
              {log.output && (
                <pre style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--forge-muted)', margin: '4px 0 0 20px', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '6px', overflowX: 'auto' }}>
                  {log.output}
                </pre>
              )}
              {log.errorMessage && (
                <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', marginLeft: '20px' }}>{log.errorMessage}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Workflow executions list
export function WorkflowExecutionsPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();

  const { data: workflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => workflowApi.get(Number(workflowId)),
    enabled: !!workflowId,
  });

  const { data: executions = [], isLoading } = useQuery({
    queryKey: ['executions', workflowId],
    queryFn: () => executionApi.listForWorkflow(Number(workflowId)),
    enabled: !!workflowId,
    refetchInterval: 3000,
  });

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/workflows/${workflowId}`)}>← Builder</Button>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-xl font-bold text-white">
          {workflow?.name || 'Workflow'} — Runs
        </h1>
      </div>

      {isLoading ? (
        <SkeletonCards count={4} />
      ) : executions.length === 0 ? (
        <EmptyState icon={<Play size={40} />} title="No runs yet" description="Trigger this workflow to see executions" />
      ) : (
        <Card>
          {executions.map((exec, i) => (
            <div key={exec.id}
              style={{ borderBottom: i < executions.length - 1 ? '1px solid var(--forge-border)' : 'none' }}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-colors"
              onClick={() => navigate(`/executions/${exec.id}`)}>
              <div className="flex items-center gap-3">
                <StatusBadge status={exec.status} />
                <div>
                  <p className="text-sm font-medium text-white">Run #{exec.id}</p>
                  <p className="text-xs text-slate-500">{formatRelative(exec.startedAt)} · {exec.logs?.length ?? 0} nodes</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-600" />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// Global executions (cross-workflow)
export function ExecutionsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('ALL');
  const { data: workflows = [] } = useQuery({ queryKey: ['workflows'], queryFn: workflowApi.list });

  // For a global view, we aggregate executions from recent workflows (top 10)
  const recentWorkflows = workflows.slice(0, 10);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-2xl font-bold text-white">Executions</h1>
        <p className="text-sm text-slate-500 mt-0.5">Select a workflow to view its run history</p>
      </div>

      {workflows.length === 0 ? (
        <EmptyState icon={<Play size={40} />} title="No workflows yet" description="Create a workflow to start running it"
          action={<Button onClick={() => navigate('/workflows')}><Play size={14} /> Go to Workflows</Button>} />
      ) : (
        <Card>
          {workflows.map((wf, i) => (
            <div key={wf.id}
              style={{ borderBottom: i < workflows.length - 1 ? '1px solid var(--forge-border)' : 'none' }}
              className="px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-colors"
              onClick={() => navigate(`/workflows/${wf.id}/executions`)}>
              <div>
                <p className="text-sm font-medium text-white">{wf.name}</p>
                <p className="text-xs text-slate-500">{wf.nodes.length} nodes · updated {formatRelative(wf.updatedAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">View runs</span>
                <ArrowRight size={14} className="text-slate-600" />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
