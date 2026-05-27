'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Info, Loader2 } from 'lucide-react';

export default function PlatformSettings() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchSettings();
  }, [isAdmin, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!confirm('Are you sure you want to update platform settings? This will affect all users.')) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            required_approval_votes: settings.required_approval_votes,
            approval_deadline_hours: settings.approval_deadline_hours,
            dispute_window_hours: settings.dispute_window_hours,
            platform_fee_percentage: settings.platform_fee_percentage,
            starting_balance: settings.starting_balance
          }
        })
      });

      if (res.ok) {
        alert('Settings updated successfully!');
      } else {
        const error = await res.json();
        alert(`Failed to update settings: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const fields = [
    {
      key: 'required_approval_votes',
      label: 'Required Approval Votes',
      help: 'Number of community approvals needed for a proposed market to be activated.',
      unit: 'votes',
      props: { type: 'number', min: 1, max: 50, defaultValue: 10, parse: parseInt }
    },
    {
      key: 'approval_deadline_hours',
      label: 'Approval Deadline (Hours)',
      help: 'Time window for community to approve proposed markets before they expire.',
      unit: 'hours',
      props: { type: 'number', min: 1, max: 168, defaultValue: 15, parse: parseInt }
    },
    {
      key: 'dispute_window_hours',
      label: 'Dispute Window (Hours)',
      help: 'Time window after resolution during which users can dispute the outcome.',
      unit: 'hours',
      props: { type: 'number', min: 1, max: 168, defaultValue: 24, parse: parseInt }
    },
    {
      key: 'platform_fee_percentage',
      label: 'Platform Fee (%)',
      help: 'Percentage fee deducted from each prediction (decimal value, e.g., 1.0 for 1%).',
      unit: '%',
      props: { type: 'number', min: 0, max: 10, step: 0.1, defaultValue: 1, parse: parseFloat }
    },
    {
      key: 'starting_balance',
      label: 'Starting Balance (LO)',
      help: 'Initial point balance given to new users when they register.',
      unit: 'LO',
      props: { type: 'number', min: 0, step: 1, defaultValue: 100, parse: parseInt }
    }
  ];

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
          <span className="section-marker-num">§ 01</span> / PLATFORM
        </div>

        <h1 className="text-[36px] font-medium tracking-tight mb-2">Platform settings</h1>
        <p className="text-[15px] text-[var(--text-muted)] mb-10 max-w-xl">
          Configure global platform parameters. Changes affect future markets and new users only — existing markets are untouched.
        </p>

        <div className="note-block mb-10 flex items-start gap-3">
          <Info className="w-4 h-4 mt-1 flex-shrink-0 text-[var(--accent)]" />
          <p className="text-[13px] text-[var(--text-muted)]">
            Confirm with the team before changing fee percentage or starting balance — both reshape the protocol economy.
          </p>
        </div>

        <div className="space-y-4">
          {fields.map(({ key, label, help, unit, props: { parse, defaultValue, ...inputProps } }) => (
            <div key={key} className="surface-card-sm">
              <label className="block text-[15px] font-medium mb-1.5">{label}</label>
              <p className="text-[13px] text-[var(--text-muted)] mb-4">{help}</p>
              <input
                {...inputProps}
                value={settings?.[key] ?? defaultValue}
                onChange={(e) => updateSetting(key, parse(e.target.value))}
                className="input-paper font-mono"
              />
              <p className="text-[12px] text-[var(--text-muted)] mt-2">
                Current: <span className="font-mono text-[var(--text)]">{settings?.[key]}</span> {unit}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-mint mt-10 inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
