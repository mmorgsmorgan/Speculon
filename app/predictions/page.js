'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Loader2 } from 'lucide-react';

export default function MyPredictionsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    else if (user) fetchPredictions();
  }, [user, isAuthenticated]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/predictions?userId=${user.id}`);
      const data = await response.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    }
    setLoading(false);
  };

  if (!user) return null;

  const isActive = (p) => ['live', 'approved', 'proposed'].includes(p.market?.status);
  const isWon = (p) =>
    p.paid_out && parseFloat(p.payout_amount) > parseFloat(p.stake_amount);
  const isLost = (p) => p.paid_out && parseFloat(p.payout_amount || 0) === 0;

  const filtered = predictions.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'active') return isActive(p);
    if (filter === 'won') return isWon(p);
    if (filter === 'lost') return isLost(p);
    return true;
  });

  const stats = {
    total: predictions.length,
    active: predictions.filter(isActive).length,
    won: predictions.filter(isWon).length,
    lost: predictions.filter(isLost).length,
  };

  const totalStaked = predictions.reduce((sum, p) => sum + parseFloat(p.stake_amount || 0), 0);
  const totalWon = predictions.reduce((sum, p) => sum + parseFloat(p.payout_amount || 0), 0);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'won', label: 'Won' },
    { id: 'lost', label: 'Lost' },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container mx-auto px-8 lg:px-12 py-16">
        <section className="mb-14 max-w-3xl">
          <p className="section-marker mb-5">
            <span className="section-marker-num">§</span> 01 / LEDGER
          </p>
          <h1 className="editorial-heading" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
            Your prediction <span className="editorial-accent">history.</span>
          </h1>
          <p className="mt-4 text-[15px]" style={{ color: 'var(--text-muted)' }}>
            Track every stake you've placed and the outcomes that followed.
          </p>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'TOTAL', value: stats.total },
            { label: 'ACTIVE', value: stats.active },
            { label: 'WON', value: stats.won },
            { label: 'LOST', value: stats.lost },
          ].map((s) => (
            <div key={s.label} className="surface-card-sm">
              <p className="eyebrow mb-3">{s.label}</p>
              <p className="text-[28px] font-mono font-medium">{s.value}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="surface-card">
            <p className="eyebrow mb-3">TOTAL STAKED</p>
            <p className="text-[36px] font-mono font-medium">
              {totalStaked.toFixed(2)}
              <span className="ml-2 text-[14px]" style={{ color: 'var(--text-muted)' }}>
                LO
              </span>
            </p>
          </div>
          <div className="surface-card">
            <p className="eyebrow mb-3">TOTAL WON</p>
            <p
              className="text-[36px] font-mono font-medium"
              style={{ color: 'var(--accent)' }}
            >
              {totalWon.toFixed(2)}
              <span className="ml-2 text-[14px]" style={{ color: 'var(--text-muted)' }}>
                LO
              </span>
            </p>
          </div>
        </section>

        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {tabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className="px-4 py-2 rounded-full border text-[13px]"
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  color: active ? 'var(--accent-ink)' : 'var(--text)',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="surface-card text-center">
            <p className="eyebrow mb-3">EMPTY STATE</p>
            <h3 className="text-[22px] font-medium mb-2">No predictions yet.</h3>
            <p className="text-[14px] mb-6" style={{ color: 'var(--text-muted)' }}>
              Browse the markets and place your first stake.
            </p>
            <button type="button" onClick={() => router.push('/')} className="btn-mint">
              Browse markets
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((prediction, i) => {
              const won = isWon(prediction);
              const lost = isLost(prediction);
              const active = isActive(prediction);
              const statusLabel = active
                ? 'ACTIVE'
                : won
                ? 'WON'
                : lost
                ? 'LOST'
                : prediction.paid_out
                ? 'SETTLED'
                : 'PENDING';
              return (
                <article
                  key={prediction.id}
                  onClick={() => router.push(`/markets/${prediction.market?.id}`)}
                  className="surface-card cursor-pointer transition-colors"
                  style={{ padding: '24px' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="section-marker">
                      <span className="section-marker-num">{String(i + 1).padStart(2, '0')}</span>{' '}
                      / {statusLabel}
                    </span>
                    <span className="eyebrow" style={{ color: 'var(--text-muted)' }}>
                      {new Date(prediction.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="text-[17px] font-medium mb-2 leading-snug">
                    {prediction.market?.question || 'Unknown market'}
                  </h3>
                  <p className="text-[13px] mb-5" style={{ color: 'var(--text-muted)' }}>
                    Your pick:{' '}
                    <span style={{ color: 'var(--accent)' }} className="font-medium">
                      {prediction.outcome?.outcome_text}
                    </span>
                  </p>

                  <div className="divider-line mb-4" />

                  <div className="flex flex-wrap items-center justify-between gap-4 text-[13px]">
                    <div>
                      <span className="eyebrow mr-2">STAKED</span>
                      <span className="font-mono">{prediction.stake_amount}</span>
                      <span className="ml-1" style={{ color: 'var(--text-muted)' }}>
                        LO
                      </span>
                    </div>
                    {prediction.paid_out && (
                      <div>
                        <span className="eyebrow mr-2">PAYOUT</span>
                        <span
                          className="font-mono"
                          style={{ color: won ? 'var(--accent)' : 'var(--danger)' }}
                        >
                          {prediction.payout_amount || 0}
                        </span>
                        <span className="ml-1" style={{ color: 'var(--text-muted)' }}>
                          LO
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
