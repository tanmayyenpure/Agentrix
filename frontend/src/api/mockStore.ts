import type {
  ApiKey,
  AuditLog,
  AiAgent,
  BillingPlan,
  Connector,
  ConnectorCredential,
  ExecutionResponse,
  Notification,
  OrgInfo,
  ScheduleEntry,
  Subscription,
  TeamMember,
  WebhookResponse,
  WorkflowResponse,
} from '../types';

type StoreShape = {
  webhooks: WebhookResponse[];
  schedules: ScheduleEntry[];
  notifications: Notification[];
  audit: AuditLog[];
  apiKeys: ApiKey[];
  org: OrgInfo;
  members: TeamMember[];
  workflows: WorkflowResponse[];
  executions: ExecutionResponse[];
  agents: AiAgent[];
  connectors: Connector[];
  connectorCredentials: ConnectorCredential[];
  billingPlans: BillingPlan[];
  subscription: Subscription | null;
};

const KEY = 'agentrix_demo_platform_v3';

function now(offsetMs = 0) {
  return new Date(Date.now() + offsetMs).toISOString();
}

function seed(): StoreShape {
  const workflows: WorkflowResponse[] = [
    {
      id: 101,
      name: 'Daily Morning Routine',
      description: 'Start the day with calendar review, priority planning, inbox triage, and reminders.',
      active: true,
      version: 5,
      ownerId: 1,
      nodes: [
        { clientId: 'morning-schedule', type: 'TRIGGER_SCHEDULE', label: 'Every morning at 7:00', config: '0 7 * * *', positionX: 90, positionY: 120 },
        { clientId: 'calendar-check', type: 'HTTP_REQUEST', label: 'Read calendar events', config: '{"url":"https://calendar.google.com/api/events","method":"GET"}', positionX: 360, positionY: 120 },
        { clientId: 'priority-transform', type: 'TRANSFORM', label: 'Build priority list', config: '{"template":"top_3_priorities"}', positionX: 650, positionY: 120 },
        { clientId: 'morning-log', type: 'LOG', label: 'Save daily plan', config: '{"message":"Morning routine completed"}', positionX: 930, positionY: 120 },
      ],
      edges: [
        { sourceClientId: 'morning-schedule', targetClientId: 'calendar-check' },
        { sourceClientId: 'calendar-check', targetClientId: 'priority-transform' },
        { sourceClientId: 'priority-transform', targetClientId: 'morning-log' },
      ],
      createdAt: now(-31 * 86400000),
      updatedAt: now(-22 * 60000),
    },
    {
      id: 102,
      name: 'Job Application Tracker',
      description: 'Track applications, follow-ups, interviews, and recruiter replies in one automated workflow.',
      active: true,
      version: 3,
      ownerId: 1,
      nodes: [
        { clientId: 'job-webhook', type: 'TRIGGER_WEBHOOK', label: 'New application added', positionX: 100, positionY: 180 },
        { clientId: 'job-condition', type: 'CONDITION', label: 'Needs follow-up?', config: '{"field":"daysSinceApplied","operator":">=","value":7}', positionX: 390, positionY: 180 },
        { clientId: 'job-http', type: 'HTTP_REQUEST', label: 'Update tracker sheet', config: '{"url":"https://sheets.googleapis.com/v4/spreadsheets/demo","method":"POST"}', positionX: 680, positionY: 180 },
        { clientId: 'job-log', type: 'LOG', label: 'Record application status', config: '{"message":"Job tracker updated"}', positionX: 980, positionY: 180 },
      ],
      edges: [
        { sourceClientId: 'job-webhook', targetClientId: 'job-condition' },
        { sourceClientId: 'job-condition', targetClientId: 'job-http', conditionBranch: 'yes' },
        { sourceClientId: 'job-http', targetClientId: 'job-log' },
      ],
      createdAt: now(-24 * 86400000),
      updatedAt: now(-2 * 3600000),
    },
    {
      id: 103,
      name: 'Lead Routing',
      description: 'Capture web leads, enrich them, and post updates to a CRM endpoint.',
      active: true,
      version: 4,
      ownerId: 1,
      nodes: [
        { clientId: 'lead-trigger', type: 'TRIGGER_WEBHOOK', label: 'Lead webhook', positionX: 90, positionY: 120 },
        { clientId: 'lead-transform', type: 'TRANSFORM', label: 'Normalize lead', config: '{"fields":["name","email","company"]}', positionX: 360, positionY: 120 },
        { clientId: 'lead-crm', type: 'HTTP_REQUEST', label: 'Create CRM lead', config: '{"url":"https://api.example-crm.com/leads","method":"POST"}', positionX: 650, positionY: 120 },
        { clientId: 'lead-log', type: 'LOG', label: 'Log result', config: '{"message":"Lead routed"}', positionX: 930, positionY: 120 },
      ],
      edges: [
        { sourceClientId: 'lead-trigger', targetClientId: 'lead-transform' },
        { sourceClientId: 'lead-transform', targetClientId: 'lead-crm' },
        { sourceClientId: 'lead-crm', targetClientId: 'lead-log' },
      ],
      createdAt: now(-28 * 86400000),
      updatedAt: now(-7 * 3600000),
    },
    {
      id: 104,
      name: 'Invoice Follow-up',
      description: 'Runs each morning and sends follow-up requests for unpaid invoices.',
      active: false,
      version: 2,
      ownerId: 1,
      nodes: [
        { clientId: 'invoice-schedule', type: 'TRIGGER_SCHEDULE', label: 'Daily schedule', config: '0 9 * * *', positionX: 100, positionY: 180 },
        { clientId: 'invoice-api', type: 'HTTP_REQUEST', label: 'Fetch invoices', config: '{"url":"https://billing.example.com/open","method":"GET"}', positionX: 390, positionY: 180 },
        { clientId: 'invoice-condition', type: 'CONDITION', label: 'Has overdue invoices?', config: '{"field":"overdueCount","operator":">","value":0}', positionX: 680, positionY: 180 },
        { clientId: 'invoice-log', type: 'LOG', label: 'Record summary', config: '{"message":"Invoice follow-up completed"}', positionX: 980, positionY: 180 },
      ],
      edges: [
        { sourceClientId: 'invoice-schedule', targetClientId: 'invoice-api' },
        { sourceClientId: 'invoice-api', targetClientId: 'invoice-condition' },
        { sourceClientId: 'invoice-condition', targetClientId: 'invoice-log', conditionBranch: 'yes' },
      ],
      createdAt: now(-16 * 86400000),
      updatedAt: now(-7 * 3600000),
    },
    {
      id: 105,
      name: 'Weekly Digest',
      description: 'Collect operational metrics every Friday and publish a digest.',
      active: false,
      version: 6,
      ownerId: 2,
      nodes: [
        { clientId: 'digest-schedule', type: 'TRIGGER_SCHEDULE', label: 'Friday schedule', config: '30 16 * * 5', positionX: 100, positionY: 220 },
        { clientId: 'digest-delay', type: 'DELAY', label: 'Wait for final sync', config: '{"seconds":120}', positionX: 380, positionY: 220 },
        { clientId: 'digest-report', type: 'HTTP_REQUEST', label: 'Fetch metrics', config: '{"url":"https://api.example.com/metrics","method":"GET"}', positionX: 660, positionY: 220 },
      ],
      edges: [
        { sourceClientId: 'digest-schedule', targetClientId: 'digest-delay' },
        { sourceClientId: 'digest-delay', targetClientId: 'digest-report' },
      ],
      createdAt: now(-39 * 86400000),
      updatedAt: now(-2 * 86400000),
    },
  ];
  const executions: ExecutionResponse[] = [
    {
      id: 501,
      workflowId: 101,
      status: 'SUCCESS',
      inputPayload: '{"date":"today","mode":"focused"}',
      startedAt: now(-18 * 60000),
      finishedAt: now(-17 * 60000),
      logs: [
        { id: 1, nodeClientId: 'morning-schedule', nodeLabel: 'Every morning at 7:00', status: 'SUCCESS', output: 'Routine started on schedule', durationMs: 12, executedAt: now(-18 * 60000) },
        { id: 2, nodeClientId: 'calendar-check', nodeLabel: 'Read calendar events', status: 'SUCCESS', output: '4 calendar events found', durationMs: 86, executedAt: now(-18 * 60000) },
        { id: 3, nodeClientId: 'priority-transform', nodeLabel: 'Build priority list', status: 'SUCCESS', output: 'Daily focus plan generated', durationMs: 144, executedAt: now(-17 * 60000) },
      ],
    },
    {
      id: 502,
      workflowId: 102,
      status: 'RUNNING',
      inputPayload: '{}',
      startedAt: now(-4 * 60000),
      logs: [
        { id: 4, nodeClientId: 'job-webhook', nodeLabel: 'New application added', status: 'SUCCESS', output: 'Application payload received', durationMs: 8, executedAt: now(-4 * 60000) },
        { id: 5, nodeClientId: 'job-http', nodeLabel: 'Update tracker sheet', status: 'RUNNING', output: 'Updating tracker row', executedAt: now(-3 * 60000) },
      ],
    },
    {
      id: 503,
      workflowId: 105,
      status: 'FAILED',
      inputPayload: '{}',
      errorMessage: 'Metrics API returned 503',
      startedAt: now(-9 * 3600000),
      finishedAt: now(-9 * 3600000 + 55000),
      logs: [
        { id: 6, nodeClientId: 'digest-schedule', nodeLabel: 'Friday schedule', status: 'SUCCESS', output: 'Schedule fired', durationMs: 9, executedAt: now(-9 * 3600000) },
        { id: 7, nodeClientId: 'digest-report', nodeLabel: 'Fetch metrics', status: 'FAILED', errorMessage: 'Service unavailable', durationMs: 1500, executedAt: now(-9 * 3600000 + 50000) },
      ],
    },
  ];
  const connectors: Connector[] = [
    { id: 1, slug: 'gmail-inbox', name: 'Gmail Inbox', category: 'Email', description: 'Read recruiter messages, labels, and thread metadata for automated follow-up.', authType: 'OAuth', installedByDefault: true },
    { id: 2, slug: 'google-calendar', name: 'Google Calendar', category: 'Productivity', description: 'Create events, inspect busy slots, and schedule reminders from workflows.', authType: 'OAuth', installedByDefault: true },
    { id: 3, slug: 'google-sheets', name: 'Google Sheets', category: 'Data', description: 'Append tracker rows, update status columns, and sync structured workflow output.', authType: 'OAuth', installedByDefault: false },
    { id: 4, slug: 'slack-alert', name: 'Slack Alert', category: 'Messaging', description: 'Send workflow results, approvals, and failure alerts to Slack channels.', authType: 'Webhook', installedByDefault: false },
    { id: 5, slug: 'notion-sync', name: 'Notion Sync', category: 'Knowledge Base', description: 'Create task pages, append summaries, and keep workspace databases up to date.', authType: 'OAuth', installedByDefault: false },
    { id: 6, slug: 'linkedin-jobs', name: 'LinkedIn Jobs', category: 'Career', description: 'Track saved jobs, application stages, and recruiter outreach activity.', authType: 'OAuth', installedByDefault: false },
    { id: 7, slug: 'hubspot-crm', name: 'HubSpot CRM', category: 'Sales', description: 'Create contacts, update deal stages, and route qualified leads.', authType: 'API Key', installedByDefault: false },
    { id: 8, slug: 'stripe-events', name: 'Stripe Events', category: 'Billing', description: 'Route checkout, invoice, and subscription events into automation workflows.', authType: 'Webhook Secret', installedByDefault: false },
    { id: 9, slug: 'github-actions', name: 'GitHub Actions', category: 'Engineering', description: 'Trigger repository workflows and notify teams when builds complete.', authType: 'Personal Access Token', installedByDefault: false },
  ];
  const billingPlans: BillingPlan[] = [
    { id: 1, code: 'free', name: 'Free', monthlyPriceCents: 0, workflowLimit: 5, executionLimit: 1000 },
    { id: 2, code: 'team', name: 'Team', monthlyPriceCents: 4900, workflowLimit: 100, executionLimit: 50000 },
    { id: 3, code: 'enterprise', name: 'Enterprise', monthlyPriceCents: 19900, workflowLimit: 1000, executionLimit: 1000000 },
  ];
  return {
    webhooks: [
      { id: 1, name: 'Job board intake', workflowId: 102, workflowName: 'Job Application Tracker', secret: 'whsec_jobs_8fj3', url: 'http://localhost:8080/api/webhooks/whsec_jobs_8fj3/trigger', createdAt: now(-8 * 86400000), hitCount: 184, lastTriggeredAt: now(-36 * 60000) },
      { id: 2, name: 'Lead capture form', workflowId: 103, workflowName: 'Lead Routing', secret: 'whsec_leads_4ad1', url: 'http://localhost:8080/api/webhooks/whsec_leads_4ad1/trigger', createdAt: now(-14 * 86400000), hitCount: 72, lastTriggeredAt: now(-6 * 3600000) },
    ],
    schedules: [
      { id: 1, workflowId: 101, workflowName: 'Daily Morning Routine', cronExpression: '0 7 * * *', enabled: true, nextRunAt: now(13 * 3600000), lastRunAt: now(-11 * 3600000), lastStatus: 'SUCCESS' },
      { id: 2, workflowId: 105, workflowName: 'Weekly Digest', cronExpression: '30 16 * * 5', enabled: false, nextRunAt: now(3 * 86400000), lastRunAt: now(-4 * 86400000), lastStatus: 'FAILED' },
    ],
    notifications: [
      { id: 1, title: 'Workflow run failed', message: 'Weekly Digest failed during the Transform node.', type: 'FAILURE', workflowId: 3, executionId: 42, read: false, createdAt: now(-18 * 60000) },
      { id: 2, title: 'Webhook received', message: 'Job Application Tracker received 12 updates in the last hour.', type: 'INFO', workflowId: 102, read: false, createdAt: now(-53 * 60000) },
      { id: 3, title: 'Schedule completed', message: 'Daily Morning Routine completed successfully.', type: 'SUCCESS', workflowId: 101, executionId: 501, read: true, createdAt: now(-7 * 3600000) },
    ],
    audit: [
      { id: 1, action: 'WORKFLOW_UPDATED', resourceType: 'WORKFLOW', resourceId: 101, resourceName: 'Daily Morning Routine', userId: 1, userEmail: 'tanmay.yenpure@agentrix.ai', metadata: '{"nodes":4,"edges":3}', createdAt: now(-35 * 60000) },
      { id: 2, action: 'WEBHOOK_CREATED', resourceType: 'WEBHOOK', resourceId: 1, resourceName: 'Job board intake', userId: 2, userEmail: 'ishaan.oak@agentrix.ai', metadata: '{"workflowId":102}', createdAt: now(-8 * 86400000) },
      { id: 3, action: 'APIKEY_REVOKED', resourceType: 'APIKEY', resourceId: 4, resourceName: 'Legacy integration', userId: 5, userEmail: 'milind.godse@agentrix.ai', metadata: '{"reason":"rotation"}', createdAt: now(-11 * 86400000) },
    ],
    apiKeys: [
      { id: 1, name: 'Production connector', keyPrefix: 'ff_sk_prod_8a2...', createdAt: now(-20 * 86400000), lastUsedAt: now(-45 * 60000), active: true },
      { id: 2, name: 'Reporting sandbox', keyPrefix: 'ff_sk_sbox_52c...', createdAt: now(-5 * 86400000), expiresAt: now(25 * 86400000), active: true },
    ],
    org: { id: 1, name: 'Agentrix Workspace', memberCount: 5, createdAt: now(-90 * 86400000) },
    members: [
      { id: 1, fullName: 'Tanmay Yenpure', email: 'tanmay.yenpure@agentrix.ai', role: 'ADMIN', joinedAt: now(-90 * 86400000), lastActiveAt: now(-12 * 60000) },
      { id: 2, fullName: 'Ishaan Oak', email: 'ishaan.oak@agentrix.ai', role: 'USER', joinedAt: now(-58 * 86400000), lastActiveAt: now(-47 * 60000) },
      { id: 3, fullName: 'Advay Bapat', email: 'advay.bapat@agentrix.ai', role: 'USER', joinedAt: now(-42 * 86400000), lastActiveAt: now(-3 * 3600000) },
      { id: 4, fullName: 'Shreya Pathak', email: 'shreya.pathak@agentrix.ai', role: 'USER', joinedAt: now(-27 * 86400000), lastActiveAt: now(-22 * 3600000) },
      { id: 5, fullName: 'Milind Godse', email: 'milind.godse@agentrix.ai', role: 'USER', joinedAt: now(-19 * 86400000), lastActiveAt: now(-2 * 86400000) },
    ],
    workflows,
    executions,
    agents: [
      { id: 201, name: 'Career Copilot', instructions: 'Analyze job descriptions, tailor application notes, and recommend follow-up actions based on role fit.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-24 * 86400000), updatedAt: now(-38 * 60000) },
      { id: 202, name: 'Recruiter Reply Agent', instructions: 'Draft concise, professional replies to recruiter emails with context-aware tone and next-step suggestions.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-22 * 86400000), updatedAt: now(-2 * 3600000) },
      { id: 203, name: 'Daily Planner Agent', instructions: 'Convert calendar events, deadlines, and priorities into a focused morning action plan.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-21 * 86400000), updatedAt: now(-5 * 3600000) },
      { id: 204, name: 'Inbox Triage Agent', instructions: 'Classify messages by urgency, sender intent, and required response window.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-19 * 86400000), updatedAt: now(-7 * 3600000) },
      { id: 205, name: 'Meeting Brief Agent', instructions: 'Prepare crisp meeting briefs with attendees, agenda risks, recent context, and suggested talking points.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-18 * 86400000), updatedAt: now(-1 * 86400000) },
      { id: 206, name: 'Lead Qualification Agent', instructions: 'Score inbound leads by fit, urgency, budget signals, and missing information.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-17 * 86400000), updatedAt: now(-3 * 3600000) },
      { id: 207, name: 'CRM Hygiene Agent', instructions: 'Detect duplicate contacts, incomplete records, stale stages, and recommended CRM cleanup actions.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-16 * 86400000), updatedAt: now(-12 * 3600000) },
      { id: 208, name: 'Support Escalation Agent', instructions: 'Summarize support issues, classify severity, identify owner, and suggest customer-facing updates.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-15 * 86400000), updatedAt: now(-10 * 3600000) },
      { id: 209, name: 'Incident Commander Agent', instructions: 'Turn workflow failures into impact summaries, likely root cause, and a practical recovery checklist.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-14 * 86400000), updatedAt: now(-4 * 3600000) },
      { id: 210, name: 'Finance Reconciliation Agent', instructions: 'Compare payment events, invoice status, and customer records to flag mismatches.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-13 * 86400000), updatedAt: now(-8 * 3600000) },
      { id: 211, name: 'Content Repurpose Agent', instructions: 'Convert long notes into LinkedIn posts, short summaries, internal updates, and newsletter drafts.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-12 * 86400000), updatedAt: now(-18 * 3600000) },
      { id: 212, name: 'Research Synthesizer Agent', instructions: 'Extract key facts from research notes and produce a sourced executive summary with open questions.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-10 * 86400000), updatedAt: now(-6 * 3600000) },
      { id: 213, name: 'Approval Routing Agent', instructions: 'Inspect requests, choose the correct approver, and generate a compact approval summary.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-9 * 86400000), updatedAt: now(-14 * 3600000) },
      { id: 214, name: 'Data Quality Agent', instructions: 'Find missing fields, format mismatches, suspicious values, and cleanup recommendations for workflow payloads.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-8 * 86400000), updatedAt: now(-11 * 3600000) },
      { id: 215, name: 'Customer Success Agent', instructions: 'Summarize account health, renewal risks, product blockers, and next-best actions for customer teams.', model: 'agentrix-pro-v1', enabled: true, createdAt: now(-7 * 86400000), updatedAt: now(-9 * 3600000) },
      { id: 216, name: 'Security Review Agent', instructions: 'Review automation changes for exposed secrets, unsafe webhooks, and suspicious permission patterns.', model: 'agentrix-pro-v1', enabled: false, createdAt: now(-6 * 86400000), updatedAt: now(-2 * 86400000) },
    ],
    connectors,
    connectorCredentials: [
      { id: 301, connectorSlug: 'slack-alert', displayName: 'Ops Slack webhook', createdAt: now(-10 * 86400000) },
      { id: 302, connectorSlug: 'crm-lead-routing', displayName: 'CRM sandbox key', createdAt: now(-4 * 86400000) },
    ],
    billingPlans,
    subscription: { id: 1, status: 'active', plan: billingPlans[1] },
  };
}

export function readStore(): StoreShape {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const initial = seed();
    localStorage.setItem(KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return { ...seed(), ...JSON.parse(raw) } as StoreShape;
  } catch {
    const initial = seed();
    localStorage.setItem(KEY, JSON.stringify(initial));
    return initial;
  }
}

export function writeStore(store: StoreShape) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

export function nextId(items: { id: number }[]) {
  return Math.max(0, ...items.map((item) => item.id)) + 1;
}

export function workflowName(workflows: WorkflowResponse[], workflowId: number) {
  return workflows.find((workflow) => workflow.id === workflowId)?.name || `Workflow #${workflowId}`;
}
