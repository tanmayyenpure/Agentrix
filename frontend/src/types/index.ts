export type NodeType =
  | 'TRIGGER_MANUAL'
  | 'TRIGGER_WEBHOOK'
  | 'TRIGGER_SCHEDULE'
  | 'HTTP_REQUEST'
  | 'LOG'
  | 'DELAY'
  | 'CONDITION'
  | 'TRANSFORM';

export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface NodeDto {
  clientId: string;
  type: NodeType;
  label: string;
  config?: string;
  positionX: number;
  positionY: number;
}

export interface EdgeDto {
  sourceClientId: string;
  targetClientId: string;
  conditionBranch?: string;
}

export interface WorkflowResponse {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  version: number;
  ownerId: number;
  nodes: NodeDto[];
  edges: EdgeDto[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRequest {
  name: string;
  description?: string;
  nodes: NodeDto[];
  edges: EdgeDto[];
}

export interface ExecutionLogDto {
  id: number;
  nodeClientId: string;
  nodeLabel: string;
  status: ExecutionStatus;
  output?: string;
  errorMessage?: string;
  durationMs?: number;
  executedAt: string;
}

export interface ExecutionResponse {
  id: number;
  workflowId: number;
  status: ExecutionStatus;
  inputPayload?: string;
  errorMessage?: string;
  logs: ExecutionLogDto[];
  startedAt: string;
  finishedAt?: string;
}

export interface AuthResponse {
  token: string;
  email?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AcceptInviteRequest {
  token: string;
  fullName: string;
  password: string;
}

export interface TriggerExecutionRequest {
  inputPayload?: string;
}

export interface WorkflowVersionResponse {
  id: number;
  workflowId: number;
  version: number;
  name: string;
  createdByUserId: number;
  createdByEmail: string;
  createdAt: string;
}

export interface WebhookResponse {
  id: number;
  name: string;
  workflowId: number;
  workflowName: string;
  secret: string;
  url: string;
  createdAt: string;
  hitCount: number;
  lastTriggeredAt?: string;
}

export interface ScheduleEntry {
  id: number;
  workflowId: number;
  workflowName: string;
  cronExpression: string;
  enabled: boolean;
  nextRunAt: string;
  lastRunAt?: string;
  lastStatus?: ExecutionStatus;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'SUCCESS' | 'FAILURE' | 'WARNING' | 'INFO';
  workflowId?: number;
  executionId?: number;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  action: string;
  resourceType: 'WORKFLOW' | 'EXECUTION' | 'WEBHOOK' | 'USER' | 'APIKEY';
  resourceId: number;
  resourceName: string;
  userId: number;
  userEmail: string;
  metadata?: string;
  createdAt: string;
}

export interface AuditPage {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
}

export interface ApiKey {
  id: number;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  active: boolean;
}

export interface CreatedApiKey extends ApiKey {
  fullKey: string;
}

export interface TeamMember {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  joinedAt: string;
  lastActiveAt?: string;
}

export interface OrgInfo {
  id: number;
  name: string;
  memberCount: number;
  createdAt: string;
}

export interface GeneratedWorkflowResponse {
  name: string;
  description: string;
  nodes: NodeDto[];
  edges: EdgeDto[];
  workflowId?: number;
  summary: string;
}

export interface AiAgent {
  id: number;
  name: string;
  instructions: string;
  model: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentRunResponse {
  agentId: number;
  output: string;
  ranAt: string;
}

export interface Connector {
  id: number;
  slug: string;
  name: string;
  category: string;
  description: string;
  authType: string;
  installedByDefault: boolean;
}

export interface ConnectorCredential {
  id: number;
  connectorSlug: string;
  displayName: string;
  createdAt: string;
}

export interface OAuthStartResponse {
  authorizationUrl: string;
  state: string;
}

export interface BillingPlan {
  id: number;
  code: string;
  name: string;
  monthlyPriceCents: number;
  workflowLimit: number;
  executionLimit: number;
}

export interface Subscription {
  id: number;
  status: string;
  plan: BillingPlan;
}
