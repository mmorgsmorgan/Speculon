'use client';

import { useRouter } from 'next/navigation';

export default function MarketCard({ market, settings, index }) {
  const router = useRouter();
  const approvalThreshold = parseFloat(settings?.required_approval_votes) || 10;

  const statusLabel = (market.status || 'proposed').toUpperCase();

  const getTimeRemaining = () => {
    if (!market.close_time) return null;
    const now = new Date();
    const close = new Date(market.close_time);
    const diff = close - now;
    if (diff < 0) return 'CLOSED';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}D ${hours}H`;
    if (hours > 0) return `${hours}H`;
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${minutes}M`;
  };

  const calculatePercentage = (staked) => {
    if (!market.total_pool || market.total_pool === 0) return 0;
    return ((parseFloat(staked || 0) / market.total_pool) * 100).toFixed(1);
  };

  const numberStr = String(index || '').padStart(2, '0');
  const time = getTimeRemaining();

  return (
    <article
      onClick={() => router.push(`/markets/${market.id}`)}
      className="surface-card cursor-pointer transition-colors h-full"
      style={{ padding: '24px' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div className="flex items-center justify-between mb-5">
        <span className="section-marker">
          {numberStr && <span className="section-marker-num">{numberStr}</span>} / {statusLabel}
        </span>
        {market.status === 'live' && time && (
          <span className="eyebrow" style={{ color: 'var(--accent)' }}>
            {time}
          </span>
        )}
      </div>

      <h3 className="text-[18px] font-medium leading-snug mb-3 line-clamp-2">
        {market.question}
      </h3>
      <p className="eyebrow mb-6">BY {(market.creator?.username || 'UNKNOWN').toUpperCase()}</p>

      <div className="space-y-3 mb-6">
        {market.outcomes?.slice(0, 3).map((outcome) => {
          const pct = calculatePercentage(outcome.total_staked);
          return (
            <div key={outcome.id}>
              <div className="flex justify-between items-center mb-1.5 text-[13px]">
                <span className="truncate flex-1 mr-2">{outcome.outcome_text}</span>
                <span className="font-mono" style={{ color: 'var(--accent)' }}>
                  {pct}%
                </span>
              </div>
              <div
                className="h-[3px] rounded-full overflow-hidden"
                style={{ background: 'var(--bg-sunken)' }}
              >
                <div
                  style={{ width: `${pct}%`, background: 'var(--accent)', height: '100%' }}
                />
              </div>
            </div>
          );
        })}
        {market.outcomes?.length > 3 && (
          <p className="eyebrow text-center pt-1">+{market.outcomes.length - 3} MORE</p>
        )}
      </div>

      <div className="divider-line mb-4" />

      <div className="flex items-center justify-between text-[12px]">
        <div>
          <span className="eyebrow mr-2">POOL</span>
          <span className="font-mono">{market.total_pool || 0}</span>
          <span className="ml-1" style={{ color: 'var(--text-muted)' }}>
            LO
          </span>
        </div>
        <div>
          <span className="eyebrow mr-2">PLAYERS</span>
          <span className="font-mono">{market.predictions_count || 0}</span>
        </div>
      </div>

      {market.status === 'proposed' && market.approval_votes && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between eyebrow mb-2">
            <span>APPROVAL</span>
            <span style={{ color: 'var(--text)' }}>
              {market.approval_votes.approve} / {approvalThreshold}
            </span>
          </div>
          <div
            className="h-[3px] rounded-full overflow-hidden"
            style={{ background: 'var(--bg-sunken)' }}
          >
            <div
              style={{
                width: `${Math.min(
                  (market.approval_votes.approve / approvalThreshold) * 100,
                  100
                )}%`,
                background: 'var(--accent)',
                height: '100%',
              }}
            />
          </div>
        </div>
      )}
    </article>
  );
}
