'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, LogOut } from 'lucide-react';
import Brand from '@/components/Brand';

export default function Navigation() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Markets' },
    { href: '/create', label: 'Create' },
    { href: '/predictions', label: 'Predictions' },
  ];

  if (isAdmin) navLinks.push({ href: '/admin', label: 'Admin' });

  const sectionLabel = (() => {
    if (pathname === '/') return 'MARKETS';
    if (pathname.startsWith('/create')) return 'CREATE';
    if (pathname.startsWith('/predictions')) return 'PREDICTIONS';
    if (pathname.startsWith('/markets')) return 'MARKET';
    if (pathname.startsWith('/admin')) return 'ADMIN';
    return 'ACCOUNT';
  })();

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="w-full">
      <div className="container mx-auto px-8 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Left: Logo + section indicator */}
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center">
              <Brand className="text-[15px]" size={28} />
            </Link>

            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[14px] transition-colors ${
                    isActive(link.href)
                      ? 'text-[var(--color-ink)] font-medium'
                      : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: section marker, theme toggle, account */}
          <div className="flex items-center gap-6">
            <span className="section-marker hidden sm:inline">
              <span className="section-marker-num">§</span> {sectionLabel}
            </span>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-md flex items-center justify-center border"
              style={{ borderColor: 'var(--border)' }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end leading-tight">
                  <span className="eyebrow">{user.points_balance ?? 0} LO</span>
                  <span className="text-[13px]">{user.username}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="w-9 h-9 rounded-md flex items-center justify-center border"
                  style={{ borderColor: 'var(--border)' }}
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="divider-line" />
      </div>
    </nav>
  );
}
