'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Brand from '@/components/Brand';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    if (result.success) router.push('/');
    else setError(result.error);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-10">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: 'var(--accent)' }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--card)' }} />
            </div>
            <Brand withRialo className="text-[15px]" />
          </div>

          <p className="section-marker mb-5">
            <span className="section-marker-num">§</span> 01 / SIGN IN
          </p>
          <h1 className="editorial-heading" style={{ fontSize: 'clamp(36px, 5vw, 52px)' }}>
            Welcome <span className="editorial-accent">back.</span>
          </h1>
          <p className="mt-4 text-[15px]" style={{ color: 'var(--text-muted)' }}>
            Enter your credentials to continue.
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
              placeholder="your-handle"
              required
              autoComplete="username"
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
                placeholder="••••••••"
                required
                autoComplete="current-password"
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
                <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-8 text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link
            href="/register"
            className="underline underline-offset-4"
            style={{ color: 'var(--accent)' }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
