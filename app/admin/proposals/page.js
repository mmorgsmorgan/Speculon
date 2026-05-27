'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, XCircle, Edit3, ChevronDown, ChevronUp,
  RefreshCw, ArrowLeft, Sparkles, Clock, Zap
} from 'lucide-react';

// Tone maps every proposal status to a (bg, fg, border) triplet using design tokens.
// Selected = filled accent/danger; unselected = neutral outline.
const STATUS_TONE = {
  pending:  { bg: 'var(--card)',         fg: 'var(--text)',        border: 'var(--border)' },
  approved: { bg: 'var(--accent-soft)',  fg: 'var(--accent-ink)',  border: 'var(--accent)' },
  edited:   { bg: 'var(--accent-soft)',  fg: 'var(--accent-ink)',  border: 'var(--accent)' },
  rejected: { bg: 'var(--danger-soft)',  fg: 'var(--danger-ink)',  border: 'var(--danger)' },
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle,
  edited: Edit3,
  rejected: XCircle,
};

export default function AdminProposals() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

  // Pipeline control state
  const [pipelineEnabled, setPipelineEnabled] = useState(false);
  const [pipelineLastRun, setPipelineLastRun] = useState(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
  }, [isAdmin, router]);

  // Fetch pipeline status
  const fetchPipelineStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-pipeline');
      if (res.ok) {
        const data = await res.json();
        setPipelineEnabled(data.enabled);
        setPipelineLastRun(data.lastRun);
      }
    } catch (error) {
      console.error('Failed to fetch pipeline status:', error);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchPipelineStatus();
  }, [isAdmin, fetchPipelineStatus]);

  // Toggle pipeline on/off
  const handleTogglePipeline = async () => {
    setPipelineLoading(true);
    try {
      const res = await fetch('/api/admin/ai-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      if (res.ok) {
        const data = await res.json();
        setPipelineEnabled(data.enabled);
      }
    } catch (error) {
      console.error('Failed to toggle pipeline:', error);
    } finally {
      setPipelineLoading(false);
    }
  };

  // Trigger a manual pipeline run
  const handleTriggerPipeline = async () => {
    setTriggerLoading(true);
    setTriggerResult(null);
    try {
      const res = await fetch('/api/admin/ai-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger' }),
      });
      const data = await res.json();
      setTriggerResult(data);
      // Refresh proposals and pipeline status after trigger
      await Promise.all([fetchProposals(), fetchPipelineStatus()]);
    } catch (error) {
      console.error('Failed to trigger pipeline:', error);
      setTriggerResult({ message: 'Pipeline trigger failed', errors: [error.message] });
    } finally {
      setTriggerLoading(false);
    }
  };

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/api/admin/proposals?status=${statusFilter}`
        : '/api/admin/proposals';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (isAdmin) fetchProposals();
  }, [isAdmin, fetchProposals]);

  const handleAction = async (proposalId, action, extra = {}) => {
    setActionLoading(proposalId);
    try {
      const res = await fetch(`/api/admin/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        setEditingId(null);
        setRejectingId(null);
        setRejectionReason('');
        await fetchProposals();
      } else {
        const err = await res.json();
        alert(err.error || 'Action failed');
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const startEdit = (proposal) => {
    setEditingId(proposal.id);
    setEditForm({
      title: proposal.title || '',
      description: proposal.description || '',
      outcomes: proposal.outcomes || ['Yes', 'No'],
      resolutionCriteria: proposal.resolution_criteria || '',
      resolutionDate: proposal.resolution_date ? proposal.resolution_date.split('T')[0] : '',
      categories: proposal.categories || [],
    });
  };

  const counts = {
    all: proposals.length,
    pending: proposals.filter(p => p.status === 'pending').length,
    approved: proposals.filter(p => p.status === 'approved').length,
    rejected: proposals.filter(p => p.status === 'rejected').length,
  };

  if (!isAdmin) return null;

  const FILTER_TABS = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'edited', label: 'Edited' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const STATS = [
    { label: 'Total', count: counts.all, tone: 'default' },
    { label: 'Pending', count: counts.pending, tone: 'muted' },
    { label: 'Approved', count: counts.approved, tone: 'accent' },
    { label: 'Rejected', count: counts.rejected, tone: 'danger' },
  ];

  const TONE = {
    default: 'var(--text)',
    muted:   'var(--text-muted)',
    accent:  'var(--accent)',
    danger:  'var(--danger)',
  };

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
              <span className="section-marker-num">§ AI</span> / PROPOSALS
            </div>
            <h1 className="text-[36px] font-medium tracking-tight">AI proposals</h1>
            <p className="text-[15px] text-[var(--text-muted)] mt-1">Review and manage AI-generated market proposals.</p>
          </div>
          <button
            onClick={fetchProposals}
            className="btn-outline inline-flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Pipeline Control Panel */}
        <div className="surface-card-sm mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleTogglePipeline}
                disabled={pipelineLoading}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                style={{
                  background: pipelineEnabled ? 'var(--accent)' : 'var(--bg-sunken)',
                  border: '1px solid var(--border)',
                  opacity: pipelineLoading ? 0.5 : 1
                }}
              >
                <span
                  className="inline-block h-4 w-4 transform rounded-full transition-transform"
                  style={{
                    background: pipelineEnabled ? 'var(--accent-ink)' : 'var(--text-muted)',
                    transform: pipelineEnabled ? 'translateX(22px)' : 'translateX(2px)'
                  }}
                />
              </button>
              <div>
                <p className="text-[14px] font-medium" style={{ color: pipelineEnabled ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {pipelineEnabled ? 'Pipeline active' : 'Pipeline paused'}
                </p>
                {pipelineLastRun && (
                  <p className="text-[12px] text-[var(--text-muted)] font-mono">
                    Last run: {new Date(pipelineLastRun).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleTriggerPipeline}
              disabled={triggerLoading}
              className="btn-mint inline-flex items-center gap-2"
            >
              {triggerLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running pipeline…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Run now
                </>
              )}
            </button>
          </div>

          {/* Trigger result banner */}
          {triggerResult && (
            <div
              className="mt-4 p-3 rounded-[10px] text-[13px] flex items-start justify-between gap-2"
              style={{
                background: triggerResult.errors?.length ? 'var(--danger-soft)' : 'var(--accent-soft)',
                color: triggerResult.errors?.length ? 'var(--danger-ink)' : 'var(--accent-ink)',
                border: '1px solid ' + (triggerResult.errors?.length ? 'var(--danger)' : 'var(--accent)')
              }}
            >
              <div>
                <p className="font-medium">{triggerResult.message}</p>
                {triggerResult.fetched > 0 && (
                  <p className="text-[12px] mt-1 opacity-80 font-mono">
                    {triggerResult.fetched} posts → {triggerResult.topics} topics → {triggerResult.proposals} proposals
                  </p>
                )}
                {triggerResult.errors?.length > 0 && (
                  <p className="text-[12px] mt-1 opacity-70">{triggerResult.errors.join('; ')}</p>
                )}
              </div>
              <button
                onClick={() => setTriggerResult(null)}
                className="opacity-60 hover:opacity-100 flex-shrink-0"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {STATS.map(stat => (
            <div key={stat.label} className="surface-card-sm">
              <span className="font-mono text-[22px] font-medium" style={{ color: TONE[stat.tone] }}>{stat.count}</span>
              <p className="eyebrow mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {FILTER_TABS.map(filter => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className="tab-pill whitespace-nowrap"
              data-active={statusFilter === filter.value ? 'true' : 'false'}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Proposals List */}
        {loading ? (
          <div className="text-center py-20">
            <RefreshCw className="w-6 h-6 text-[var(--accent)] animate-spin mx-auto mb-4" />
            <p className="text-[14px] text-[var(--text-muted)]">Loading proposals…</p>
          </div>
        ) : proposals.length === 0 ? (
          <div className="surface-card-sm text-center py-12">
            <Sparkles className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[15px] font-medium">No proposals found.</p>
            <p className="text-[13px] text-[var(--text-muted)] mt-1">
              {statusFilter ? 'Try a different filter.' : 'AI pipeline has not generated proposals yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map(proposal => {
              const StatusIcon = STATUS_ICONS[proposal.status] || Clock;
              const isExpanded = expandedId === proposal.id;
              const isEditing = editingId === proposal.id;
              const isRejecting = rejectingId === proposal.id;
              const tone = STATUS_TONE[proposal.status] || STATUS_TONE.pending;

              return (
                <div
                  key={proposal.id}
                  className="rounded-[16px] overflow-hidden"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  {/* Proposal Header */}
                  <div
                    className="p-5 cursor-pointer transition-colors hover:bg-[var(--bg-sunken)]"
                    onClick={() => setExpandedId(isExpanded ? null : proposal.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] text-[11px] font-medium uppercase tracking-wider"
                            style={{ background: tone.bg, color: tone.fg, border: '1px solid ' + tone.border }}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {proposal.status}
                          </span>
                          {proposal.generated_by && (
                            <span className="tab-pill text-[11px]">{proposal.generated_by}</span>
                          )}
                          {proposal.ai_confidence != null && (
                            <span className="tab-pill text-[11px] font-mono">
                              {(proposal.ai_confidence * 100).toFixed(0)}% confidence
                            </span>
                          )}
                          {(proposal.categories || []).map(cat => (
                            <span key={cat} className="tab-pill text-[11px]">{cat}</span>
                          ))}
                        </div>
                        <h3 className="text-[18px] font-medium tracking-tight truncate">{proposal.title}</h3>
                        <p className="text-[13px] text-[var(--text-muted)] mt-1 line-clamp-2">{proposal.description}</p>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {proposal.engagement_score != null && (
                          <span className="text-[12px] text-[var(--text-muted)] font-mono">
                            Score: {(proposal.engagement_score * 100).toFixed(0)}
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-5 space-y-4" style={{ borderTop: '1px solid var(--border)' }}>
                      {/* Topic Source Info */}
                      {proposal.topic && (
                        <div className="note-block">
                          <h4 className="eyebrow-strong mb-2">Source topic</h4>
                          <p className="text-[14px] font-medium">{proposal.topic.label}</p>
                          <p className="text-[13px] text-[var(--text-muted)] mt-1">{proposal.topic.summary}</p>
                          <div className="flex gap-4 mt-2 text-[12px] text-[var(--text-muted)] font-mono">
                            <span>Status: {proposal.topic.status}</span>
                            {proposal.topic.engagement_score != null && (
                              <span>Engagement: {(proposal.topic.engagement_score * 100).toFixed(0)}</span>
                            )}
                            {proposal.topic.source_breakdown && (
                              <span>Sources: {Object.keys(proposal.topic.source_breakdown).join(', ')}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Proposal Details */}
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-[13px] text-[var(--text-muted)] block mb-1">Title</label>
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                              className="input-paper"
                            />
                          </div>
                          <div>
                            <label className="text-[13px] text-[var(--text-muted)] block mb-1">Description</label>
                            <textarea
                              value={editForm.description}
                              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                              rows={3}
                              className="input-paper resize-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[13px] text-[var(--text-muted)] block mb-1">Resolution date</label>
                              <input
                                type="date"
                                value={editForm.resolutionDate}
                                onChange={e => setEditForm({ ...editForm, resolutionDate: e.target.value })}
                                className="input-paper font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[13px] text-[var(--text-muted)] block mb-1">Outcomes</label>
                              <input
                                type="text"
                                value={(editForm.outcomes || []).join(', ')}
                                onChange={e => setEditForm({ ...editForm, outcomes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                className="input-paper"
                                placeholder="Yes, No"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[13px] text-[var(--text-muted)] block mb-1">Resolution criteria</label>
                            <textarea
                              value={editForm.resolutionCriteria}
                              onChange={e => setEditForm({ ...editForm, resolutionCriteria: e.target.value })}
                              rows={2}
                              className="input-paper resize-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(proposal.id, 'edit_approve', { edits: editForm })}
                              disabled={actionLoading === proposal.id}
                              className="btn-mint"
                            >
                              Save & approve
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn-outline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-[13px]">
                          {[
                            ['Outcomes', (proposal.outcomes || []).join(', ')],
                            ['Resolution', proposal.resolution_criteria],
                            ['Resolution date', proposal.resolution_date && new Date(proposal.resolution_date).toLocaleDateString()],
                            ['Reviewed by', proposal.reviewer?.username],
                            ['Rejection', proposal.rejection_reason],
                            ['Created', new Date(proposal.created_at).toLocaleString()],
                          ].filter(([, v]) => v != null && v !== '').map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span className="text-[var(--text-muted)] w-32 flex-shrink-0">{k}</span>
                              <span className={k === 'Rejection' ? 'text-[var(--danger)]' : ''}>{v}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Rejection input */}
                      {isRejecting && (
                        <div
                          className="p-4 rounded-[10px] space-y-3"
                          style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)' }}
                        >
                          <label className="text-[13px] block font-medium text-[var(--danger-ink)]">Rejection reason</label>
                          <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            rows={2}
                            placeholder="Why is this proposal being rejected?"
                            className="input-paper resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(proposal.id, 'reject', { rejectionReason })}
                              disabled={actionLoading === proposal.id || rejectionReason.trim().length < 3}
                              className="px-5 py-3 rounded-[10px] text-[14px] font-medium transition-colors disabled:opacity-50"
                              style={{ background: 'var(--danger)', color: 'var(--bg)', border: '1px solid var(--danger)' }}
                            >
                              Confirm reject
                            </button>
                            <button
                              onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                              className="btn-outline"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {proposal.status === 'pending' && !isEditing && !isRejecting && (
                        <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                          <button
                            onClick={() => handleAction(proposal.id, 'approve')}
                            disabled={actionLoading === proposal.id}
                            className="btn-mint inline-flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => startEdit(proposal)}
                            className="btn-outline inline-flex items-center gap-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            Edit & approve
                          </button>
                          <button
                            onClick={() => setRejectingId(proposal.id)}
                            className="btn-outline inline-flex items-center gap-2"
                            style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
