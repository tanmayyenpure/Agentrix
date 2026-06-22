import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ReactFlow, Background, Controls, MiniMap,
  addEdge, applyNodeChanges, applyEdgeChanges,
  type Node, type Edge, type Connection, type NodeChange, type EdgeChange,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Play, ArrowLeft, Settings, X, ListChecks, TriangleAlert, History } from 'lucide-react';

import { workflowApi, executionApi } from '../api/endpoints';
import type { NodeType } from '../types';
import { NODE_META, uid } from '../utils';
import { FlowNode, type FlowNodeData } from '../components/workflow/FlowNode';
import { NodePalette } from '../components/workflow/NodePalette';
import { Button, Input, Textarea, Modal } from '../components/ui';
import { CronBuilder } from '../components/workflow/CronBuilder';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useToast } from '../components/ui/Toast';

const NODE_TYPES = { flowNode: FlowNode };

export function WorkflowBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { pushToast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const workflowId = id && id !== 'new' ? Number(id) : undefined;

  const [nodes, setNodes] = useState<Node<FlowNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [configNode, setConfigNode] = useState<Node<FlowNodeData> | null>(null);
  const [configLabel, setConfigLabel] = useState('');
  const [configJson, setConfigJson] = useState('');
  const [saved, setSaved] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  const { data: workflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => workflowApi.get(workflowId!),
    enabled: !!workflowId,
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['workflowVersions', workflowId],
    queryFn: () => workflowApi.versions(workflowId!),
    enabled: !!workflowId && versionsOpen,
  });

  const handleDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, []);

  const handleConfigureOpen = useCallback((nodeId: string) => {
    setNodes((nds) => {
      const node = nds.find((n) => n.id === nodeId);
      if (node) {
        setConfigNode(node);
        setConfigLabel(node.data.label);
        setConfigJson(node.data.config || '');
      }
      return nds;
    });
  }, []);

  useEffect(() => {
    if (!workflow) return;
    setWorkflowName(workflow.name);
    setWorkflowDesc(workflow.description || '');
    setNodes(workflow.nodes.map((n) => ({
      id: n.clientId,
      type: 'flowNode',
      position: { x: n.positionX, y: n.positionY },
      data: {
        label: n.label,
        type: n.type,
        config: n.config,
        onDelete: handleDelete,
        onConfigure: handleConfigureOpen,
      },
    })));
    setEdges(workflow.edges.map((e, i) => ({
      id: `e-${i}`,
      source: e.sourceClientId,
      target: e.targetClientId,
      label: e.conditionBranch,
      style: { stroke: '#6366f1', strokeWidth: 2 },
      labelStyle: { fill: '#818cf8', fontSize: 11 },
      labelBgStyle: { fill: 'var(--forge-surface-2)' },
    })));
  }, [workflow, handleDelete, handleConfigureOpen]);

  const onNodesChange = useCallback((changes: NodeChange<Node<FlowNodeData>>[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, style: { stroke: '#6366f1', strokeWidth: 2 } }, eds));
  }, []);

  function addNode(type: NodeType) {
    const meta = NODE_META[type];
    const nodeId = `node-${uid()}`;
    setNodes((nds) => [...nds, {
      id: nodeId,
      type: 'flowNode',
      position: { x: Math.random() * 300 + 100, y: Math.random() * 200 + 80 },
      data: { label: meta.label, type, onDelete: handleDelete, onConfigure: handleConfigureOpen },
    }]);
  }

  function addStarterWorkflow() {
    const triggerId = `node-${uid()}`;
    const logId = `node-${uid()}`;
    setNodes([
      {
        id: triggerId,
        type: 'flowNode',
        position: { x: 120, y: 140 },
        data: { label: NODE_META.TRIGGER_MANUAL.label, type: 'TRIGGER_MANUAL', onDelete: handleDelete, onConfigure: handleConfigureOpen },
      },
      {
        id: logId,
        type: 'flowNode',
        position: { x: 420, y: 140 },
        data: { label: NODE_META.LOG.label, type: 'LOG', config: '{"message":"Workflow executed successfully"}', onDelete: handleDelete, onConfigure: handleConfigureOpen },
      },
    ]);
    setEdges([{ id: `e-${triggerId}-${logId}`, source: triggerId, target: logId, style: { stroke: '#6366f1', strokeWidth: 2 } }]);
    if (!workflowName.trim()) setWorkflowName('My first workflow');
    setWorkflowDesc((current) => current || 'Starter workflow with a manual trigger and log step.');
  }

  function saveConfig() {
    if (!configNode) return;
    setNodes((nds) => nds.map((node) =>
      node.id === configNode.id ? { ...node, data: { ...node.data, label: configLabel, config: configJson || undefined } } : node
    ));
    setConfigNode(null);
  }

  function validateWorkflow() {
    const next: string[] = [];
    const hasTrigger = nodes.some((node) => node.data.type.startsWith('TRIGGER_'));
    const connected = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
    const disconnected = nodes.filter((node) => !connected.has(node.id));
    if (!hasTrigger) next.push('Add at least one trigger node before saving or running this workflow.');
    if (nodes.length > 1 && disconnected.length > 0) next.push(`${disconnected.length} node${disconnected.length === 1 ? ' is' : 's are'} disconnected.`);
    setWarnings(next);
    return next.length === 0;
  }

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
      name: workflowName.trim() || 'Untitled workflow',
      description: workflowDesc,
      nodes: nodes.map((node) => ({
        clientId: node.id,
        type: node.data.type,
        label: node.data.label,
        config: node.data.config,
        positionX: node.position.x,
        positionY: node.position.y,
      })),
      edges: edges.map((edge) => ({ sourceClientId: edge.source, targetClientId: edge.target, conditionBranch: edge.label as string | undefined })),
      };
      return workflowId ? workflowApi.update(workflowId, payload) : workflowApi.create(payload);
    },
    onSuccess: (wf) => {
      qc.invalidateQueries({ queryKey: ['workflow', wf.id] });
      qc.invalidateQueries({ queryKey: ['workflows'] });
      setSaved(true);
      pushToast({ kind: 'success', title: 'Workflow saved' });
      setTimeout(() => setSaved(false), 2000);
      if (!workflowId) navigate(`/workflows/${wf.id}`, { replace: true });
    },
    onError: () => pushToast({ kind: 'error', title: 'Save failed', message: 'The workflow could not be saved.' }),
  });

  const triggerMut = useMutation({
    mutationFn: () => executionApi.trigger(workflowId!),
    onSuccess: (exec) => {
      pushToast({ kind: 'success', title: 'Execution triggered' });
      navigate(`/executions/${exec.id}`);
    },
    onError: () => pushToast({ kind: 'error', title: 'Run failed', message: 'The workflow could not be triggered.' }),
  });

  const rollbackMut = useMutation({
    mutationFn: (version: number) => workflowApi.rollback(workflowId!, version),
    onSuccess: (wf) => {
      qc.invalidateQueries({ queryKey: ['workflow', id] });
      qc.invalidateQueries({ queryKey: ['workflowVersions', id] });
      setVersionsOpen(false);
      pushToast({ kind: 'success', title: `Rolled back to v${wf.version}` });
    },
    onError: () => pushToast({ kind: 'error', title: 'Rollback failed' }),
  });

  function handleSave() {
    if (validateWorkflow()) saveMut.mutate();
  }

  function handleRun() {
    if (!workflowId) {
      pushToast({ kind: 'info', title: 'Save first', message: 'Save this new workflow once, then run it.' });
      handleSave();
      return;
    }
    if (validateWorkflow()) triggerMut.mutate();
  }

  return (
    <div className="flex flex-col h-screen">
      <div style={{ background: 'var(--forge-surface)', borderBottom: '1px solid var(--forge-border)', height: '56px' }}
        className="flex items-center px-4 gap-3 flex-shrink-0">
        <Button size="sm" variant="ghost" onClick={() => navigate('/workflows')}>
          <ArrowLeft size={14} /> Back
        </Button>
        <div style={{ width: '1px', height: '20px', background: 'var(--forge-border)' }} />
        <div className="flex-1 min-w-0">
          <input value={workflowName} onChange={(e) => setWorkflowName(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--forge-text)', fontSize: '14px', fontWeight: 600, outline: 'none', width: '100%' }}
            placeholder="Workflow name..." />
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-400">Saved</span>}
          <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)}>
            <Settings size={14} /> Settings
          </Button>
          <Button size="sm" variant="ghost" disabled={!workflowId} onClick={() => workflowId && navigate(`/workflows/${workflowId}/executions`)}>
            <ListChecks size={14} /> View Runs
          </Button>
          <Button size="sm" variant="ghost" disabled={!workflowId} onClick={() => setVersionsOpen(true)}>
            <History size={14} /> Versions
          </Button>
          <Button size="sm" variant="outline" loading={saveMut.isPending} onClick={handleSave}>
            <Save size={14} /> Save
          </Button>
          <Button size="sm" loading={triggerMut.isPending} onClick={handleRun}>
            <Play size={14} /> Run
          </Button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 text-xs" style={{ background: 'rgba(245,158,11,0.12)', borderBottom: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24' }}>
          <TriangleAlert size={15} className="mt-0.5 shrink-0" />
          <div>{warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div ref={reactFlowWrapper} className="flex-1">
          <ErrorBoundary compact>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={NODE_TYPES}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e2330" />
              {nodes.length === 0 && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <div className="pointer-events-auto rounded-lg p-5 text-center" style={{ background: 'rgba(17,19,26,0.92)', border: '1px solid var(--forge-border)', width: 360 }}>
                    <p className="text-sm font-semibold text-white">Start building your workflow</p>
                    <p className="mt-1 text-xs text-slate-500">Use the node library on the right, or add a ready-to-run starter flow.</p>
                    <div className="mt-4 flex justify-center gap-2">
                      <Button size="sm" onClick={addStarterWorkflow}>Add starter flow</Button>
                      <Button size="sm" variant="outline" onClick={() => addNode('TRIGGER_MANUAL')}>Add trigger</Button>
                    </div>
                  </div>
                </div>
              )}
              <Controls />
              <MiniMap
                nodeColor={(node: Node<FlowNodeData>) => NODE_META[node.data?.type || 'LOG']?.color || '#6366f1'}
                maskColor="rgba(10,11,15,0.7)"
              />
            </ReactFlow>
          </ErrorBoundary>
        </div>
        <NodePalette onAdd={addNode} />
      </div>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Workflow Settings">
        <div className="p-6 flex flex-col gap-4">
          <Input label="Name" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} />
          <Textarea label="Description" value={workflowDesc} onChange={(e) => setWorkflowDesc(e.target.value)} rows={3} />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setSettingsOpen(false)}>Close</Button>
            <Button onClick={() => { handleSave(); setSettingsOpen(false); }}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal open={versionsOpen} onClose={() => setVersionsOpen(false)} title="Version History" width="620px">
        <div className="p-6">
          {versions.length === 0 ? (
            <p className="text-sm text-slate-500">No saved versions yet.</p>
          ) : (
            <div className="grid gap-2">
              {versions.map((version) => (
                <div key={version.id} className="flex items-center justify-between rounded-lg px-4 py-3" style={{ background: 'var(--forge-surface-2)', border: '1px solid var(--forge-border)' }}>
                  <div>
                    <p className="text-sm font-semibold text-white">v{version.version} · {version.name}</p>
                    <p className="text-xs text-slate-500">{new Date(version.createdAt).toLocaleString()} by {version.createdByEmail}</p>
                  </div>
                  <Button size="sm" variant="outline" loading={rollbackMut.isPending} onClick={() => rollbackMut.mutate(version.version)}>
                    Roll back
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <Modal open={!!configNode} onClose={() => setConfigNode(null)} title="Configure Node" width={configNode?.data.type === 'TRIGGER_SCHEDULE' ? '680px' : '480px'}>
        <div className="p-6 flex flex-col gap-4">
          <Input label="Label" value={configLabel} onChange={(e) => setConfigLabel(e.target.value)} />
          {configNode?.data.type === 'TRIGGER_SCHEDULE' ? (
            <>
              <Input label="Cron expression" value={configJson || '0 9 * * *'} onChange={(e) => setConfigJson(e.target.value)} />
              <CronBuilder value={configJson || '0 9 * * *'} onChange={setConfigJson} />
            </>
          ) : (
            <>
              <Textarea label="Config (JSON)" placeholder='{"url": "https://...", "method": "GET"}'
                value={configJson} onChange={(e) => setConfigJson(e.target.value)} rows={5}
                style={{ fontFamily: 'monospace', fontSize: '12px' }} />
              <div className="text-xs text-slate-500">
                Refer to the README for node-specific config schemas.
              </div>
            </>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setConfigNode(null)}><X size={12} /> Cancel</Button>
            <Button onClick={saveConfig}>Apply</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
