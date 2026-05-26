'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Brand from '@/components/Brand';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [startingBalance, setStartingBalance] = useState(10);
  const { register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/markets?limit=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.starting_balance) {
          setStartingBalance(parseFloat(data.settings.starting_balance));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (username.length < 3) return setError('Username must be at least 3 characters');

    setLoading(true);
    const result = await register(username, password);
    if (result.success) router.push('/');
    else setError(result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <div className="flex items-center mb-10">
            <Brand withRialo className="text-[15px]" size={32} />
          </div>

          <p className="section-marker mb-5">
            <span className="section-marker-num">§</span> 02 / REGISTER
          </p>
          <h1 className="editorial-heading" style={{ fontSize: 'clamp(36px, 5vw, 52px)' }}>
            Join the <span className="editorial-accent">market.</span>
          </h1>
          <p className="mt-4 text-[15px]" style={{ color: 'var(--text-muted)' }}>
            Create an account and receive {startingBalance} starting LO Points.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="eyebrow block mb-2">
              USERNAME
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-paper"
              placeholder="3–50 characters"
              required
              autoComplete="username"
              minLength={3}
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="password" className="eyebrow block mb-2">
              PASSWORD
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-paper pr-12"
                placeholder="At least 6 characters"
                required
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md"
                style={{ color: 'var(--text-muted)' }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="eyebrow block mb-2">
              CONFIRM PASSWORD
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-paper pr-12"
                placeholder="Repeat password"
                required
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                aria-pressed={showConfirm}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md"
                style={{ color: 'var(--text-muted)' }}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="text-[13px] px-4 py-3 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--danger)' }}
            >
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-mint w-full">
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Creating account…
              </span>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="mt-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link
            href="/login"
            className="underline underline-offset-4"
            style={{ color: 'var(--accent)' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
