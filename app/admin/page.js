'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, CheckCircle, Clock, Users, TrendingUp, Activity,
  RefreshCw, Settings, Gift, Sparkles, Brain, Loader2
} from 'lucide-react';
import UserManagementModal from '@/components/UserManagementModal';

const TONE = {
  default: 'var(--text)',
  muted:   'var(--text-muted)',
  accent:  'var(--accent)',
  danger:  'var(--danger)',
};

// Market status → (bg, fg, border) using design tokens.
function statusTone(status) {
  switch (status) {
    case 'live':      return { bg: 'var(--accent-soft)', fg: 'var(--accent-ink)', border: 'var(--accent)' };
    case 'resolved':  return { bg: 'var(--accent-soft)', fg: 'var(--accent-ink)', border: 'var(--accent)' };
    case 'disputed':  return { bg: 'var(--danger-soft)', fg: 'var(--danger-ink)', border: 'var(--danger)' };
    default:          return { bg: 'var(--card)',        fg: 'var(--text)',       border: 'var(--border)' };
  }
}

function StatTile({ label, value, tone = 'default', unit }) {
  return (
    <div className="surface-card-sm">
      <p className="eyebrow mb-2">{label}</p>
      <p className="font-mono text-[22px] font-medium" style={{ color: TONE[tone] }}>
        {value}{unit && <span className="text-[12px] text-[var(--text-muted)] ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function HealthBar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] text-[var(--text-muted)]">{label}</span>
        <span className="font-mono text-[14px] font-medium">{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-sunken)' }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: 'var(--accent)' }} />
      </div>
    </div>
  );
}

function MarketCard({ children }) {
  return (
    <div className="surface-card-sm">
      <div className="flex items-start justify-between gap-4">{children}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [markets, setMarkets] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusMarket, setBonusMarket] = useState(null);
  const [bonusAmount, setBonusAmount] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchData();
  }, [isAdmin, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [marketsRes, usersRes, activitiesRes, statsRes] = await Promise.all([
        fetch('/api/markets'),
        fetch('/api/admin/users'),
        fetch('/api/admin/activities'),
        fetch('/api/admin/stats')
      ]);

      let marketsData = null;
      if (marketsRes.ok) {
        marketsData = await marketsRes.json();
        setMarkets(marketsData.markets || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || usersData || []);
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.activities || activitiesData || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData);
      }

      const disputedMarkets = (marketsData?.markets || []).filter(m => m.status === 'disputed');
      if (disputedMarkets.length > 0) {
        const disputePromises = disputedMarkets.map(m =>
          fetch(`/api/markets/${m.id}/dispute`).then(r => r.json())
        );
        const allDisputeResults = await Promise.all(disputePromises);
        const flatDisputes = allDisputeResults
          .flatMap(result => result.disputes || [])
          .filter(d => d.status === 'pending');
        setDisputes(flatDisputes);
      } else {
        setDisputes([]);
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const patchMarket = async (marketId, action) => {
    try {
      const res = await fetch(`/api/markets/${marketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(`Failed to ${action} market:`, error);
    }
  };

  const handleApproveMarket  = (id) => patchMarket(id, 'approve');
  const handleActivateMarket = (id) => patchMarket(id, 'activate');
  const handleCloseMarket    = (id) => patchMarket(id, 'close');
  const handleDissolveMarket = (id) => {
    if (confirm('Are you sure you want to dissolve this market? This action cannot be undone.')) {
      patchMarket(id, 'dissolve');
    }
  };

  const handleAddBonus = async () => {
    if (!bonusMarket || !bonusAmount || parseFloat(bonusAmount) <= 0) return;
    try {
      const res = await fetch(`/api/markets/${bonusMarket.id}/bonus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(bonusAmount) })
      });
      if (res.ok) {
        setShowBonusModal(false);
        setBonusMarket(null);
        setBonusAmount('');
        fetchData();
      }
    } catch (error) {
      console.error('Failed to add bonus:', error);
    }
  };

  const openBonusModal = (market) => {
    setBonusMarket(market);
    setBonusAmount('');
    setShowBonusModal(true);
  };

  const pendingApprovals = markets.filter(m => m.status === 'proposed');
  const approvedMarkets  = markets.filter(m => m.status === 'approved');
  const activeMarkets    = markets.filter(m => m.status === 'live');
  const closedMarkets    = markets.filter(m => m.status === 'closed');
  const readyToClose     = activeMarkets.filter(m => new Date(m.close_time) < new Date());

  const TABS = ['overview', 'statistics', 'markets', 'disputes', 'users', 'activities'];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="section-marker mb-2">
              <span className="section-marker-num">§ ADM</span> / DASHBOARD
            </div>
            <h1 className="text-[36px] font-medium tracking-tight">Admin dashboard</h1>
            <p className="text-[15px] text-[var(--text-muted)] mt-1">Manage markets, users, and platform settings.</p>
          </div>
          <button
            onClick={() => router.push('/admin/settings')}
            className="btn-outline inline-flex items-center gap-2"
          >
            <Settings className="w-4 h-4 text-[var(--accent)]" />
            Platform settings
          </button>
        </div>

        {/* AI Navigation */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => router.push('/admin/proposals')}
            className="btn-outline inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            AI proposals
          </button>
          <button
            onClick={() => router.push('/admin/ai-dashboard')}
            className="btn-outline inline-flex items-center gap-2"
          >
            <Brain className="w-4 h-4 text-[var(--accent)]" />
            AI dashboard
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <div className="surface-card-sm">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
              <span className="font-mono text-[28px] font-medium">{markets.length}</span>
            </div>
            <p className="text-[13px] text-[var(--text-muted)]">Total markets</p>
          </div>
          <div className="surface-card-sm">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-4 h-4 text-[var(--accent)]" />
              <span className="font-mono text-[28px] font-medium">{users.length}</span>
            </div>
            <p className="text-[13px] text-[var(--text-muted)]">Total users</p>
          </div>
          <div className="surface-card-sm">
            <div className="flex items-center justify-between mb-3">
              <Clock className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="font-mono text-[28px] font-medium text-[var(--text-muted)]">{pendingApprovals.length}</span>
            </div>
            <p className="text-[13px] text-[var(--text-muted)]">Pending approvals</p>
          </div>
          <div className="surface-card-sm">
            <div className="flex items-center justify-between mb-3">
              <AlertCircle className="w-4 h-4 text-[var(--danger)]" />
              <span className="font-mono text-[28px] font-medium text-[var(--danger)]">{disputes.length}</span>
            </div>
            <p className="text-[13px] text-[var(--text-muted)]">Pending disputes</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto items-center">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="tab-pill whitespace-nowrap capitalize"
              data-active={activeTab === tab ? 'true' : 'false'}
            >
              {tab}
            </button>
          ))}
          <button
            onClick={fetchData}
            className="ml-auto p-2 rounded-[10px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            style={{ border: '1px solid var(--border)' }}
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin mx-auto mb-4" />
            <p className="text-[14px] text-[var(--text-muted)]">Loading…</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Pending Disputes */}
                {disputes.length > 0 && (
                  <div className="surface-card">
                    <h3 className="text-[18px] font-medium mb-4 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[var(--danger)]" />
                      Pending disputes ({disputes.length})
                    </h3>
                    <div className="space-y-3">
                      {disputes.slice(0, 5).map(dispute => (
                        <MarketCard key={dispute.id}>
                          <div className="flex-1">
                            <p className="text-[15px] font-medium mb-1">{dispute.market?.question}</p>
                            <p className="text-[13px] text-[var(--text-muted)] mb-2">{dispute.reason}</p>
                            <p className="text-[12px] text-[var(--text-muted)] font-mono">
                              Disputed by {dispute.initiator?.username} · {new Date(dispute.created_at).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => router.push(`/admin/disputes/${dispute.id}`)}
                            className="btn-mint text-[13px] whitespace-nowrap"
                          >
                            Review
                          </button>
                        </MarketCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Approvals */}
                {pendingApprovals.length > 0 && (
                  <div className="surface-card">
                    <h3 className="text-[18px] font-medium mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                      Pending approvals ({pendingApprovals.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingApprovals.slice(0, 5).map(market => (
                        <MarketCard key={market.id}>
                          <div className="flex-1">
                            <p className="text-[15px] font-medium mb-1">{market.question}</p>
                            <p className="text-[13px] text-[var(--text-muted)] mb-2">{market.description}</p>
                            <div className="flex items-center gap-4 text-[12px] text-[var(--text-muted)] font-mono">
                              <span>By {market.creator?.username}</span>
                              <span>Votes: {market.approval_votes?.approve || 0}/10</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleApproveMarket(market.id)} className="btn-mint text-[13px]">Approve</button>
                            <button
                              onClick={() => handleDissolveMarket(market.id)}
                              className="btn-outline text-[13px]"
                              style={{ color: 'var(--danger)' }}
                            >
                              Dissolve
                            </button>
                          </div>
                        </MarketCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approved Markets */}
                {approvedMarkets.length > 0 && (
                  <div className="surface-card">
                    <h3 className="text-[18px] font-medium mb-4 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                      Approved markets ({approvedMarkets.length})
                    </h3>
                    <div className="space-y-3">
                      {approvedMarkets.slice(0, 5).map(market => (
                        <MarketCard key={market.id}>
                          <div className="flex-1">
                            <p className="text-[15px] font-medium mb-1">{market.question}</p>
                            <p className="text-[13px] text-[var(--text-muted)] mb-2">{market.description}</p>
                            <p className="text-[12px] text-[var(--text-muted)] font-mono">By {market.creator?.username}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openBonusModal(market)} className="btn-outline text-[13px]">Add bonus</button>
                            <button onClick={() => handleActivateMarket(market.id)} className="btn-mint text-[13px]">Activate</button>
                            <button
                              onClick={() => handleDissolveMarket(market.id)}
                              className="btn-outline text-[13px]"
                              style={{ color: 'var(--danger)' }}
                            >
                              Dissolve
                            </button>
                          </div>
                        </MarketCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* Markets Ready to Close */}
                {readyToClose.length > 0 && (
                  <div className="surface-card">
                    <h3 className="text-[18px] font-medium mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-[var(--accent)]" />
                      Markets ready to close
                    </h3>
                    <div className="space-y-3">
                      {readyToClose.slice(0, 5).map(market => (
                        <MarketCard key={market.id}>
                          <div className="flex-1">
                            <p className="text-[15px] font-medium mb-1">{market.question}</p>
                            <p className="text-[13px] text-[var(--text-muted)] font-mono">
                              Closed at {new Date(market.close_time).toLocaleString()}
                            </p>
                          </div>
                          <button onClick={() => handleCloseMarket(market.id)} className="btn-mint text-[13px] whitespace-nowrap">
                            Close market
                          </button>
                        </MarketCard>
                      ))}
                    </div>
                  </div>
                )}

                {/* Closed Markets Ready to Resolve */}
                {closedMarkets.length > 0 && (
                  <div className="surface-card">
                    <h3 className="text-[18px] font-medium mb-4 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                      Markets ready to resolve ({closedMarkets.length})
                    </h3>
                    <div className="space-y-3">
                      {closedMarkets.slice(0, 5).map(market => (
                        <MarketCard key={market.id}>
                          <div className="flex-1">
                            <p className="text-[15px] font-medium mb-1">{market.question}</p>
                            <p className="text-[13px] text-[var(--text-muted)] font-mono">
                              {market.outcomes?.length} outcomes · Total pool: {market.outcomes?.reduce((sum, o) => sum + parseFloat(o.total_staked || 0), 0).toFixed(0)} LO
                            </p>
                          </div>
                          <button
                            onClick={() => router.push(`/admin/resolve/${market.id}`)}
                            className="btn-mint text-[13px] whitespace-nowrap"
                          >
                            Resolve
                          </button>
                        </MarketCard>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'statistics' && statistics && (
              <div className="space-y-6">
                <div className="surface-card">
                  <h3 className="text-[18px] font-medium mb-4">Market statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatTile label="Total markets" value={statistics.markets.total} />
                    <StatTile label="Live"          value={statistics.markets.live}     tone="accent" />
                    <StatTile label="Proposed"     value={statistics.markets.proposed} tone="muted" />
                    <StatTile label="Closed"       value={statistics.markets.closed} />
                    <StatTile label="Resolved"     value={statistics.markets.resolved} tone="accent" />
                    <StatTile label="Final"        value={statistics.markets.final}   tone="muted" />
                  </div>
                </div>

                <div className="surface-card">
                  <h3 className="text-[18px] font-medium mb-4">Prediction statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatTile label="Total predictions" value={statistics.predictions.total} />
                    <StatTile label="Active"            value={statistics.predictions.active}                       tone="accent" />
                    <StatTile label="Paid out"          value={statistics.predictions.paid} />
                    <StatTile label="Total staked"      value={statistics.predictions.totalStaked.toFixed(0)}      unit="LO" />
                    <StatTile label="Total paid out"    value={statistics.predictions.totalPaidOut.toFixed(0)}    unit="LO" tone="accent" />
                    <StatTile label="Avg stake"         value={statistics.predictions.averageStake.toFixed(0)}    unit="LO" tone="muted" />
                  </div>
                </div>

                <div className="surface-card">
                  <h3 className="text-[18px] font-medium mb-4">User statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <StatTile label="Total users"      value={statistics.users.total} />
                    <StatTile label="Active today"     value={statistics.activity.activeToday}                tone="accent" />
                    <StatTile label="Active this week" value={statistics.activity.activeThisWeek} />
                    <StatTile label="Total balance"    value={statistics.users.totalBalance.toFixed(0)}     unit="LO" />
                    <StatTile label="Avg balance"      value={statistics.users.averageBalance.toFixed(0)}   unit="LO" tone="muted" />
                    <StatTile label="Admins"           value={statistics.users.admins}                         tone="muted" />
                  </div>
                </div>

                <div className="surface-card">
                  <h3 className="text-[18px] font-medium mb-4">Platform health</h3>
                  <div className="space-y-5">
                    <HealthBar
                      label="Market completion rate"
                      value={statistics.markets.total > 0 ? (statistics.markets.final / statistics.markets.total) * 100 : 0}
                    />
                    <HealthBar
                      label="User engagement rate"
                      value={statistics.users.total > 0 ? (statistics.activity.activeThisWeek / statistics.users.total) * 100 : 0}
                    />
                    <HealthBar
                      label="Payout rate"
                      value={statistics.predictions.totalStaked > 0 ? (statistics.predictions.totalPaidOut / statistics.predictions.totalStaked) * 100 : 0}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Markets Tab */}
            {activeTab === 'markets' && (
              <div className="surface-card">
                <h3 className="text-[18px] font-medium mb-4">All markets</h3>
                <div className="space-y-3">
                  {markets.map(market => {
                    const tone = statusTone(market.status);
                    return (
                      <MarketCard key={market.id}>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <p className="text-[15px] font-medium">{market.question}</p>
                            <span
                              className="px-2.5 py-1 rounded-[4px] text-[11px] font-medium uppercase tracking-wider"
                              style={{ background: tone.bg, color: tone.fg, border: '1px solid ' + tone.border }}
                            >
                              {market.status}
                            </span>
                          </div>
                          <p className="text-[13px] text-[var(--text-muted)] font-mono">
                            By {market.creator?.username} · {new Date(market.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {['approved', 'live'].includes(market.status) && (
                            <button onClick={() => openBonusModal(market)} className="btn-outline text-[13px] inline-flex items-center gap-1.5">
                              <Gift className="w-3.5 h-3.5" />
                              Add bonus
                            </button>
                          )}
                          <button onClick={() => router.push(`/markets/${market.id}`)} className="btn-outline text-[13px]">
                            View
                          </button>
                        </div>
                      </MarketCard>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="surface-card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-[18px] font-medium">All users</h3>
                    <p className="text-[13px] text-[var(--text-muted)] mt-1 font-mono">{users.length} total users</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {users.map(usr => (
                    <MarketCard key={usr.id}>
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                          style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)' }}
                        >
                          <span className="font-mono text-[14px] font-medium">
                            {usr.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-[14px] font-medium">{usr.username}</p>
                          <p className="text-[12px] text-[var(--text-muted)] font-mono">
                            <span className="capitalize">{usr.role}</span> · {parseFloat(usr.points_balance || 0).toFixed(0)} LO
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-[12px] text-[var(--text-muted)] font-mono">
                          Last active: {usr.last_active ? new Date(usr.last_active).toLocaleDateString() : 'Never'}
                        </p>
                        <button
                          onClick={() => { setSelectedUser(usr); setShowUserModal(true); }}
                          className="btn-outline text-[13px] inline-flex items-center gap-1.5"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          Manage
                        </button>
                      </div>
                    </MarketCard>
                  ))}
                </div>
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="surface-card">
                <h3 className="text-[18px] font-medium mb-4">Recent activities</h3>
                <div className="space-y-2">
                  {activities.slice(0, 50).map(activity => (
                    <MarketCard key={activity.id}>
                      <div className="flex-1">
                        <p className="text-[14px] font-medium mb-1">{activity.action_type}</p>
                        <p className="text-[13px] text-[var(--text-muted)] font-mono">{activity.user?.username}</p>
                      </div>
                      <p className="text-[12px] text-[var(--text-muted)] whitespace-nowrap font-mono">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </MarketCard>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Management Modal */}
      {showUserModal && selectedUser && (
        <UserManagementModal
          user={selectedUser}
          onClose={() => { setShowUserModal(false); setSelectedUser(null); }}
          onUpdate={fetchData}
        />
      )}

      {/* Add Bonus Modal */}
      {showBonusModal && bonusMarket && (
        <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md rounded-3xl p-6"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-5 h-5 text-[var(--accent)]" />
              <h3 className="text-[18px] font-medium">Add bonus to pool</h3>
            </div>

            <div className="mb-4">
              <p className="eyebrow mb-1">Market</p>
              <p className="text-[14px] font-medium">{bonusMarket.question}</p>
            </div>

            <div className="mb-6">
              <label className="block text-[14px] font-medium mb-2">
                Bonus amount (LO)
              </label>
              <input
                type="number"
                min="1"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                placeholder="Enter bonus amount"
                className="input-paper font-mono"
              />
              <p className="text-[12px] text-[var(--text-muted)] mt-2">
                Bonus distributes evenly across all outcomes in the market pool.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBonusModal(false);
                  setBonusMarket(null);
                  setBonusAmount('');
                }}
                className="btn-outline flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBonus}
                disabled={!bonusAmount || parseFloat(bonusAmount) <= 0}
                className="btn-mint flex-1"
              >
                Add bonus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
