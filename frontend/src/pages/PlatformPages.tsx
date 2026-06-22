import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarClock, CheckCircle, Clipboard, Download, KeyRound, Link2, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { apiKeyApi, auditApi, notificationApi, orgApi, scheduleApi, webhookApi, workflowApi } from '../api/endpoints';
import { Button, Card, EmptyState, Input, Modal, SkeletonCards, StatusBadge } from '../components/ui';
import { CronBuilder } from '../components/workflow/CronBuilder';
import { countdown, cronDescription, formatRelative } from '../utils';
import { useToast } from '../components/ui/Toast';
import type { ApiKey, AuditLog, Notification, ScheduleEntry, TeamMember, WebhookResponse } from '../types';

function Page({ title, subtitle, children, action }: { title: string; subtitle: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm outline-none normal-case tracking-normal" style={{ background: 'var(--forge-surface-2)', border: '1px solid var(--forge-border)', color: 'var(--forge-text)' }}>
        {children}
      </select>
    </label>
  );
}

export function WebhooksPage() {
  const qc = useQueryClient();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ workflowId: '', name: '' });
  const { data: workflows = [] } = useQuery({ queryKey: ['workflows'], queryFn: workflowApi.list });
  const { data: webhooks = [], isLoading } = useQuery({ queryKey: ['webhooks'], queryFn: webhookApi.list });
  const create = useMutation({
    mutationFn: () => webhookApi.create({ workflowId: Number(form.workflowId), name: form.name, workflowName: workflows.find((w) => w.id === Number(form.workflowId))?.name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); setOpen(false); setForm({ workflowId: '', name: '' }); pushToast({ kind: 'success', title: 'Webhook created' }); },
  });
  const remove = useMutation({ mutationFn: webhookApi.delete, onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); setDeleteId(null); pushToast({ kind: 'success', title: 'Webhook deleted' }); } });
  const regen = useMutation({ mutationFn: webhookApi.regenerateSecret, onSuccess: () => { qc.invalidateQueries({ queryKey: ['webhooks'] }); pushToast({ kind: 'success', title: 'Webhook secret regenerated' }); } });

  async function copyUrl(item: WebhookResponse) {
    await navigator.clipboard.writeText(item.url);
    pushToast({ kind: 'success', title: 'Webhook URL copied' });
  }

  return (
    <Page title="Webhooks" subtitle="Inbound trigger endpoints for workflows" action={<Button onClick={() => setOpen(true)}><Plus size={14} />New Webhook</Button>}>
      {isLoading ? <SkeletonCards /> : webhooks.length === 0 ? <EmptyState icon={<Link2 size={44} />} title="No webhooks" description="Create an inbound endpoint for a workflow" /> : (
        <div className="grid gap-3">
          {webhooks.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{item.workflowName} · {item.hitCount} hits · Last {item.lastTriggeredAt ? formatRelative(item.lastTriggeredAt) : 'never'}</p>
                  <code className="mt-3 block truncate rounded-lg px-3 py-2 text-xs text-slate-400" style={{ background: 'var(--forge-surface-2)', border: '1px solid var(--forge-border)' }}>{item.url}</code>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => copyUrl(item)}><Clipboard size={13} />Copy URL</Button>
                  <Button size="sm" variant="ghost" onClick={() => regen.mutate(item.id)}>Regenerate</Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteId(item.id)}><Trash2 size={13} /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Create Webhook">
        <form className="p-6 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <SelectField label="Workflow" value={form.workflowId} onChange={(workflowId) => setForm((f) => ({ ...f, workflowId }))}>
            <option value="">Select workflow</option>
            {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{workflow.name}</option>)}
          </SelectField>
          <div className="flex justify-end gap-2"><Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button loading={create.isPending} disabled={!form.name || !form.workflowId}>Create</Button></div>
        </form>
      </Modal>
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Webhook">
        <div className="p-6"><p className="text-sm text-slate-400 mb-4">This webhook endpoint will stop accepting inbound triggers.</p><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button><Button variant="danger" onClick={() => deleteId && remove.mutate(deleteId)}>Delete</Button></div></div>
      </Modal>
    </Page>
  );
}

export function SchedulerPage() {
  const qc = useQueryClient();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ workflowId: '', cronExpression: '0 9 * * *', enabled: true });
  const { data: workflows = [] } = useQuery({ queryKey: ['workflows'], queryFn: workflowApi.list });
  const { data: schedules = [], isLoading } = useQuery({ queryKey: ['schedules'], queryFn: scheduleApi.list });
  const create = useMutation({
    mutationFn: () => scheduleApi.create({ ...form, workflowId: Number(form.workflowId), workflowName: workflows.find((w) => w.id === Number(form.workflowId))?.name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedules'] }); setOpen(false); pushToast({ kind: 'success', title: 'Schedule created' }); },
  });
  const update = useMutation({ mutationFn: (entry: ScheduleEntry) => scheduleApi.update(entry.id, entry), onSuccess: () => qc.invalidateQueries({ queryKey: ['schedules'] }) });
  const remove = useMutation({ mutationFn: scheduleApi.delete, onSuccess: () => { qc.invalidateQueries({ queryKey: ['schedules'] }); pushToast({ kind: 'success', title: 'Schedule deleted' }); } });
  return (
    <Page title="Scheduler" subtitle="Cron-based workflow automation" action={<Button onClick={() => setOpen(true)}><Plus size={14} />New Schedule</Button>}>
      {isLoading ? <SkeletonCards /> : schedules.length === 0 ? <EmptyState icon={<CalendarClock size={44} />} title="No schedules" description="Create a cron schedule for a workflow" /> : (
        <div className="grid gap-3">
          {schedules.map((entry) => (
            <Card key={entry.id} className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">{entry.workflowName}</h3>
                  <p className="text-xs text-slate-500 mt-1"><code>{entry.cronExpression}</code> · {cronDescription(entry.cronExpression)} · next in {countdown(entry.nextRunAt)}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">Last run {entry.lastRunAt ? formatRelative(entry.lastRunAt) : 'never'} {entry.lastStatus && <StatusBadge status={entry.lastStatus} />}</div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={entry.enabled} onChange={() => update.mutate({ ...entry, enabled: !entry.enabled })} />Enabled</label>
                  <Button size="sm" variant="danger" onClick={() => remove.mutate(entry.id)}><Trash2 size={13} /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Create Schedule" width="640px">
        <form className="p-6 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <SelectField label="Workflow" value={form.workflowId} onChange={(workflowId) => setForm((f) => ({ ...f, workflowId }))}><option value="">Select workflow</option>{workflows.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</SelectField>
          <Input label="Cron expression" value={form.cronExpression} onChange={(e) => setForm((f) => ({ ...f, cronExpression: e.target.value }))} />
          <CronBuilder value={form.cronExpression} onChange={(cronExpression) => setForm((f) => ({ ...f, cronExpression }))} />
          <label className="flex items-center gap-2 text-sm text-slate-400"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} /> Enabled</label>
          <div className="flex justify-end gap-2"><Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!form.workflowId} loading={create.isPending}>Create</Button></div>
        </form>
      </Modal>
    </Page>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('ALL');
  const { data: notifications = [], isLoading } = useQuery({ queryKey: ['notifications'], queryFn: notificationApi.list });
  const read = useMutation({ mutationFn: notificationApi.read, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  const readAll = useMutation({ mutationFn: notificationApi.readAll, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) });
  const filtered = notifications.filter((item) => filter === 'ALL' || item.type === filter);
  function open(item: Notification) {
    read.mutate(item.id);
    if (item.executionId) navigate(`/executions/${item.executionId}`);
  }
  return (
    <Page title="Notifications" subtitle="Workflow events and workspace alerts" action={<Button variant="outline" onClick={() => readAll.mutate()}><CheckCircle size={14} />Mark all read</Button>}>
      <div className="mb-4 flex gap-2">{['ALL', 'FAILURE', 'SUCCESS', 'WARNING', 'INFO'].map((item) => <Button key={item} size="sm" variant={filter === item ? 'primary' : 'outline'} onClick={() => setFilter(item)}>{item}</Button>)}</div>
      {isLoading ? <SkeletonCards /> : filtered.length === 0 ? <EmptyState icon={<Bell size={44} />} title="No notifications" description="There is nothing to review right now" /> : (
        <div className="grid gap-3">{filtered.map((item) => <Card key={item.id} className="p-5 cursor-pointer hover:border-indigo-500/30" onClick={() => open(item)}><div className="flex items-start justify-between"><div><h3 className="text-sm font-semibold text-white">{!item.read && <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: 'var(--forge-accent)' }} />}{item.title}</h3><p className="mt-1 text-sm text-slate-400">{item.message}</p></div><span className="text-xs text-slate-500">{formatRelative(item.createdAt)}</span></div></Card>)}</div>
      )}
    </Page>
  );
}

export function AuditPage() {
  const [filters, setFilters] = useState({ resourceType: '', from: '', to: '' });
  const [expanded, setExpanded] = useState<number | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ['audit', filters], queryFn: () => auditApi.list({ ...filters, page: 0, size: 50 }) });
  const rows = data?.content || [];
  function exportCsv() {
    const header = 'timestamp,user,action,resource,metadata';
    const body = rows.map((row: AuditLog) => [row.createdAt, row.userEmail, row.action, row.resourceName, row.metadata || ''].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`${header}\n${body}`], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agentrix-audit.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Page title="Audit Log" subtitle="A read-only record of workspace activity" action={<Button variant="outline" onClick={exportCsv}><Download size={14} />Export CSV</Button>}>
      <Card className="p-4 mb-4"><div className="grid grid-cols-3 gap-3"><SelectField label="Resource" value={filters.resourceType} onChange={(resourceType) => setFilters((f) => ({ ...f, resourceType }))}><option value="">All resources</option>{['WORKFLOW', 'EXECUTION', 'WEBHOOK', 'USER', 'APIKEY'].map((type) => <option key={type} value={type}>{type}</option>)}</SelectField><Input type="date" label="From" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} /><Input type="date" label="To" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} /></div></Card>
      {isLoading ? <SkeletonCards /> : rows.length === 0 ? <EmptyState icon={<ShieldCheck size={44} />} title="No audit records" description="Try adjusting the filters" /> : (
        <Card className="overflow-hidden"><table className="w-full text-left text-sm"><thead style={{ background: 'var(--forge-surface-2)' }}><tr className="text-xs uppercase text-slate-500"><th className="p-3">Time</th><th>User</th><th>Action</th><th>Resource</th><th>Metadata</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} onClick={() => setExpanded(expanded === row.id ? null : row.id)} className="cursor-pointer border-t border-slate-800 text-slate-300"><td className="p-3">{formatRelative(row.createdAt)}</td><td>{row.userEmail}</td><td>{row.action}</td><td>{row.resourceName}</td><td className="p-3"><code className="text-xs text-slate-500">{expanded === row.id ? row.metadata : (row.metadata || '').slice(0, 40)}</code></td></tr>)}</tbody></table></Card>
      )}
    </Page>
  );
}

export function ApiKeysPanel() {
  const qc = useQueryClient();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState('');
  const [form, setForm] = useState({ name: '', expiresAt: '' });
  const { data: keys = [], isLoading } = useQuery({ queryKey: ['apiKeys'], queryFn: apiKeyApi.list });
  const create = useMutation({ mutationFn: () => apiKeyApi.create({ name: form.name, expiresAt: form.expiresAt || undefined }), onSuccess: (key) => { qc.invalidateQueries({ queryKey: ['apiKeys'] }); setCreated(key.fullKey); pushToast({ kind: 'success', title: 'API key created' }); } });
  const remove = useMutation({ mutationFn: apiKeyApi.delete, onSuccess: () => { qc.invalidateQueries({ queryKey: ['apiKeys'] }); pushToast({ kind: 'success', title: 'API key revoked' }); } });
  return (
    <Card>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--forge-border)' }}><div className="flex items-center gap-2"><KeyRound size={14} style={{ color: '#818cf8' }} /><h2 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-sm font-semibold text-white">API Keys</h2></div><Button size="sm" onClick={() => setOpen(true)}><Plus size={13} />Create API Key</Button></div>
      <div className="p-5">{isLoading ? <SkeletonCards count={2} /> : keys.map((key: ApiKey) => <div key={key.id} className="flex items-center justify-between border-b border-slate-800 py-3 last:border-b-0"><div><p className="text-sm font-medium text-white">{key.name}</p><p className="text-xs text-slate-500">{key.keyPrefix} · Last used {key.lastUsedAt ? formatRelative(key.lastUsedAt) : 'never'}</p></div><Button size="sm" variant="danger" onClick={() => remove.mutate(key.id)}>Revoke</Button></div>)}</div>
      <Modal open={open} onClose={() => { setOpen(false); setCreated(''); }} title="Create API Key">
        <div className="p-6 flex flex-col gap-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input type="date" label="Expiry (optional)" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
          {created && <div className="rounded-lg p-3" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}><p className="text-xs text-yellow-400 mb-2">This key will not be shown again.</p><code className="block break-all text-xs text-white">{created}</code><Button className="mt-3" size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(created)}>Copy</Button></div>}
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Close</Button><Button disabled={!form.name} loading={create.isPending} onClick={() => create.mutate()}>Create</Button></div>
        </div>
      </Modal>
    </Card>
  );
}

export function TeamPage() {
  const qc = useQueryClient();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [invite, setInvite] = useState({ email: '', role: 'USER' as 'ADMIN' | 'USER' });
  const { data: org } = useQuery({ queryKey: ['org'], queryFn: orgApi.get });
  const { data: members = [], isLoading } = useQuery({ queryKey: ['members'], queryFn: orgApi.members });
  const inviteMut = useMutation({ mutationFn: () => orgApi.invite(invite), onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); qc.invalidateQueries({ queryKey: ['org'] }); setOpen(false); pushToast({ kind: 'success', title: 'Member invited' }); } });
  const roleMut = useMutation({ mutationFn: (m: TeamMember) => orgApi.updateRole(m.id, m.role), onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }) });
  const remove = useMutation({ mutationFn: orgApi.delete, onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); qc.invalidateQueries({ queryKey: ['org'] }); pushToast({ kind: 'success', title: 'Member removed' }); } });
  return (
    <Page title="Team" subtitle="Organization members and roles" action={<Button onClick={() => setOpen(true)}><Plus size={14} />Invite Member</Button>}>
      <Card className="p-5 mb-4"><div className="flex items-center gap-3"><Users size={18} style={{ color: 'var(--forge-accent)' }} /><div><h2 className="text-sm font-semibold text-white">{org?.name}</h2><p className="text-xs text-slate-500">{org?.memberCount} members · Created {org ? formatRelative(org.createdAt) : ''}</p></div></div></Card>
      {isLoading ? <SkeletonCards /> : <Card className="overflow-hidden"><table className="w-full text-left text-sm"><tbody>{members.map((member) => <tr key={member.id} className={`border-t border-slate-800 ${member.id === 1 ? 'bg-indigo-500/5' : ''}`}><td className="p-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-xs text-white">{member.fullName.split(' ').map((p) => p[0]).join('')}</div><div><p className="font-medium text-white">{member.fullName}{member.id === 1 && <span className="ml-2 text-xs text-indigo-400">You</span>}</p><p className="text-xs text-slate-500">{member.email}</p></div></div></td><td><select value={member.role} onChange={(e) => roleMut.mutate({ ...member, role: e.target.value as 'ADMIN' | 'USER' })} disabled={member.id === 1} className="rounded-lg px-2 py-1 text-xs" style={{ background: 'var(--forge-surface-2)', border: '1px solid var(--forge-border)', color: 'var(--forge-text)' }}><option value="ADMIN">ADMIN</option><option value="USER">USER</option></select></td><td className="text-xs text-slate-500">Joined {formatRelative(member.joinedAt)}</td><td className="p-4 text-right"><Button size="sm" variant="danger" disabled={member.id === 1} onClick={() => remove.mutate(member.id)}>Remove</Button></td></tr>)}</tbody></table></Card>}
      <Modal open={open} onClose={() => setOpen(false)} title="Invite Member"><form className="p-6 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); inviteMut.mutate(); }}><Input type="email" label="Email" value={invite.email} onChange={(e) => setInvite((f) => ({ ...f, email: e.target.value }))} required /><SelectField label="Role" value={invite.role} onChange={(role) => setInvite((f) => ({ ...f, role: role as 'ADMIN' | 'USER' }))}><option value="USER">USER</option><option value="ADMIN">ADMIN</option></SelectField><div className="flex justify-end gap-2"><Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button loading={inviteMut.isPending}>Invite</Button></div></form></Modal>
    </Page>
  );
}
