'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import MarketCard from '@/components/MarketCard';
import { Loader2, Search } from 'lucide-react';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [markets, setMarkets] = useState([]);
  const [marketCounts, setMarketCounts] = useState({ total: 0, live: 0 });
  const [platformSettings, setPlatformSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchMarkets();
  }, [user, activeTab]);

  useEffect(() => {
    if (user) fetchMarketCounts();
  }, [user]);

  const fetchMarkets = async () => {
    setLoading(true);
    try {
      const status = activeTab === 'all' ? '' : activeTab;
      const response = await fetch(`/api/markets${status ? `?status=${status}` : ''}`);
      const data = await response.json();
      setMarkets(data.markets || []);
      if (data.settings) setPlatformSettings(data.settings);
    } catch (error) {
      console.error('Failed to fetch markets:', error);
    }
    setLoading(false);
  };

  const fetchMarketCounts = async () => {
    try {
      const [allRes, liveRes] = await Promise.all([
        fetch('/api/markets?limit=1'),
        fetch('/api/markets?status=live&limit=1'),
      ]);
      const [allData, liveData] = await Promise.all([allRes.json(), liveRes.json()]);
      setMarketCounts({
        total: allData.pagination?.totalCount || allData.markets?.length || 0,
        live: liveData.pagination?.totalCount || liveData.markets?.length || 0,
      });
    } catch (error) {
      console.error('Failed to fetch market counts:', error);
    }
  };

  const filteredMarkets = markets.filter((market) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      market.question?.toLowerCase().includes(q) ||
      market.description?.toLowerCase().includes(q) ||
      market.creator?.username?.toLowerCase().includes(q)
    );
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: 'live', label: 'Live' },
    { id: 'proposed', label: 'Proposed' },
    { id: 'closed', label: 'Closed' },
    { id: 'all', label: 'All' },
  ];

  const short = (s) => (s ? `${s.slice(0, 6)}…` : '—');

  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="container mx-auto px-8 lg:px-12 py-16">
        {/* Hero */}
        <section className="grid lg:grid-cols-12 gap-12 items-start mb-20">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-6">PLAYGROUND / PREDICTIONS</p>
            <h1 className="editorial-heading">
              Your session &<br />
              <span className="editorial-accent">prediction wallet.</span>
            </h1>
            <p
              className="mt-8 max-w-xl text-[18px] leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              A single Speculon community account ties your identity, your LO Points balance,
              and the markets you've staked on. Predict outcomes, earn LO Points, and compete
              with the community.
            </p>

            <div className="mt-10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/create')}
                className="btn-mint"
              >
                Create market
              </button>
              <button
                type="button"
                onClick={() => router.push('/predictions')}
                className="btn-outline"
              >
                My predictions
              </button>
            </div>
          </div>

          {/* Identity + Wallet cards */}
          <div className="lg:col-span-5 space-y-6">
            <article className="surface-card">
              <div className="flex items-center justify-between mb-6">
                <span className="section-marker">
                  <span className="section-marker-num">01</span> / SESSION
                </span>
                <span className="eyebrow">IDENTITY</span>
              </div>
              <dl className="grid grid-cols-[110px_1fr] gap-y-4 gap-x-6 text-[14px]">
                <dt className="eyebrow self-center">USERNAME</dt>
                <dd className="font-medium">{user.username}</dd>
                <dt className="eyebrow self-center">USER ID</dt>
                <dd className="font-mono text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  {short(String(user.id))}
                </dd>
                <dt className="eyebrow self-center">ROLE</dt>
                <dd className="text-[14px]" style={{ color: 'var(--text-muted)' }}>
                  {user.role || 'member'}
                </dd>
              </dl>
            </article>

            <article className="surface-card">
              <div className="flex items-center justify-between mb-6">
                <span className="section-marker">
                  <span className="section-marker-num">02</span> / WALLET
                </span>
                <span className="eyebrow">LO POINTS</span>
              </div>
              <dl className="grid grid-cols-[110px_1fr] gap-y-4 gap-x-6 text-[14px]">
                <dt className="eyebrow self-center">BALANCE</dt>
                <dd className="font-mono text-[20px] font-medium">
                  {user.points_balance ?? 0}
                  <span className="text-[12px] ml-2" style={{ color: 'var(--text-muted)' }}>
                    LO
                  </span>
                </dd>
                <dt className="eyebrow self-center">MARKETS</dt>
                <dd className="font-mono text-[14px]" style={{ color: 'var(--text-muted)' }}>
                  {marketCounts.total} total · {marketCounts.live} live
                </dd>
              </dl>
            </article>
          </div>
        </section>

        {/* Markets section */}
        <section>
          <div className="flex items-end justify-between mb-8 flex-wrap gap-6">
            <div>
              <span className="section-marker">
                <span className="section-marker-num">03</span> / MARKETS
              </span>
              <h2 className="mt-3 text-[28px] font-medium tracking-tight">Browse the floor</h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className="px-4 py-2 rounded-full border text-[13px] transition-colors"
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
          </div>

          {/* Search */}
          <div
            className="flex items-center gap-3 px-4 py-3 mb-10 rounded-xl border"
            style={{ borderColor: 'var(--border)' }}
          >
            <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search markets by question, description, or creator"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[14px] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[12px]"
                style={{ color: 'var(--text-muted)' }}
              >
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          ) : filteredMarkets.length === 0 ? (
            <div className="surface-card text-center">
              <p className="eyebrow mb-3">EMPTY STATE</p>
              <h3 className="text-[22px] font-medium mb-2">
                {searchQuery ? 'No markets match that query.' : 'No markets yet.'}
              </h3>
              <p className="text-[14px] mb-6" style={{ color: 'var(--text-muted)' }}>
                {searchQuery
                  ? 'Try a broader query, or clear the filter.'
                  : 'Be the first to propose a prediction market.'}
              </p>
              {!searchQuery && (
                <button type="button" onClick={() => router.push('/create')} className="btn-mint">
                  Create market
                </button>
              )}
            </div>
          ) : (
            <>
              {searchQuery && (
                <p className="text-[13px] mb-4" style={{ color: 'var(--text-muted)' }}>
                  Found {filteredMarkets.length} market
                  {filteredMarkets.length !== 1 ? 's' : ''} matching "{searchQuery}"
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMarkets.map((market, i) => (
                  <MarketCard
                    key={market.id}
                    market={market}
                    settings={platformSettings}
                    index={i + 1}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="container mx-auto px-8 lg:px-12 py-12">
        <div className="divider-line mb-8" />
        <div className="flex flex-wrap items-center justify-between text-[12px]" style={{ color: 'var(--text-muted)' }}>
          <span>Speculon Prediction Market</span>
          <span className="section-marker">
            <span className="section-marker-num">§</span> v0.1 · community release
          </span>
        </div>
      </footer>
    </div>
  );
}
