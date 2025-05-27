'use client';

import Image from 'next/image';
import Link  from 'next/link';

export default function BrandLogo({
  size = 128,
  withText = false,
}: {
  size?: number;
  withText?: boolean;
}) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/Logo-512.png"
        alt="logo"
        width={size}
        height={size}
        priority
      />
      {withText && (
        <span className="text-lg font-semibold tracking-tight">
          Bullet Builder 2.0
        </span>
      )}
    </Link>
  );
}
