'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

export default function PredictionModal({ market, user, onClose, onSuccess }) {
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fee = stakeAmount ? (parseFloat(stakeAmount) * 0.01).toFixed(2) : '0.00';
  const netStake = stakeAmount ? (parseFloat(stakeAmount) - parseFloat(fee)).toFixed(2) : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const stake = parseFloat(stakeAmount);

    if (!selectedOutcome) return setError('Please select an outcome');
    if (isNaN(stake) || stake < 1) return setError('Stake must be at least 1 point');
    if (stake > user.points_balance) return setError('Insufficient balance');

    setLoading(true);
    try {
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: market.id,
          outcomeId: selectedOutcome.id,
          stakeAmount: stake,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to place prediction');
      onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17, 17, 17, 0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="section-marker mb-2">
              <span className="section-marker-num">§</span> PREDICTION
            </p>
            <h2 className="text-[26px] font-medium tracking-tight">Place your stake</h2>
            <p className="mt-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Choose an outcome and stake your LO Points.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="surface-card-sm mb-6" style={{ background: 'var(--bg-sunken)' }}>
            <p className="eyebrow mb-2">MARKET</p>
            <p className="text-[15px] font-medium">{market.question}</p>
          </div>

          <div className="mb-6">
            <p className="eyebrow mb-3">SELECT OUTCOME *</p>
            <div className="space-y-3">
              {market.outcomes?.map((outcome, index) => {
                const percentage = market.total_pool > 0
                  ? ((parseFloat(outcome.total_staked || 0) / market.total_pool) * 100).toFixed(1)
                  : 0;
                const isSelected = selectedOutcome?.id === outcome.id;
                return (
                  <button
                    key={outcome.id}
                    type="button"
                    onClick={() => setSelectedOutcome(outcome)}
                    className="w-full p-4 rounded-xl text-left transition-colors"
                    style={{
                      border: '1px solid ' + (isSelected ? 'var(--accent)' : 'var(--border)'),
                      background: isSelected ? 'var(--accent-soft)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="eyebrow">{String(index + 1).padStart(2, '0')}</span>
                      <span
                        className="font-mono text-[13px]"
                        style={{ color: isSelected ? 'var(--accent-ink)' : 'var(--accent)' }}
                      >
                        {percentage}%
                      </span>
                    </div>
                    <p className="text-[15px] font-medium" style={{ color: isSelected ? 'var(--accent-ink)' : 'var(--text)' }}>
                      {outcome.outcome_text}
                    </p>
                    <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {outcome.total_staked} LO staked
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="stake" className="eyebrow block mb-2">
              STAKE AMOUNT *
            </label>
            <div className="relative">
              <input
                id="stake"
                type="number"
                min="1"
                step="0.01"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="input-paper font-mono text-[18px]"
                placeholder="0.00"
                required
              />
              <span
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px]"
                style={{ color: 'var(--text-muted)' }}
              >
                LO
              </span>
            </div>
            <div className="mt-2 flex justify-between text-[12px]">
              <span style={{ color: 'var(--text-muted)' }}>
                Available:{' '}
                <span className="font-mono" style={{ color: 'var(--text)' }}>
                  {user.points_balance}
                </span>{' '}
                LO
              </span>
              <button
                type="button"
                onClick={() => setStakeAmount(user.points_balance.toString())}
                style={{ color: 'var(--accent)' }}
                className="underline underline-offset-4"
              >
                Max
              </button>
            </div>
          </div>

          {stakeAmount && parseFloat(stakeAmount) > 0 && (
            <div className="surface-card-sm mb-6" style={{ background: 'var(--bg-sunken)' }}>
              <div className="flex justify-between text-[13px] mb-2">
                <span style={{ color: 'var(--text-muted)' }}>Stake amount</span>
                <span className="font-mono">{stakeAmount} LO</span>
              </div>
              <div className="flex justify-between text-[13px] mb-3">
                <span style={{ color: 'var(--text-muted)' }}>Platform fee (1%)</span>
                <span className="font-mono" style={{ color: 'var(--danger)' }}>
                  −{fee} LO
                </span>
              </div>
              <div className="divider-line my-3" />
              <div className="flex justify-between">
                <span className="text-[14px] font-medium">Net stake</span>
                <span className="font-mono text-[16px]" style={{ color: 'var(--accent)' }}>
                  {netStake} LO
                </span>
              </div>
            </div>
          )}

          <div className="surface-card-sm mb-6">
            <p className="eyebrow-strong mb-2">NOTE</p>
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              LO Points will be locked until market resolution. No editing or cancellation allowed.
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
            <button
              type="button"
              onClick={onClose}
              className="btn-outline flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedOutcome || !stakeAmount}
              className="btn-mint flex-1"
            >
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Placing…
                </span>
              ) : (
                'Place prediction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
