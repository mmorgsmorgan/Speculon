'use client';

import { useState } from 'react';
import { X, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';

export default function ApprovalVoteModal({ market, userId, onClose, onVoteSuccess }) {
  const [vote, setVote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVote = async () => {
    if (!vote) return setError('Please select approve or reject');

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/markets/${market.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, vote }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to vote');
      onVoteSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const tile = (key, Icon, label, sub) => {
    const isSelected = vote === key;
    return (
      <button
        type="button"
        onClick={() => setVote(key)}
        className="p-5 rounded-xl text-left transition-colors"
        style={{
          border: '1px solid ' + (isSelected ? 'var(--accent)' : 'var(--border)'),
          background: isSelected ? 'var(--accent-soft)' : 'transparent',
        }}
      >
        <Icon
          className="w-6 h-6 mb-3"
          style={{ color: isSelected ? 'var(--accent-ink)' : 'var(--text-muted)' }}
        />
        <p className="text-[15px] font-medium" style={{ color: isSelected ? 'var(--accent-ink)' : 'var(--text)' }}>
          {label}
        </p>
        <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {sub}
        </p>
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17, 17, 17, 0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="section-marker mb-2">
              <span className="section-marker-num">§</span> VOTE
            </p>
            <h2 className="text-[22px] font-medium tracking-tight">Approve this market</h2>
            <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Help decide if this market should go live.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="surface-card-sm mb-6" style={{ background: 'var(--bg-sunken)' }}>
          <p className="eyebrow mb-2">QUESTION</p>
          <p className="text-[14px] font-medium line-clamp-3">{market.question}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {tile('approve', ThumbsUp, 'Approve', 'Market should go live')}
          {tile('reject', ThumbsDown, 'Reject', 'Market should not go live')}
        </div>

        <div className="surface-card-sm mb-6">
          <p className="eyebrow-strong mb-2">NOTE</p>
          <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            One vote per user. Markets need 10 approvals to go live. Admins can override.
          </p>
        </div>

        {error && (
          <div
            className="mb-4 text-[13px] px-4 py-3 rounded-lg"
            style={{ border: '1px solid var(--border)', color: 'var(--danger)' }}
          >
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn-outline flex-1" disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleVote}
            disabled={!vote || loading}
            className="btn-mint flex-1"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Voting…
              </span>
            ) : (
              'Submit vote'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
