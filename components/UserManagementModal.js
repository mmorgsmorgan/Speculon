'use client';

import { useState } from 'react';
import { X, DollarSign, Shield } from 'lucide-react';

export default function UserManagementModal({ user, onClose, onUpdate }) {
  const [action, setAction] = useState('');
  const [newBalance, setNewBalance] = useState(user.points_balance || 0);
  const [newRole, setNewRole] = useState(user.role);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!action) {
      alert('Please select an action');
      return;
    }

    if (action === 'update_balance' && newBalance < 0) {
      alert('Balance cannot be negative');
      return;
    }

    if (!confirm(`Are you sure you want to ${action === 'update_balance' ? 'update balance' : 'change role'} for ${user.username}?`)) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: user.id,
          action,
          value: action === 'update_balance' ? parseFloat(newBalance) : newRole
        })
      });

      if (res.ok) {
        alert('User updated successfully');
        onUpdate();
        onClose();
      } else {
        const error = await res.json();
        alert(`Failed to update user: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const balanceDelta = parseFloat(newBalance) - parseFloat(user.points_balance || 0);

  return (
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)' }}
            >
              <span className="font-mono text-[16px] font-medium">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-[18px] font-medium">Manage user</h3>
              <p className="text-[13px] font-mono text-[var(--text-muted)]">{user.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-[10px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            style={{ border: '1px solid var(--border)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {/* Current Info */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="surface-card-sm">
              <p className="eyebrow mb-1">Current balance</p>
              <p className="font-mono text-[20px] font-medium">
                {parseFloat(user.points_balance || 0).toFixed(0)}
                <span className="ml-1 text-[12px] text-[var(--text-muted)]">LO</span>
              </p>
            </div>
            <div className="surface-card-sm">
              <p className="eyebrow mb-1">Current role</p>
              <p className="text-[20px] font-medium capitalize">{user.role}</p>
            </div>
          </div>

          {/* Action Selection */}
          <label className="block text-[15px] font-medium mb-3">Select action</label>
          <div className="space-y-2 mb-6">
            {[
              { id: 'update_balance', Icon: DollarSign, title: 'Update balance', copy: 'Adjust user’s LO balance.' },
              { id: 'update_role',    Icon: Shield,     title: 'Change role',    copy: 'Modify user’s permission level.' }
            ].map(({ id, Icon, title, copy }) => {
              const isSelected = action === id;
              return (
                <button
                  key={id}
                  onClick={() => setAction(id)}
                  className="w-full p-4 rounded-[10px] border text-left transition-all"
                  style={{
                    borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                    background: isSelected ? 'var(--accent-soft)' : 'transparent',
                    color: isSelected ? 'var(--accent-ink)' : 'var(--text)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[var(--accent)]" />
                    <div>
                      <p className="text-[14px] font-medium">{title}</p>
                      <p className="text-[12px]" style={{ color: isSelected ? 'inherit' : 'var(--text-muted)' }}>{copy}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Update Balance Form */}
          {action === 'update_balance' && (
            <div className="surface-card-sm mb-6">
              <label className="block text-[14px] font-medium mb-2">New balance</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  min="0"
                  step="1"
                  className="input-paper font-mono"
                />
                <span className="text-[13px] font-mono text-[var(--text-muted)]">LO</span>
              </div>
              <p className="text-[12px] text-[var(--text-muted)] mt-2 font-mono">
                Δ {balanceDelta > 0 ? '+' : ''}{balanceDelta.toFixed(0)} LO
              </p>
            </div>
          )}

          {/* Update Role Form */}
          {action === 'update_role' && (
            <div className="surface-card-sm mb-6">
              <label className="block text-[14px] font-medium mb-3">New role</label>
              <div className="space-y-2">
                {['admin', 'member', 'viewer'].map(role => {
                  const isPicked = newRole === role;
                  return (
                    <button
                      key={role}
                      onClick={() => setNewRole(role)}
                      className="w-full p-3 rounded-[10px] border text-left transition-all"
                      style={{
                        borderColor: isPicked ? 'var(--accent)' : 'var(--border)',
                        background: isPicked ? 'var(--accent-soft)' : 'transparent',
                        color: isPicked ? 'var(--accent-ink)' : 'var(--text)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-medium capitalize">{role}</span>
                        {role === user.role && (
                          <span className="tab-pill text-[11px]">Current</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[12px] text-[var(--text-muted)] mt-3 leading-relaxed">
                <span className="font-medium text-[var(--text)]">Admin</span> — full platform control · <span className="font-medium text-[var(--text)]">Member</span> — create & predict · <span className="font-medium text-[var(--text)]">Viewer</span> — read only.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!action || submitting}
              className="btn-mint flex-1"
            >
              {submitting ? 'Updating…' : 'Update user'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
