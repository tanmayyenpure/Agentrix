import api from './client';
import type {
  AuthResponse,
  AcceptInviteRequest,
  LoginRequest,
  RegisterRequest,
  WorkflowResponse,
  WorkflowRequest,
  WorkflowVersionResponse,
  ExecutionResponse,
  TriggerExecutionRequest,
  WebhookResponse,
  ScheduleEntry,
  Notification,
  AuditPage,
  ApiKey,
  CreatedApiKey,
  TeamMember,
  OrgInfo,
  GeneratedWorkflowResponse,
  AiAgent,
  AgentRunResponse,
  Connector,
  ConnectorCredential,
  OAuthStartResponse,
  BillingPlan,
  Subscription,
} from '../types';
import { nextId, readStore, workflowName, writeStore } from './mockStore';

// Auth
export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),
  acceptInvite: (data: AcceptInviteRequest) =>
    api.post<AuthResponse>('/auth/accept-invite', data).then((r) => r.data),
};

// Workflows
export const workflowApi = {
  list: async () => readStore().workflows,
  get: (id: number) => withFallback(
    () => api.get<WorkflowResponse>(`/workflows/${id}`).then((r) => r.data),
    () => demoWorkflow(id)
  ),
  create: (data: WorkflowRequest) =>
    api.post<WorkflowResponse>('/workflows', data).then((r) => r.data),
  update: (id: number, data: WorkflowRequest) =>
    withFallback(
      () => api.put<WorkflowResponse>(`/workflows/${id}`, data).then((r) => r.data),
      () => {
        const store = readStore();
        const next = { ...demoWorkflow(id), ...data, updatedAt: new Date().toISOString(), version: demoWorkflow(id).version + 1 };
        store.workflows = store.workflows.map((workflow) => workflow.id === id ? next : workflow);
        writeStore(store);
        return next;
      }
    ),
  delete: (id: number) => withFallback(
    () => api.delete(`/workflows/${id}`).then(() => undefined),
    () => {
      const store = readStore();
      store.workflows = store.workflows.filter((workflow) => workflow.id !== id);
      writeStore(store);
    }
  ),
  versions: (id: number) =>
    withFallback(
      () => api.get<WorkflowVersionResponse[]>(`/workflows/${id}/versions`).then((r) => r.data),
      () => [
        { id: id * 10 + 1, workflowId: id, version: demoWorkflow(id).version, name: demoWorkflow(id).name, createdByUserId: 1, createdByEmail: 'tanmay.yenpure@agentrix.ai', createdAt: demoWorkflow(id).updatedAt },
        { id: id * 10 + 2, workflowId: id, version: Math.max(1, demoWorkflow(id).version - 1), name: `${demoWorkflow(id).name} previous`, createdByUserId: 2, createdByEmail: 'ishaan.oak@agentrix.ai', createdAt: demoWorkflow(id).createdAt },
      ]
    ),
  rollback: (id: number, version: number) =>
    withFallback(
      () => api.post<WorkflowResponse>(`/workflows/${id}/versions/${version}/rollback`).then((r) => r.data),
      () => ({ ...demoWorkflow(id), version, updatedAt: new Date().toISOString() })
    ),
};

// Executions
export const executionApi = {
  trigger: (workflowId: number, data?: TriggerExecutionRequest) =>
    withFallback(
      () => api
        .post<ExecutionResponse>(`/workflows/${workflowId}/executions`, data ?? {})
        .then((r) => r.data),
      () => {
        const store = readStore();
        const workflow = demoWorkflow(workflowId);
        const item: ExecutionResponse = {
          id: nextId(store.executions),
          workflowId,
          status: 'SUCCESS',
          inputPayload: data?.inputPayload || '{}',
          startedAt: new Date(Date.now() - 2000).toISOString(),
          finishedAt: new Date().toISOString(),
          logs: workflow.nodes.map((node, index) => ({
            id: Date.now() + index,
            nodeClientId: node.clientId,
            nodeLabel: node.label,
            status: 'SUCCESS',
            output: `${node.label} completed`,
            durationMs: 20 + index * 45,
            executedAt: new Date().toISOString(),
          })),
        };
        store.executions.unshift(item);
        writeStore(store);
        return item;
      }
    ),
  listForWorkflow: (workflowId: number) =>
    withFallback(
      () => api.get<ExecutionResponse[]>(`/workflows/${workflowId}/executions`).then((r) =>
        mergeDemo(r.data, readStore().executions.filter((item) => item.workflowId === workflowId))
      ),
      () => readStore().executions.filter((item) => item.workflowId === workflowId)
    ),
  get: (executionId: number) =>
    withFallback(
      () => api.get<ExecutionResponse>(`/executions/${executionId}`).then((r) => r.data),
      () => demoExecution(executionId)
    ),
};

async function withFallback<T>(request: () => Promise<T>, fallback: () => T) {
  try {
    return await request();
  } catch {
    return fallback();
  }
}

function mergeDemo<T extends { id: number }>(real: T[], demo: T[]) {
  const realIds = new Set(real.map((item) => item.id));
  return [...real, ...demo.filter((item) => !realIds.has(item.id))];
}

function demoWorkflow(id: number) {
  const item = readStore().workflows.find((workflow) => workflow.id === id);
  if (!item) throw new Error(`Workflow not found: ${id}`);
  return item;
}

function demoExecution(id: number) {
  const item = readStore().executions.find((execution) => execution.id === id);
  if (!item) throw new Error(`Execution not found: ${id}`);
  return item;
}

function makeSecret(prefix = 'whsec') {
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}`;
}

export const webhookApi = {
  list: () => withFallback(
    () => api.get<WebhookResponse[]>('/webhooks').then((r) => mergeDemo(r.data, readStore().webhooks)),
    () => readStore().webhooks
  ),
  create: (data: { workflowId: number; name: string; workflowName?: string }) => withFallback(
    () => api.post<WebhookResponse>('/webhooks', { workflowId: data.workflowId, name: data.name }).then((r) => r.data),
    () => {
      const store = readStore();
      const secret = makeSecret();
      const item: WebhookResponse = {
        id: nextId(store.webhooks),
        name: data.name,
        workflowId: data.workflowId,
        workflowName: data.workflowName || workflowName([], data.workflowId),
        secret,
        url: `http://localhost:8080/api/webhooks/${secret}/trigger`,
        createdAt: new Date().toISOString(),
        hitCount: 0,
      };
      store.webhooks.unshift(item);
      writeStore(store);
      return item;
    }
  ),
  delete: (id: number) => withFallback(
    () => api.delete(`/webhooks/${id}`).then(() => undefined),
    () => {
      const store = readStore();
      store.webhooks = store.webhooks.filter((item) => item.id !== id);
      writeStore(store);
    }
  ),
  regenerateSecret: (id: number) => {
    return withFallback(
      () => api.put<WebhookResponse>(`/webhooks/${id}/regenerate-secret`).then((r) => r.data),
      () => {
        const store = readStore();
        store.webhooks = store.webhooks.map((item) => {
          if (item.id !== id) return item;
          const secret = makeSecret();
          return { ...item, secret, url: `http://localhost:8080/api/webhooks/${secret}/trigger` };
        });
        writeStore(store);
        return store.webhooks.find((item) => item.id === id)!;
      }
    );
  },
};

export const scheduleApi = {
  list: () => withFallback(
    () => api.get<ScheduleEntry[]>('/schedules').then((r) => mergeDemo(r.data, readStore().schedules)),
    () => readStore().schedules
  ),
  create: (data: { workflowId: number; cronExpression: string; enabled: boolean; workflowName?: string }) => withFallback(
    () => api.post<ScheduleEntry>('/schedules', data).then((r) => r.data),
    () => {
      const store = readStore();
      const item: ScheduleEntry = {
        id: nextId(store.schedules),
        workflowId: data.workflowId,
        workflowName: data.workflowName || workflowName([], data.workflowId),
        cronExpression: data.cronExpression,
        enabled: data.enabled,
        nextRunAt: new Date(Date.now() + 86400000).toISOString(),
      };
      store.schedules.unshift(item);
      writeStore(store);
      return item;
    }
  ),
  update: (id: number, data: Partial<ScheduleEntry>) => withFallback(
    () => api.put<ScheduleEntry>(`/schedules/${id}`, data).then((r) => r.data),
    () => {
      const store = readStore();
      store.schedules = store.schedules.map((item) => item.id === id ? { ...item, ...data } : item);
      writeStore(store);
      return store.schedules.find((item) => item.id === id)!;
    }
  ),
  delete: (id: number) => withFallback(
    () => api.delete(`/schedules/${id}`).then(() => undefined),
    () => {
      const store = readStore();
      store.schedules = store.schedules.filter((item) => item.id !== id);
      writeStore(store);
    }
  ),
};

export const notificationApi = {
  list: () => withFallback(
    () => api.get<Notification[]>('/notifications').then((r) => mergeDemo(r.data, readStore().notifications)),
    () => readStore().notifications
  ),
  read: (id: number) => withFallback(
    () => api.put<Notification>(`/notifications/${id}/read`).then((r) => r.data),
    () => {
      const store = readStore();
      store.notifications = store.notifications.map((item) => item.id === id ? { ...item, read: true } : item);
      writeStore(store);
      return store.notifications.find((item) => item.id === id)!;
    }
  ),
  readAll: () => withFallback(
    () => api.put('/notifications/read-all').then(() => undefined),
    () => {
      const store = readStore();
      store.notifications = store.notifications.map((item) => ({ ...item, read: true }));
      writeStore(store);
    }
  ),
};

export const auditApi = {
  list: (params: { page?: number; size?: number; resourceType?: string; from?: string; to?: string }) => withFallback(
    () => api.get<AuditPage>('/audit', { params }).then((r) => {
      const store = readStore();
      const filtered = store.audit.filter((item) =>
        (!params.resourceType || item.resourceType === params.resourceType) &&
        (!params.from || new Date(item.createdAt) >= new Date(params.from)) &&
        (!params.to || new Date(item.createdAt) <= new Date(params.to))
      );
      const content = mergeDemo(r.data.content, filtered);
      return { ...r.data, content, totalElements: Math.max(r.data.totalElements, content.length), totalPages: Math.max(r.data.totalPages, 1) };
    }),
    () => {
      const store = readStore();
      const filtered = store.audit.filter((item) =>
        (!params.resourceType || item.resourceType === params.resourceType) &&
        (!params.from || new Date(item.createdAt) >= new Date(params.from)) &&
        (!params.to || new Date(item.createdAt) <= new Date(params.to))
      );
      const page = params.page || 0;
      const size = params.size || 50;
      return {
        content: filtered.slice(page * size, (page + 1) * size),
        totalElements: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / size)),
      };
    }
  ),
};

export const apiKeyApi = {
  list: () => withFallback(
    () => api.get<ApiKey[]>('/apikeys').then((r) => mergeDemo(r.data, readStore().apiKeys)),
    () => readStore().apiKeys
  ),
  create: (data: { name: string; expiresAt?: string }) => withFallback(
    () => api.post<CreatedApiKey>('/apikeys', data).then((r) => r.data),
    () => {
      const store = readStore();
      const fullKey = `ff_sk_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
      const item: CreatedApiKey = {
        id: nextId(store.apiKeys),
        name: data.name,
        keyPrefix: `${fullKey.slice(0, 13)}...`,
        createdAt: new Date().toISOString(),
        expiresAt: data.expiresAt,
        active: true,
        fullKey,
      };
      store.apiKeys.unshift(item);
      writeStore(store);
      return item;
    }
  ),
  delete: (id: number) => withFallback(
    () => api.delete(`/apikeys/${id}`).then(() => undefined),
    () => {
      const store = readStore();
      store.apiKeys = store.apiKeys.filter((item) => item.id !== id);
      writeStore(store);
    }
  ),
};

export const orgApi = {
  get: async () => readStore().org,
  members: async () => readStore().members,
  invite: (data: { email: string; role: 'ADMIN' | 'USER' }) => withFallback(
    () => api.post<TeamMember>('/org/invite', data).then((r) => r.data),
    () => {
      const store = readStore();
      const item: TeamMember = { id: nextId(store.members), fullName: data.email.split('@')[0], email: data.email, role: data.role, joinedAt: new Date().toISOString() };
      store.members.push(item);
      store.org.memberCount = store.members.length;
      writeStore(store);
      return item;
    }
  ),
  updateRole: (id: number, role: 'ADMIN' | 'USER') => withFallback(
    () => api.put<TeamMember>(`/org/members/${id}/role`, { role }).then((r) => r.data),
    () => {
      const store = readStore();
      store.members = store.members.map((item) => item.id === id ? { ...item, role } : item);
      writeStore(store);
      return store.members.find((item) => item.id === id)!;
    }
  ),
  delete: (id: number) => withFallback(
    () => api.delete(`/org/members/${id}`).then(() => undefined),
    () => {
      const store = readStore();
      store.members = store.members.filter((item) => item.id !== id);
      store.org.memberCount = store.members.length;
      writeStore(store);
    }
  ),
};

export const aiApi = {
  generateWorkflow: (data: { prompt: string; name?: string; createWorkflow: boolean }) =>
    api.post<GeneratedWorkflowResponse>('/ai/workflows/generate', data).then((r) => r.data),
  listAgents: async () => readStore().agents,
  createAgent: (data: { name: string; instructions: string; model?: string; enabled: boolean }) =>
    withFallback(
      () => api.post<AiAgent>('/ai/agents', data).then((r) => r.data),
      () => {
        const store = readStore();
        const item: AiAgent = {
          id: nextId(store.agents),
          name: data.name,
          instructions: data.instructions,
          model: data.model || 'agentrix-pro-v1',
          enabled: data.enabled,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.agents.unshift(item);
        writeStore(store);
        return item;
      }
    ),
  updateAgent: (id: number, data: { name: string; instructions: string; model?: string; enabled: boolean }) =>
    api.put<AiAgent>(`/ai/agents/${id}`, data).then((r) => r.data),
  deleteAgent: (id: number) =>
    withFallback(
      () => api.delete(`/ai/agents/${id}`).then(() => undefined),
      () => {
        const store = readStore();
        store.agents = store.agents.filter((agent) => agent.id !== id);
        writeStore(store);
      }
    ),
  runAgent: (id: number, input: string) =>
    withFallback(
      () => api.post<AgentRunResponse>(`/ai/agents/${id}/run`, { input }).then((r) => r.data),
      () => {
        const agent = readStore().agents.find((item) => item.id === id);
        return {
          agentId: id,
          output: `${agent?.name || 'Agent'} reviewed the input.\n\nSummary: ${input.slice(0, 160)}\n\nRecommended next step: create a workflow branch for high-priority items and log the outcome for audit.`,
          ranAt: new Date().toISOString(),
        };
      }
    ),
};

export const connectorApi = {
  list: async () => readStore().connectors,
  install: (slug: string, workflowName?: string) =>
    withFallback(
      () => api.post<WorkflowResponse>(`/connectors/${slug}/install`, { workflowName }).then((r) => r.data),
      () => {
        const store = readStore();
        const connector = store.connectors.find((item) => item.slug === slug);
        const item: WorkflowResponse = {
          ...store.workflows[0],
          id: nextId(store.workflows),
          name: workflowName || `${connector?.name || 'Connector'} Workflow`,
          description: connector?.description || 'Installed connector template',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        store.workflows.unshift(item);
        writeStore(store);
        return item;
      }
    ),
  credentials: (slug: string) =>
    withFallback(
      () => api.get<ConnectorCredential[]>(`/connectors/${slug}/credentials`).then((r) => mergeDemo(r.data, readStore().connectorCredentials.filter((item) => item.connectorSlug === slug))),
      () => readStore().connectorCredentials.filter((item) => item.connectorSlug === slug)
    ),
  saveCredential: (slug: string, data: { displayName: string; secret: string }) =>
    withFallback(
      () => api.post<ConnectorCredential>(`/connectors/${slug}/credentials`, data).then((r) => r.data),
      () => {
        const store = readStore();
        const item: ConnectorCredential = { id: nextId(store.connectorCredentials), connectorSlug: slug, displayName: data.displayName, createdAt: new Date().toISOString() };
        store.connectorCredentials.unshift(item);
        writeStore(store);
        return item;
      }
    ),
  startOAuth: (slug: string) =>
    withFallback(
      () => api.post<OAuthStartResponse>(`/connectors/${slug}/oauth/start`).then((r) => r.data),
      () => ({ authorizationUrl: `https://auth.example.com/oauth/authorize?connector=${slug}&state=demo-state`, state: 'demo-state' })
    ),
};

export const billingApi = {
  plans: () => withFallback(
    () => api.get<BillingPlan[]>('/billing/plans').then((r) => mergeDemo(r.data, readStore().billingPlans)),
    () => readStore().billingPlans
  ),
  subscription: () => withFallback(
    () => api.get<Subscription | null>('/billing/subscription').then((r) => r.data || readStore().subscription),
    () => readStore().subscription
  ),
  changePlan: (planCode: string) => withFallback(
    () => api.put<Subscription>('/billing/subscription', { planCode }).then((r) => r.data),
    () => {
      const store = readStore();
      const plan = store.billingPlans.find((item) => item.code === planCode) || store.billingPlans[0];
      const subscription = { id: store.subscription?.id || 1, status: 'active', plan };
      store.subscription = subscription;
      writeStore(store);
      return subscription;
    }
  ),
};
