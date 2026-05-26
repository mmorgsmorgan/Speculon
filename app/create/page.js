'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Plus, X, Loader2 } from 'lucide-react';

export default function CreateMarketPage() {
  const { isAuthenticated, isMember } = useAuth();
  const router = useRouter();

  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [outcomes, setOutcomes] = useState(['', '']);
  const [closeTime, setCloseTime] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isMember) router.push('/login');
  }, [isAuthenticated, isMember, router]);

  if (!isAuthenticated || !isMember) return null;

  const addOutcome = () => outcomes.length < 5 && setOutcomes([...outcomes, '']);
  const removeOutcome = (i) =>
    outcomes.length > 2 && setOutcomes(outcomes.filter((_, idx) => idx !== i));
  const updateOutcome = (i, value) => {
    const next = [...outcomes];
    next[i] = value;
    setOutcomes(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!question.trim()) return setError('Question is required');
    const valid = outcomes.filter((o) => o.trim());
    if (valid.length < 2) return setError('At least 2 outcomes are required');
    if (!closeTime) return setError('Close time is required');

    setLoading(true);
    try {
      const response = await fetch('/api/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          description: description.trim() || null,
          outcomes: valid,
          closeTime,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create market');
      router.push(`/markets/${data.market.id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container mx-auto px-8 lg:px-12 py-16 max-w-3xl">
        <p className="section-marker mb-5">
          <span className="section-marker-num">§</span> 01 / NEW MARKET
        </p>
        <h1 className="editorial-heading" style={{ fontSize: 'clamp(36px, 5vw, 60px)' }}>
          Propose a <span className="editorial-accent">prediction.</span>
        </h1>
        <p className="mt-4 mb-12 text-[15px] max-w-xl" style={{ color: 'var(--text-muted)' }}>
          Markets enter a 15-hour community approval window. Ten approvals and the market opens
          for staking.
        </p>

        <form onSubmit={handleSubmit} className="surface-card space-y-8">
          <div>
            <label htmlFor="question" className="eyebrow block mb-2">
              QUESTION *
            </label>
            <input
              id="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="input-paper"
              placeholder="Will ETH reach $5000 by end of February 2026?"
              required
            />
            <p className="mt-2 eyebrow">BE CLEAR · AVOID AMBIGUITY</p>
          </div>

          <div>
            <label htmlFor="description" className="eyebrow block mb-2">
              DESCRIPTION (OPTIONAL)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="input-paper resize-vertical"
              placeholder="Resolution criteria, sources, context…"
            />
          </div>

          <div>
            <label className="eyebrow block mb-3">OUTCOMES * (2–5)</label>
            <div className="space-y-3">
              {outcomes.map((outcome, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className="flex-shrink-0 w-8 h-10 flex items-center justify-center font-mono text-[12px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <input
                    type="text"
                    value={outcome}
                    onChange={(e) => updateOutcome(index, e.target.value)}
                    className="input-paper flex-1"
                    placeholder={`Outcome ${index + 1}`}
                    required
                  />
                  {outcomes.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOutcome(index)}
                      className="w-10 h-10 flex items-center justify-center rounded-md border"
                      style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {outcomes.length < 5 && (
              <button
                type="button"
                onClick={addOutcome}
                className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-md border text-[13px]"
                style={{ borderColor: 'var(--border)' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add outcome
              </button>
            )}
          </div>

          <div>
            <label htmlFor="closeTime" className="eyebrow block mb-2">
              MARKET CLOSE *
            </label>
            <input
              id="closeTime"
              type="datetime-local"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="input-paper"
              required
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="mt-2 eyebrow">PREDICTIONS LOCK AFTER THIS TIME</p>
          </div>

          {error && (
            <div
              className="text-[13px] px-4 py-3 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--danger)' }}
            >
              {error}
            </div>
          )}

          <div className="surface-card-sm" style={{ background: 'var(--bg-sunken)' }}>
            <p className="eyebrow-strong mb-2">APPROVAL PROCESS</p>
            <ul className="text-[13px] space-y-1.5" style={{ color: 'var(--text-muted)' }}>
              <li>· 15-hour approval window</li>
              <li>· 10 community approval votes required</li>
              <li>· Admins may activate or veto</li>
              <li>· On approval, predictions open</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-mint flex-1">
              {loading ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Creating…
                </span>
              ) : (
                'Create market'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
