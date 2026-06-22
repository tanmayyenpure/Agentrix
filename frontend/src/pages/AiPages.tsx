import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bot, BrainCircuit, Cable, Plus, Send, Sparkles, Trash2, Workflow } from 'lucide-react';
import { aiApi, connectorApi } from '../api/endpoints';
import { Button, Card, EmptyState, Input, Modal, SkeletonCards, Textarea } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import type { AiAgent, Connector, GeneratedWorkflowResponse } from '../types';

function Header({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

export function AiGeneratorPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [prompt, setPrompt] = useState('When a webhook receives a new lead, call the CRM API and log the result.');
  const [name, setName] = useState('');
  const [result, setResult] = useState<GeneratedWorkflowResponse | null>(null);
  const generate = useMutation({
    mutationFn: () => aiApi.generateWorkflow({ prompt, name: name || undefined, createWorkflow: true }),
    onSuccess: (data) => {
      setResult(data);
      pushToast({ kind: 'success', title: 'Workflow generated' });
    },
    onError: () => pushToast({ kind: 'error', title: 'Generation failed' }),
  });

  return (
    <div className="p-8 max-w-6xl">
      <Header title="AI Workflow Generator" subtitle="Describe an automation and generate a workflow draft" />
      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-6">
        <Card className="p-5">
          <div className="flex flex-col gap-4">
            <Input label="Workflow name (optional)" value={name} onChange={(e) => setName(e.target.value)} placeholder="Lead routing assistant" />
            <Textarea label="Automation prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={8} />
            <div className="flex justify-end">
              <Button loading={generate.isPending} disabled={!prompt.trim()} onClick={() => generate.mutate()}>
                <Sparkles size={14} /> Generate workflow
              </Button>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BrainCircuit size={16} style={{ color: 'var(--forge-accent)' }} />
            <h2 className="text-sm font-semibold text-white">Generated Draft</h2>
          </div>
          {!result ? (
            <p className="text-sm text-slate-500">Generated workflow details will appear here.</p>
          ) : (
            <div>
              <p className="text-sm font-semibold text-white">{result.name}</p>
              <p className="mt-1 text-xs text-slate-500">{result.summary}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg p-3" style={{ background: 'var(--forge-surface-2)' }}>
                  <p className="text-xs text-slate-500">Nodes</p>
                  <p className="text-xl font-bold text-white">{result.nodes.length}</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--forge-surface-2)' }}>
                  <p className="text-xs text-slate-500">Edges</p>
                  <p className="text-xl font-bold text-white">{result.edges.length}</p>
                </div>
              </div>
              {result.workflowId && (
                <Button className="mt-4 w-full justify-center" variant="outline" onClick={() => navigate(`/workflows/${result.workflowId}`)}>
                  <Workflow size={14} /> Open builder
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function AiAgentsPage() {
  const qc = useQueryClient();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [runAgent, setRunAgent] = useState<AiAgent | null>(null);
  const [runInput, setRunInput] = useState('');
  const [runOutput, setRunOutput] = useState('');
  const [form, setForm] = useState({ name: '', instructions: '', model: 'agentrix-pro-v1', enabled: true });
  const { data: agents = [], isLoading } = useQuery({ queryKey: ['aiAgents'], queryFn: aiApi.listAgents });
  const create = useMutation({
    mutationFn: () => aiApi.createAgent(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['aiAgents'] }); setOpen(false); setForm({ name: '', instructions: '', model: 'agentrix-pro-v1', enabled: true }); pushToast({ kind: 'success', title: 'Agent created' }); },
    onError: () => pushToast({ kind: 'error', title: 'Agent create failed' }),
  });
  const remove = useMutation({ mutationFn: aiApi.deleteAgent, onSuccess: () => { qc.invalidateQueries({ queryKey: ['aiAgents'] }); pushToast({ kind: 'success', title: 'Agent deleted' }); } });
  const runner = useMutation({
    mutationFn: () => aiApi.runAgent(runAgent!.id, runInput),
    onSuccess: (data) => setRunOutput(data.output),
  });

  return (
    <div className="p-8 max-w-6xl">
      <Header title="AI Agents" subtitle="Reusable automation helpers with task-specific instructions" action={<Button onClick={() => setOpen(true)}><Plus size={14} />New Agent</Button>} />
      {isLoading ? <SkeletonCards /> : agents.length === 0 ? (
        <EmptyState
          icon={<Bot size={44} />}
          title="No AI agents"
          description="Create an agent for triage, enrichment, summaries, or operations."
          action={<Button onClick={() => setOpen(true)}><Plus size={14} />New Agent</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{agent.model} · {agent.enabled ? 'Enabled' : 'Disabled'}</p>
                  <p className="mt-3 text-sm text-slate-400">{agent.instructions}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setRunAgent(agent); setRunOutput(''); }}>Run</Button>
                  <Button size="sm" variant="danger" onClick={() => remove.mutate(agent.id)}><Trash2 size={13} /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={open} onClose={() => setOpen(false)} title="Create AI Agent">
        <form className="p-6 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
          <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Input label="Model" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} />
          <Textarea label="Instructions" rows={5} value={form.instructions} onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))} required />
          <label className="flex items-center gap-2 text-sm text-slate-400"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} /> Enabled</label>
          <div className="flex justify-end gap-2"><Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button loading={create.isPending}>Create</Button></div>
        </form>
      </Modal>
      <Modal open={!!runAgent} onClose={() => setRunAgent(null)} title={`Run ${runAgent?.name || 'Agent'}`} width="640px">
        <div className="p-6 flex flex-col gap-4">
          <Textarea label="Input" rows={5} value={runInput} onChange={(e) => setRunInput(e.target.value)} />
          <div className="flex justify-end"><Button loading={runner.isPending} disabled={!runInput.trim()} onClick={() => runner.mutate()}><Send size={14} />Run agent</Button></div>
          {runOutput && <pre className="rounded-lg p-4 text-xs text-slate-300 whitespace-pre-wrap" style={{ background: 'var(--forge-surface-2)', border: '1px solid var(--forge-border)' }}>{runOutput}</pre>}
        </div>
      </Modal>
    </div>
  );
}

export function IntegrationHubPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const { data: connectors = [], isLoading } = useQuery({ queryKey: ['connectors'], queryFn: connectorApi.list });
  const [credentialOpen, setCredentialOpen] = useState<Connector | null>(null);
  const [credentialForm, setCredentialForm] = useState({ displayName: '', secret: '' });
  const install = useMutation({
    mutationFn: (connector: Connector) => connectorApi.install(connector.slug, `${connector.name} Workflow`),
    onSuccess: (workflow) => { pushToast({ kind: 'success', title: 'Connector installed' }); navigate(`/workflows/${workflow.id}`); },
    onError: () => pushToast({ kind: 'error', title: 'Install failed' }),
  });
  const saveCredential = useMutation({
    mutationFn: () => connectorApi.saveCredential(credentialOpen!.slug, credentialForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connectorCredentials', credentialOpen?.slug] });
      setCredentialOpen(null);
      setCredentialForm({ displayName: '', secret: '' });
      pushToast({ kind: 'success', title: 'Credential saved' });
    },
    onError: () => pushToast({ kind: 'error', title: 'Credential save failed' }),
  });
  const oauth = useMutation({
    mutationFn: (slug: string) => connectorApi.startOAuth(slug),
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.authorizationUrl);
      pushToast({ kind: 'info', title: 'OAuth URL copied', message: 'Open it in a browser to complete provider authorization.' });
    },
  });

  return (
    <div className="p-8 max-w-6xl">
      <Header title="Integration Hub" subtitle="Install connector templates into your workflow library" />
      {isLoading ? <SkeletonCards /> : connectors.length === 0 ? <EmptyState icon={<Cable size={44} />} title="No connectors" description="Connector templates will appear after backend seeding." /> : (
        <div className="grid grid-cols-3 gap-4">
          {connectors.map((connector) => (
            <Card key={connector.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Cable size={15} style={{ color: 'var(--forge-accent)' }} />
                    <h3 className="text-sm font-semibold text-white">{connector.name}</h3>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{connector.category} · {connector.authType}</p>
                  <p className="mt-3 text-sm text-slate-400">{connector.description}</p>
                </div>
              </div>
              <Button className="mt-5 w-full justify-center" variant="outline" loading={install.isPending} onClick={() => install.mutate(connector)}>
                Install template
              </Button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button size="sm" variant="ghost" onClick={() => setCredentialOpen(connector)}>Credential</Button>
                <Button size="sm" variant="ghost" loading={oauth.isPending} onClick={() => oauth.mutate(connector.slug)}>OAuth</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal open={!!credentialOpen} onClose={() => setCredentialOpen(null)} title={`Credential for ${credentialOpen?.name || 'connector'}`}>
        <form className="p-6 flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); saveCredential.mutate(); }}>
          <Input label="Display name" value={credentialForm.displayName} onChange={(e) => setCredentialForm((f) => ({ ...f, displayName: e.target.value }))} required />
          <Textarea label="Secret / token" rows={4} value={credentialForm.secret} onChange={(e) => setCredentialForm((f) => ({ ...f, secret: e.target.value }))} required />
          <div className="flex justify-end gap-2"><Button variant="ghost" type="button" onClick={() => setCredentialOpen(null)}>Cancel</Button><Button loading={saveCredential.isPending}>Save</Button></div>
        </form>
      </Modal>
    </div>
  );
}
