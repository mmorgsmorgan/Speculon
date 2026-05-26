'use client';

/**
 * Speculon wordmark. Pass `withRialo` to append a tiny ".rialo" suffix —
 * used on landing-style pages (login, register). Inside the dApp, omit it.
 */
export default function Brand({ withRialo = false, className = '', dotClassName = '' }) {
  return (
    <span className={`inline-flex items-baseline ${className}`}>
      <span className="font-medium tracking-tight">Speculon</span>
      {withRialo && (
        <span
          className={`ml-[1px] font-medium ${dotClassName}`}
          style={{
            fontSize: '0.28em',
            letterSpacing: '0.04em',
            color: 'var(--text-muted)',
            transform: 'translateY(0.2em)',
          }}
        >
          .rialo
        </span>
      )}
    </span>
  );
}
