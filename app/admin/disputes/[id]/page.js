'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Ban, Loader2 } from 'lucide-react';

export default function DecideDispute() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const disputeId = params.id;

  const [dispute, setDispute] = useState(null);
  const [market, setMarket] = useState(null);
  const [decision, setDecision] = useState('');
  const [adminDecision, setAdminDecision] = useState('');
  const [newWinningOutcomeId, setNewWinningOutcomeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchDispute();
  }, [isAdmin, disputeId, router]);

  const fetchDispute = async () => {
    try {
      // Fetch all markets and find the one with this dispute
      const marketsRes = await fetch('/api/markets');
      if (marketsRes.ok) {
        const marketsData = await marketsRes.json();
        const allMarkets = marketsData.markets || [];
        const disputedMarkets = allMarkets.filter(m => m.status === 'disputed' || m.status === 'resolved');
        
        for (const mkt of disputedMarkets) {
          const disputesRes = await fetch(`/api/markets/${mkt.id}/dispute`);
          if (disputesRes.ok) {
            const disputesData = await disputesRes.json();
            const found = (disputesData.disputes || []).find(d => d.id === disputeId);
            if (found) {
              setDispute(found);
              setMarket(mkt);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch dispute:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!decision) {
      alert('Please select a decision');
      return;
    }

    if (!adminDecision.trim()) {
      alert('Please provide your reasoning');
      return;
    }

    if (decision === 'overturned' && !newWinningOutcomeId) {
      alert('Please select the correct winning outcome');
      return;
    }

    if (!confirm(`Are you sure you want to ${decision} this dispute? This action cannot be undone.`)) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/disputes/${disputeId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          adminDecision,
          newWinningOutcomeId: decision === 'overturned' ? newWinningOutcomeId : null
        })
      });

      if (res.ok) {
        alert(`Dispute ${decision} successfully!`);
        router.push('/admin');
      } else {
        const error = await res.json();
        alert(`Failed to decide dispute: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to decide dispute:', error);
      alert('Failed to decide dispute');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!dispute || !market) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[22px] font-medium mb-6">Dispute not found.</p>
          <button onClick={() => router.push('/admin')} className="btn-outline">
            Back to admin
          </button>
        </div>
      </div>
    );
  }

  const originalWinner = market.outcomes?.find(o => o.id === market.winning_outcome_id);

  const decisionOptions = [
    {
      id: 'upheld',
      Icon: CheckCircle,
      title: 'Uphold original resolution',
      copy: 'The original resolution is correct. Market will become final.',
      tone: 'accent'
    },
    {
      id: 'overturned',
      Icon: XCircle,
      title: 'Overturn & re-resolve',
      copy: 'Original resolution is incorrect. Select the correct winner below.',
      tone: 'accent'
    },
    {
      id: 'invalidated',
      Icon: Ban,
      title: 'Invalidate market',
      copy: 'Market cannot be resolved fairly. All predictions will be refunded.',
      tone: 'danger'
    }
  ];

  const canSubmit = decision && adminDecision.trim() && (decision !== 'overturned' || newWinningOutcomeId) && !submitting;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-[14px] text-[var(--text-muted)] hover:text-[var(--text)] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to admin
        </button>

        <div className="section-marker mb-3">
          <span className="section-marker-num">§ DIS</span> / DISPUTE
        </div>

        <h1 className="text-[36px] font-medium tracking-tight mb-2">Decide dispute</h1>
        <p className="text-[15px] text-[var(--text-muted)] mb-10 max-w-xl">
          Review the dispute and rule on it. Your decision is final and triggers payout adjustments.
        </p>

        {/* Market Info */}
        <div className="surface-card mb-6">
          <h2 className="text-[22px] font-medium tracking-tight mb-3">{market.question}</h2>
          {market.description && (
            <p className="text-[14px] text-[var(--text-muted)] mb-6">{market.description}</p>
          )}
          <div className="flex items-center gap-4 text-[13px]">
            <span className="tab-pill" data-active="true">Resolved</span>
            <span className="text-[var(--text-muted)]">
              Original winner: <span className="font-medium text-[var(--accent)]">{originalWinner?.outcome_text}</span>
            </span>
          </div>
        </div>

        {/* Dispute Details */}
        <div className="surface-card-sm mb-6">
          <h3 className="text-[15px] font-medium flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-[var(--danger)]" />
            Dispute details
          </h3>
          <div className="space-y-3 text-[13px]">
            <div>
              <p className="eyebrow mb-1">Initiated by</p>
              <p className="font-medium">{dispute.initiator?.username}</p>
            </div>
            <div>
              <p className="eyebrow mb-1">Reason</p>
              <p>{dispute.reason}</p>
            </div>
            <div>
              <p className="eyebrow mb-1">Disputed at</p>
              <p className="font-mono text-[var(--text-muted)]">{new Date(dispute.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Decision Options */}
        <h3 className="text-[18px] font-medium mb-3">Your decision</h3>
        <div className="grid grid-cols-1 gap-3 mb-8">
          {decisionOptions.map(({ id, Icon, title, copy, tone }) => {
            const isSelected = decision === id;
            const isDanger = tone === 'danger';
            return (
              <button
                key={id}
                onClick={() => setDecision(id)}
                className="surface-card-sm text-left transition-all"
                style={{
                  borderColor: isSelected ? (isDanger ? 'var(--danger)' : 'var(--accent)') : 'var(--border)',
                  background: isSelected ? (isDanger ? 'var(--danger-soft)' : 'var(--accent-soft)') : 'var(--card)',
                  color: isSelected ? (isDanger ? 'var(--danger-ink)' : 'var(--accent-ink)') : 'var(--text)'
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      borderColor: isSelected ? (isDanger ? 'var(--danger)' : 'var(--accent)') : 'var(--border-strong)',
                      background: isSelected ? (isDanger ? 'var(--danger)' : 'var(--accent)') : 'transparent'
                    }}
                  >
                    {isSelected && <CheckCircle className="w-3 h-3" style={{ color: isDanger ? 'var(--danger-ink)' : 'var(--accent-ink)' }} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-4 h-4" style={{ color: isDanger ? 'var(--danger)' : 'var(--accent)' }} />
                      <p className="text-[15px] font-medium">{title}</p>
                    </div>
                    <p className="text-[13px]" style={{ color: isSelected ? 'inherit' : 'var(--text-muted)' }}>
                      {copy}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Select New Winner (if overturned) */}
        {decision === 'overturned' && (
          <div className="surface-card-sm mb-6">
            <h4 className="text-[15px] font-medium mb-4">Select correct winner</h4>
            <div className="space-y-2">
              {market.outcomes?.map(outcome => {
                const isPicked = newWinningOutcomeId === outcome.id;
                const isCurrent = outcome.id === market.winning_outcome_id;
                return (
                  <button
                    key={outcome.id}
                    onClick={() => setNewWinningOutcomeId(outcome.id)}
                    className="w-full p-4 rounded-[10px] border text-left transition-all flex items-center gap-3"
                    style={{
                      borderColor: isPicked ? 'var(--accent)' : 'var(--border)',
                      background: isPicked ? 'var(--accent-soft)' : 'transparent',
                      color: isPicked ? 'var(--accent-ink)' : 'var(--text)'
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border flex items-center justify-center"
                      style={{
                        borderColor: isPicked ? 'var(--accent)' : 'var(--border-strong)',
                        background: isPicked ? 'var(--accent)' : 'transparent'
                      }}
                    >
                      {isPicked && <CheckCircle className="w-2.5 h-2.5 text-[var(--accent-ink)]" />}
                    </div>
                    <p className="text-[14px] font-medium">{outcome.outcome_text}</p>
                    {isCurrent && (
                      <span className="ml-auto tab-pill text-[11px]">Current winner</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Admin Reasoning */}
        <div className="mb-6">
          <label className="block text-[15px] font-medium mb-1.5">
            Your reasoning <span className="text-[var(--danger)]">*</span>
          </label>
          <p className="text-[13px] text-[var(--text-muted)] mb-3">
            Document the rationale for the public verdict feed.
          </p>
          <textarea
            value={adminDecision}
            onChange={(e) => setAdminDecision(e.target.value)}
            placeholder="Explain your decision and reasoning..."
            className="input-paper resize-none"
            rows={4}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={canSubmit ? 'btn-mint w-full' : 'btn-outline w-full'}
        >
          {submitting ? 'Submitting…' : 'Submit decision'}
        </button>
      </div>
    </div>
  );
}
