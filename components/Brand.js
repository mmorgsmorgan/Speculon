'use client';

import Image from 'next/image';

/**
 * Speculon wordmark with optional logo mark + ".rialo" suffix.
 * - withLogo: prepends the mushroom-hat logo from /public/speculon-logo.png
 * - withRialo: appends a tiny ".rialo" suffix (use on login/register, hide inside the dApp)
 * - size: pixel size of the logo mark (default 28)
 */
export default function Brand({
  withRialo = false,
  withLogo = true,
  size = 28,
  className = '',
  dotClassName = '',
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {withLogo && (
        <span
          className="inline-flex shrink-0 overflow-hidden rounded-md"
          style={{ width: size, height: size }}
          aria-hidden
        >
          <Image
            src="/speculon-logo.png"
            alt=""
            width={size * 2}
            height={size * 2}
            priority
            style={{ width: size, height: size, objectFit: 'cover' }}
          />
        </span>
      )}
      <span className="inline-flex items-baseline">
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
    </span>
  );
}
