'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, RefreshCw, Sparkles, Brain, Activity, Shield,
  TrendingUp, BarChart3, Zap, Database
} from 'lucide-react';

const TONE = {
  default: 'var(--text)',
  muted:   'var(--text-muted)',
  accent:  'var(--accent)',
  danger:  'var(--danger)'
};

function StatCard({ icon: Icon, label, value, sub, tone = 'default' }) {
  const color = TONE[tone];
  return (
    <div className="surface-card-sm">
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="font-mono text-[22px] font-medium" style={{ color }}>{value}</span>
      </div>
      <p className="text-[13px] font-medium">{label}</p>
      {sub && <p className="text-[12px] text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  );
}

function FunnelBar({ label, count, total, tone = 'accent' }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-[var(--text-muted)] w-20 text-right flex-shrink-0 uppercase tracking-wider">{label}</span>
      <div className="flex-1 h-5 rounded-[4px] overflow-hidden" style={{ background: 'var(--bg-sunken)' }}>
        <div
          className="h-full rounded-[4px] transition-all duration-500"
          style={{ width: `${Math.max(pct, 1)}%`, background: TONE[tone] }}
        />
      </div>
      <span className="font-mono text-[13px] w-12 flex-shrink-0">{count}</span>
    </div>
  );
}

export default function AIDashboard() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchDashboard();
  }, [isAdmin, router]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ai-dashboard');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch AI dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  const ps = data?.proposalStats || {};
  const ts = data?.topicStats || {};
  const topicFunnelTotal = ts.total || 1;

  const KV = ({ label, value }) => (
    <div className="flex justify-between text-[13px]">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="p-2 rounded-[10px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            style={{ border: '1px solid var(--border)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <div className="section-marker mb-2">
              <span className="section-marker-num">§ AI</span> / PIPELINE
            </div>
            <h1 className="text-[36px] font-medium tracking-tight flex items-center gap-3">
              AI dashboard
            </h1>
            <p className="text-[15px] text-[var(--text-muted)] mt-1">Pipeline performance, model config, and feedback metrics.</p>
          </div>
          <button
            onClick={fetchDashboard}
            className="btn-outline inline-flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading && !data ? (
          <div className="text-center py-20">
            <RefreshCw className="w-6 h-6 text-[var(--accent)] animate-spin mx-auto mb-4" />
            <p className="text-[14px] text-[var(--text-muted)]">Loading AI metrics…</p>
          </div>
        ) : data ? (
          <div className="space-y-10">
            {/* Proposal Stats */}
            <section>
              <h2 className="text-[18px] font-medium mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                Proposal metrics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard icon={BarChart3} label="Total proposals"  value={ps.total || 0} tone="default" />
                <StatCard icon={Zap}       label="Pending review"   value={ps.pending || 0} tone="muted"   sub="Awaiting admin action" />
                <StatCard icon={TrendingUp} label="Approved"        value={(ps.approved || 0) + (ps.edited || 0)} tone="accent" sub={`${ps.edited || 0} edited`} />
                <StatCard icon={Shield}    label="Rejected"         value={ps.rejected || 0} tone="danger" />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="surface-card-sm">
                  <p className="eyebrow mb-2">Avg AI confidence</p>
                  <p className="font-mono text-[22px] font-medium">
                    {ps.avgConfidence ? `${(ps.avgConfidence * 100).toFixed(1)}%` : '—'}
                  </p>
                </div>
                <div className="surface-card-sm">
                  <p className="eyebrow mb-2">Avg engagement score</p>
                  <p className="font-mono text-[22px] font-medium">
                    {ps.avgEngagementScore ? (ps.avgEngagementScore * 100).toFixed(1) : '—'}
                  </p>
                </div>
              </div>
            </section>

            {/* Topic Funnel */}
            <section>
              <h2 className="text-[18px] font-medium mb-4 flex items-center gap-2">
                <Database className="w-4 h-4 text-[var(--accent)]" />
                Topic funnel
              </h2>
              <div className="surface-card-sm space-y-2.5">
                <FunnelBar label="Detected"  count={ts.detected || 0} total={topicFunnelTotal} tone="muted" />
                <FunnelBar label="Scored"    count={ts.scored || 0}   total={topicFunnelTotal} tone="muted" />
                <FunnelBar label="Filtered"  count={ts.filtered || 0} total={topicFunnelTotal} tone="muted" />
                <FunnelBar label="Proposed"  count={ts.proposed || 0} total={topicFunnelTotal} tone="accent" />
                <FunnelBar label="Approved"  count={ts.approved || 0} total={topicFunnelTotal} tone="accent" />
                <FunnelBar label="Rejected"  count={ts.rejected || 0} total={topicFunnelTotal} tone="danger" />
                <div className="divider-line mt-3" />
                <div className="text-[12px] text-[var(--text-muted)] text-right pt-1 font-mono">
                  Total topics: {ts.total || 0}
                </div>
              </div>
            </section>

            {/* Feedback & Policy Events */}
            <section className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-[18px] font-medium mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--accent)]" />
                  Feedback events
                </h2>
                <div className="surface-card-sm space-y-3">
                  <KV label="Total events"      value={data.feedbackEventCount || 0} />
                  <KV label="Aggregation runs"  value={data.feedbackEventBreakdown?.aggregationRuns || 0} />
                  <KV label="Model updates"     value={data.feedbackEventBreakdown?.modelUpdates || 0} />
                </div>
              </div>

              <div>
                <h2 className="text-[18px] font-medium mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--danger)]" />
                  Policy events ({data.policyEventCount || 0})
                </h2>
                <div className="surface-card-sm">
                  {data.policyReasonCodes && Object.keys(data.policyReasonCodes).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(data.policyReasonCodes)
                        .sort(([, a], [, b]) => b - a)
                        .map(([code, count]) => (
                          <div key={code} className="flex justify-between text-[13px]">
                            <span className="text-[var(--text-muted)] font-mono text-[12px]">{code}</span>
                            <span className="font-mono font-medium">{count}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-[13px] text-[var(--text-muted)]">No policy events recorded.</p>
                  )}
                </div>
              </div>
            </section>

            {/* Active Model Config */}
            <section>
              <h2 className="text-[18px] font-medium mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-[var(--accent)]" />
                Active model configuration
              </h2>
              {data.activeModel ? (
                <div className="surface-card-sm">
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="eyebrow mb-1">Model name</p>
                      <p className="font-mono text-[13px]">{data.activeModel.model_name}</p>
                    </div>
                    <div>
                      <p className="eyebrow mb-1">Version</p>
                      <p className="font-mono text-[13px]">{data.activeModel.version}</p>
                    </div>
                    <div>
                      <p className="eyebrow mb-1">Last updated</p>
                      <p className="text-[13px]">
                        {data.activeModel.updated_at && new Date(data.activeModel.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {data.activeModel.weights && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                      <p className="eyebrow-strong mb-3">Scoring weights</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(data.activeModel.weights).map(([key, val]) => (
                          <div key={key} className="rounded-[4px] px-3 py-2" style={{ background: 'var(--bg-sunken)' }}>
                            <p className="text-[11px] text-[var(--text-muted)] font-mono uppercase tracking-wider">{key}</p>
                            <p className="font-mono text-[13px] font-medium">{typeof val === 'number' ? val.toFixed(2) : JSON.stringify(val)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.activeModel.thresholds && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                      <p className="eyebrow-strong mb-3">Thresholds</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(data.activeModel.thresholds).map(([key, val]) => (
                          <div key={key} className="rounded-[4px] px-3 py-2" style={{ background: 'var(--bg-sunken)' }}>
                            <p className="text-[11px] text-[var(--text-muted)] font-mono uppercase tracking-wider">{key}</p>
                            <p className="font-mono text-[13px] font-medium">{typeof val === 'number' ? val.toFixed(3) : JSON.stringify(val)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="surface-card-sm text-center py-8">
                  <Brain className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                  <p className="text-[13px] text-[var(--text-muted)]">No active model configuration found.</p>
                  <p className="text-[12px] text-[var(--text-muted)] mt-1">A model config will appear after the feedback aggregator runs.</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="surface-card-sm text-center py-12">
            <Brain className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[14px] text-[var(--text-muted)]">Failed to load dashboard data.</p>
          </div>
        )}
      </div>
    </div>
  );
}
