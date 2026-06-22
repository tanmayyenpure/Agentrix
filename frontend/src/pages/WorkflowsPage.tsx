import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Workflow, Search, Trash2, Edit, Play, ArrowRight, GitBranch } from 'lucide-react';
import { workflowApi, executionApi } from '../api/endpoints';
import { Card, Button, EmptyState, Modal, Input, Textarea, SkeletonCards } from '../components/ui';
import { formatRelative } from '../utils';

export function WorkflowsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowApi.list,
  });

  const createMut = useMutation({
    mutationFn: () => workflowApi.create({ name: form.name, description: form.description, nodes: [], edges: [] }),
    onSuccess: (wf) => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
      setCreateOpen(false);
      setForm({ name: '', description: '' });
      navigate(`/workflows/${wf.id}`);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => workflowApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workflows'] }); setDeleteId(null); },
  });

  const triggerMut = useMutation({
    mutationFn: (id: number) => executionApi.trigger(id),
    onSuccess: (exec) => navigate(`/executions/${exec.id}`),
  });

  const filtered = workflows.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    (w.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 max-w-6xl">
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-2xl font-bold text-white">Workflows</h1>
          <p className="text-sm text-slate-500 mt-0.5">{workflows.length} workflow{workflows.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> New Workflow
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-6xl mb-5">
        <div className="relative" style={{ maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--forge-muted)' }} />
          <input
            placeholder="Search workflows…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'var(--forge-surface)', border: '1px solid var(--forge-border)', color: 'var(--forge-text)', width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
          />
        </div>
      </div>

      <div className="max-w-6xl">
        {isLoading ? (
          <SkeletonCards count={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Workflow size={48} />}
            title={search ? 'No results found' : 'No workflows yet'}
            description={search ? 'Try a different search' : 'Create your first workflow to start automating'}
            action={!search ? <Button onClick={() => setCreateOpen(true)}><Plus size={14} />New Workflow</Button> : undefined}
          />
        ) : (
          <div className="grid gap-3">
            {filtered.map(wf => (
              <Card key={wf.id} className="p-5 hover:border-indigo-500/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/workflows/${wf.id}`)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div style={{ background: wf.active ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.12)', border: `1px solid ${wf.active ? '#10b98140' : '#6366f140'}` }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Workflow size={18} style={{ color: wf.active ? '#10b981' : '#818cf8' }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-white truncate">{wf.name}</h3>
                        <span style={{ background: wf.active ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.1)', color: wf.active ? '#10b981' : '#64748b', border: `1px solid ${wf.active ? '#10b98120' : '#64748b20'}` }}
                          className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                          {wf.active ? 'Active' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{wf.description || 'No description'}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-slate-600 flex items-center gap-1">
                          <GitBranch size={10} /> {wf.nodes.length} nodes
                        </span>
                        <span className="text-xs text-slate-600">v{wf.version}</span>
                        <span className="text-xs text-slate-600">Updated {formatRelative(wf.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost" onClick={() => triggerMut.mutate(wf.id)} title="Run now">
                      <Play size={13} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/workflows/${wf.id}`)} title="Edit">
                      <Edit size={13} />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleteId(wf.id)} title="Delete">
                      <Trash2 size={13} />
                    </Button>
                    <ArrowRight size={14} className="text-slate-600 ml-1" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Workflow">
        <form className="p-6 flex flex-col gap-4" onSubmit={e => { e.preventDefault(); createMut.mutate(); }}>
          <Input label="Name" placeholder="e.g. Daily Report Generator" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Textarea label="Description (optional)" placeholder="What does this workflow do?"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createMut.isPending} disabled={!form.name}>
              Create & Open Builder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Workflow">
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-slate-400">This will permanently delete the workflow and all its execution history. This can't be undone.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteMut.isPending} onClick={() => deleteId && deleteMut.mutate(deleteId)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
