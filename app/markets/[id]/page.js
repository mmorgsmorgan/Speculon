'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import ApprovalVoteModal from '@/components/ApprovalVoteModal';
import PredictionModal from '@/components/PredictionModal';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function MarketDetailPage() {
  const { user, updateBalance } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [market, setMarket] = useState(null);
  const [platformSettings, setPlatformSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  useEffect(() => {
    if (params.id) fetchMarket();
  }, [params.id]);

  const fetchMarket = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/markets/${params.id}`);
      const data = await response.json();
      if (response.ok) {
        setMarket(data.market);
        if (data.settings) setPlatformSettings(data.settings);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to fetch market:', error);
      router.push('/');
    }
    setLoading(false);
  };

  const handleVoteSuccess = (data) => {
    fetchMarket();
    if (data.statusUpdate === 'approved') {
      alert('Market approved! It can now be activated by an admin.');
    }
  };

  const handlePredictionSuccess = (data) => {
    fetchMarket();
    if (updateBalance) updateBalance(data.newBalance);
  };

  const handleSubmitDispute = async () => {
    if (!disputeReason.trim() || disputeReason.length < 10) {
      alert('Please provide a detailed reason (at least 10 characters)');
      return;
    }
    setSubmittingDispute(true);
    try {
      const res = await fetch(`/api/markets/${params.id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: disputeReason }),
      });
      if (res.ok) {
        alert('Dispute submitted successfully!');
        setShowDisputeModal(false);
        setDisputeReason('');
        fetchMarket();
      } else {
        const error = await res.json();
        alert(`Failed to submit dispute: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to submit dispute:', error);
      alert('Failed to submit dispute');
    } finally {
      setSubmittingDispute(false);
    }
  };

  const isWithinDisputeWindow = () => {
    if (market?.status !== 'resolved' || !market.resolution_time) return false;
    const resolvedAt = new Date(market.resolution_time);
    const hoursElapsed = (new Date() - resolvedAt) / 3600000;
    const disputeHours = parseFloat(platformSettings.dispute_window_hours) || 24;
    return hoursElapsed < disputeHours;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!market) return null;

  const formatDate = (s) =>
    new Date(s).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const calculatePercentage = (staked) => {
    if (!market.total_pool || market.total_pool === 0) return 0;
    return ((parseFloat(staked || 0) / market.total_pool) * 100).toFixed(1);
  };

  const statusLabel = (market.status || 'proposed').toUpperCase();
  const approvalThreshold = parseFloat(platformSettings?.required_approval_votes) || 10;
  const approvalCount = market.approval_votes?.approve || 0;

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container mx-auto px-8 lg:px-12 py-12 max-w-6xl">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 mb-10 text-[13px]"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to markets
        </button>

        <section className="mb-10">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <span className="section-marker">
              <span className="section-marker-num">§</span> 01 / {statusLabel}
            </span>
            <span className="eyebrow">CREATED {formatDate(market.created_at).toUpperCase()}</span>
          </div>

          <h1 className="editorial-heading" style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>
            {market.question}
          </h1>

          {market.description && (
            <p
              className="mt-6 max-w-3xl text-[17px] leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              {market.description}
            </p>
          )}

          <p className="mt-6 eyebrow">
            BY {(market.creator?.username || 'UNKNOWN').toUpperCase()}
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="surface-card-sm">
            <p className="eyebrow mb-3">TOTAL POOL</p>
            <p className="text-[28px] font-mono font-medium">
              {market.total_pool || 0}
              <span className="ml-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                LO
              </span>
            </p>
          </div>
          <div className="surface-card-sm">
            <p className="eyebrow mb-3">PREDICTIONS</p>
            <p className="text-[28px] font-mono font-medium">{market.predictions_count || 0}</p>
          </div>
          <div className="surface-card-sm">
            <p className="eyebrow mb-3">CLOSES</p>
            <p className="text-[15px] font-medium leading-tight">{formatDate(market.close_time)}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="surface-card">
              <div className="flex items-center justify-between mb-6">
                <span className="section-marker">
                  <span className="section-marker-num">02</span> / OUTCOMES
                </span>
                <span className="eyebrow">DISTRIBUTION</span>
              </div>

              <div className="space-y-4">
                {market.outcomes?.map((outcome, index) => {
                  const pct = calculatePercentage(outcome.total_staked);
                  return (
                    <div
                      key={outcome.id}
                      className="rounded-xl p-4"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <span className="eyebrow mr-2">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[16px] font-medium">{outcome.outcome_text}</span>
                          <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                            {outcome.total_staked} LO staked
                          </p>
                        </div>
                        <p
                          className="text-[24px] font-mono font-medium"
                          style={{ color: 'var(--accent)' }}
                        >
                          {pct}%
                        </p>
                      </div>
                      <div
                        className="h-[3px] rounded-full overflow-hidden"
                        style={{ background: 'var(--bg-sunken)' }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            background: 'var(--accent)',
                            height: '100%',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="surface-card sticky top-6">
              <span className="section-marker mb-5 block">
                <span className="section-marker-num">03</span> / ACTION
              </span>

              {market.status === 'proposed' && (
                <div>
                  <p className="text-[14px] mb-5" style={{ color: 'var(--text-muted)' }}>
                    This market needs community approval before opening.
                  </p>
                  <div className="mb-5">
                    <div className="flex items-center justify-between eyebrow mb-2">
                      <span>APPROVAL</span>
                      <span style={{ color: 'var(--text)' }}>
                        {approvalCount} / {approvalThreshold}
                      </span>
                    </div>
                    <div
                      className="h-[3px] rounded-full overflow-hidden"
                      style={{ background: 'var(--bg-sunken)' }}
                    >
                      <div
                        style={{
                          width: `${Math.min((approvalCount / approvalThreshold) * 100, 100)}%`,
                          background: 'var(--accent)',
                          height: '100%',
                        }}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVoteModal(true)}
                    className="btn-mint w-full"
                  >
                    Vote to approve
                  </button>
                </div>
              )}

              {market.status === 'live' && (
                <div>
                  <p className="text-[14px] mb-5" style={{ color: 'var(--text-muted)' }}>
                    Place your prediction on the outcome you believe will happen.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPredictionModal(true)}
                    className="btn-mint w-full"
                  >
                    Place prediction
                  </button>
                </div>
              )}

              {(market.status === 'closed' || market.status === 'resolved') && (
                <div>
                  <p className="eyebrow mb-3">STATUS</p>
                  <p className="text-[14px] mb-5" style={{ color: 'var(--text-muted)' }}>
                    This market is {market.status}. No new predictions allowed.
                  </p>

                  {market.status === 'resolved' && isWithinDisputeWindow() && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowDisputeModal(true)}
                        className="btn-outline w-full inline-flex items-center justify-center gap-2"
                        style={{ color: 'var(--danger)' }}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Dispute resolution
                      </button>
                      <p className="mt-3 eyebrow">
                        WINDOW CLOSES IN{' '}
                        {Math.floor(
                          (parseFloat(platformSettings.dispute_window_hours) || 24) -
                            (new Date() - new Date(market.resolution_time)) / 3600000
                        )}
                        H
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {showVoteModal && (
        <ApprovalVoteModal
          market={market}
          userId={user?.id}
          onClose={() => setShowVoteModal(false)}
          onVoteSuccess={handleVoteSuccess}
        />
      )}

      {showPredictionModal && user && (
        <PredictionModal
          market={market}
          user={user}
          onClose={() => setShowPredictionModal(false)}
          onSuccess={handlePredictionSuccess}
        />
      )}

      {showDisputeModal && user && (
        <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg rounded-3xl p-8"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start gap-4 mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ border: '1px solid var(--border)' }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
              </div>
              <div>
                <p className="section-marker mb-1">
                  <span className="section-marker-num">§</span> DISPUTE
                </p>
                <h3 className="text-[22px] font-medium">Dispute resolution</h3>
                <p className="mt-1 text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  Explain why you believe this resolution is incorrect.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="eyebrow block mb-2">REASON *</label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Provide detailed evidence and reasoning…"
                className="input-paper resize-none"
                rows={5}
              />
              <p className="mt-2 eyebrow">MIN 10 CHARACTERS</p>
            </div>

            <div className="surface-card-sm mb-6" style={{ background: 'var(--bg-sunken)' }}>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                Submitting a dispute flags this market for admin review. The admin will decide
                whether to uphold, overturn, or invalidate the resolution.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDisputeModal(false);
                  setDisputeReason('');
                }}
                className="btn-outline flex-1"
                disabled={submittingDispute}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitDispute}
                disabled={submittingDispute || disputeReason.length < 10}
                className="btn-mint flex-1"
              >
                {submittingDispute ? 'Submitting…' : 'Submit dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
