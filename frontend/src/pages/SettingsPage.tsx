import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Server, Shield, Hexagon, Sparkles } from 'lucide-react';
import { Card, Button, Input } from '../components/ui';
import { ApiKeysPanel } from './PlatformPages';
import { useToast } from '../components/ui/Toast';
import { billingApi } from '../api/endpoints';

export function SettingsPage() {
  const [apiUrl, setApiUrl] = useState('http://localhost:8080');
  const [saved, setSaved] = useState(false);
  const { pushToast } = useToast();

  function handleSave() {
    setSaved(true);
    pushToast({ kind: 'success', title: 'Settings saved' });
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure your Agentrix workspace</p>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--forge-border)' }}>
            <Server size={14} style={{ color: '#818cf8' }} />
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-sm font-semibold text-white">Backend Connection</h2>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <Input label="API Base URL" value={apiUrl} onChange={e => setApiUrl(e.target.value)} />
            <p className="text-xs text-slate-500">The frontend proxies <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '3px' }}>/api</code> to your Spring Boot backend. Change the Vite proxy in <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '3px' }}>vite.config.ts</code> to point to a different host.</p>
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--forge-border)' }}>
            <Shield size={14} style={{ color: '#10b981' }} />
            <h2 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-sm font-semibold text-white">Authentication</h2>
          </div>
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium">JWT Token</p>
                <p className="text-xs text-slate-500 mt-0.5">Stored in localStorage - expires in 24 hours</p>
              </div>
              <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}
                className="text-xs px-2.5 py-1 rounded-full font-medium">Active</span>
            </div>
          </div>
        </Card>

        <ApiKeysPanel />
        <BillingPanel />

        <Card style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(14,165,233,0.07))', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="p-5 flex items-center gap-3">
            <div
              style={{
                background: 'radial-gradient(circle at 30% 25%, #67e8f9 0%, #6366f1 42%, #111827 100%)',
                boxShadow: '0 0 22px rgba(99,102,241,0.55), inset 0 0 14px rgba(255,255,255,0.18)',
                border: '1px solid rgba(125,211,252,0.55)',
              }}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            >
              <Hexagon size={22} className="text-white" />
              <Sparkles size={10} className="absolute right-1.5 top-1.5 text-cyan-200" />
            </div>
            <div>
              <p style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-sm font-bold text-white">Agentrix</p>
              <p className="text-xs text-slate-500">AI Agent Automation - Java 21 + Spring Boot + React</p>
              <p className="text-xs text-indigo-400 mt-0.5">Build once. Automate intelligently.</p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave}>{saved ? 'Saved' : 'Save Changes'}</Button>
        </div>
      </div>
    </div>
  );
}

function BillingPanel() {
  const qc = useQueryClient();
  const { pushToast } = useToast();
  const { data: plans = [] } = useQuery({ queryKey: ['billingPlans'], queryFn: billingApi.plans });
  const { data: subscription } = useQuery({ queryKey: ['subscription'], queryFn: billingApi.subscription });
  const change = useMutation({
    mutationFn: billingApi.changePlan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
      pushToast({ kind: 'success', title: 'Plan updated' });
    },
  });

  return (
    <Card>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--forge-border)' }}>
        <h2 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-sm font-semibold text-white">Billing</h2>
        <span className="text-xs text-slate-500">{subscription ? `${subscription.plan.name} - ${subscription.status}` : 'No plan selected'}</span>
      </div>
      <div className="p-5 grid grid-cols-3 gap-3">
        {plans.map((plan) => (
          <div key={plan.code} className="rounded-lg p-4" style={{ background: 'var(--forge-surface-2)', border: '1px solid var(--forge-border)' }}>
            <p className="text-sm font-semibold text-white">{plan.name}</p>
            <p className="mt-1 text-xs text-slate-500">${(plan.monthlyPriceCents / 100).toFixed(0)}/mo</p>
            <p className="mt-3 text-xs text-slate-500">{plan.workflowLimit} workflows - {plan.executionLimit} executions</p>
            <Button className="mt-4 w-full justify-center" size="sm" variant={subscription?.plan.code === plan.code ? 'primary' : 'outline'} loading={change.isPending} onClick={() => change.mutate(plan.code)}>
              {subscription?.plan.code === plan.code ? 'Current' : 'Select'}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
