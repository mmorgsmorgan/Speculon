'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';

export default function ResolveMarket() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const marketId = params.id;

  const [market, setMarket] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [resolutionReason, setResolutionReason] = useState('');
  const [resolving, setResolving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchMarket();
  }, [isAdmin, marketId, router]);

  const fetchMarket = async () => {
    try {
      const res = await fetch(`/api/markets/${marketId}`);
      if (res.ok) {
        const data = await res.json();
        setMarket(data.market || data);
      }
    } catch (error) {
      console.error('Failed to fetch market:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedOutcome) {
      alert('Please select a winning outcome');
      return;
    }

    if (!resolutionReason.trim()) {
      alert('Please provide a resolution reason');
      return;
    }

    if (!confirm(`Are you sure you want to resolve this market with "${selectedOutcome.outcome_text}" as the winner? Payouts will be distributed immediately.`)) {
      return;
    }

    setResolving(true);
    try {
      const res = await fetch(`/api/markets/${marketId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winningOutcomeId: selectedOutcome.id,
          resolutionReason: resolutionReason
        })
      });

      if (res.ok) {
        alert('Market resolved successfully! Payouts have been distributed.');
        router.push('/admin');
      } else {
        const error = await res.json();
        alert(`Failed to resolve market: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to resolve market:', error);
      alert('Failed to resolve market');
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[22px] font-medium mb-6">Market not found.</p>
          <button onClick={() => router.push('/admin')} className="btn-outline">
            Back to admin
          </button>
        </div>
      </div>
    );
  }

  const totalPool = market.outcomes?.reduce((sum, o) => sum + parseFloat(o.total_staked || 0), 0) || 0;
  const totalPredictions = market.predictions_count || 0;
  const canResolve = selectedOutcome && resolutionReason.trim() && !resolving;

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
          <span className="section-marker-num">§ RES</span> / RESOLUTION
        </div>

        <h1 className="text-[36px] font-medium tracking-tight mb-2">Resolve market</h1>
        <p className="text-[15px] text-[var(--text-muted)] mb-10 max-w-xl">
          Select the winning outcome and distribute payouts. Users will have 24h to dispute before this becomes final.
        </p>

        {/* Market Info */}
        <div className="surface-card mb-6">
          <h2 className="text-[22px] font-medium tracking-tight mb-3">{market.question}</h2>
          {market.description && (
            <p className="text-[14px] text-[var(--text-muted)] mb-6">{market.description}</p>
          )}

          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="eyebrow mb-1">Total pool</p>
              <p className="font-mono text-[22px] font-medium">{totalPool.toFixed(0)} <span className="text-[14px] text-[var(--text-muted)]">LO</span></p>
            </div>
            <div>
              <p className="eyebrow mb-1">Predictions</p>
              <p className="font-mono text-[22px] font-medium">{totalPredictions}</p>
            </div>
            <div>
              <p className="eyebrow mb-1">Status</p>
              <span className="tab-pill text-[12px]" data-active="true">{market.status}</span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="note-block mb-6 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 mt-1 flex-shrink-0 text-[var(--accent)]" />
          <div className="text-[13px] text-[var(--text-muted)]">
            <p className="font-medium text-[var(--text)] mb-1">Resolution notes</p>
            <ul className="space-y-1">
              <li>— Payouts distribute immediately to winning predictions.</li>
              <li>— Users have 24h to dispute. Market status reads &quot;resolved&quot; during the window.</li>
              <li>— After 24h with no disputes, market becomes final.</li>
            </ul>
          </div>
        </div>

        {/* Select Winning Outcome */}
        <h3 className="text-[18px] font-medium mb-3">Select winning outcome</h3>
        <div className="space-y-3 mb-8">
          {market.outcomes?.map(outcome => {
            const staked = parseFloat(outcome.total_staked || 0);
            const percentage = totalPool > 0 ? (staked / totalPool) * 100 : 0;
            const isSelected = selectedOutcome?.id === outcome.id;

            return (
              <button
                key={outcome.id}
                onClick={() => setSelectedOutcome(outcome)}
                className="w-full text-left surface-card-sm transition-all"
                style={{
                  borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                  background: isSelected ? 'var(--accent-soft)' : 'var(--card)',
                  color: isSelected ? 'var(--accent-ink)' : 'var(--text)'
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full border flex items-center justify-center"
                      style={{
                        borderColor: isSelected ? 'var(--accent)' : 'var(--border-strong)',
                        background: isSelected ? 'var(--accent)' : 'transparent'
                      }}
                    >
                      {isSelected && <CheckCircle className="w-3 h-3 text-[var(--accent-ink)]" />}
                    </div>
                    <p className="text-[16px] font-medium">{outcome.outcome_text}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[20px] font-medium">{percentage.toFixed(1)}%</p>
                    <p className="text-[12px] text-[var(--text-muted)]">{staked.toFixed(0)} LO staked</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-sunken)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      background: isSelected ? 'var(--accent)' : 'var(--border-strong)'
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Payout Preview */}
        {selectedOutcome && (
          <div className="surface-card-sm mb-6">
            <h4 className="text-[15px] font-medium flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
              Payout preview
            </h4>
            <div className="space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Winning pool</span>
                <span className="font-mono">{parseFloat(selectedOutcome.total_staked).toFixed(0)} LO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Losing pool</span>
                <span className="font-mono">
                  {(totalPool - parseFloat(selectedOutcome.total_staked)).toFixed(0)} LO
                </span>
              </div>
              <div className="divider-line my-3" />
              <div className="flex justify-between text-[14px]">
                <span className="font-medium">Total to distribute</span>
                <span className="font-mono font-medium text-[var(--accent)]">{totalPool.toFixed(0)} LO</span>
              </div>
              <p className="text-[12px] text-[var(--text-muted)] mt-4">
                Winners receive their original stake plus a proportional share of the losing pool.
              </p>
            </div>
          </div>
        )}

        {/* Resolution Reason */}
        <div className="mb-6">
          <label className="block text-[15px] font-medium mb-1.5">
            Resolution reason <span className="text-[var(--danger)]">*</span>
          </label>
          <p className="text-[13px] text-[var(--text-muted)] mb-3">
            Explain how you determined the winning outcome.
          </p>
          <textarea
            value={resolutionReason}
            onChange={(e) => setResolutionReason(e.target.value)}
            placeholder="e.g., Based on official announcement from..."
            className="input-paper resize-none"
            rows={3}
          />
        </div>

        <button
          onClick={handleResolve}
          disabled={!canResolve}
          className={canResolve ? 'btn-mint w-full' : 'btn-outline w-full'}
        >
          {resolving ? 'Resolving…' : 'Resolve market & distribute payouts'}
        </button>
      </div>
    </div>
  );
}
