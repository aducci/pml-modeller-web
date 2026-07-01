import Link from 'next/link';
import type { ReactNode } from 'react';

type PlatformHeaderProps = {
  section: string;
  subtitle?: string;
  homeHref?: string;
  rightSlot?: ReactNode;
  badge?: string;
};

export function PlatformHeader({
  section,
  subtitle,
  homeHref = '/dashboard',
  rightSlot,
  badge = 'Platform',
}: PlatformHeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={homeHref} className="text-base font-bold tracking-tight text-teal">
            PML Modeller
          </Link>
          <span className="hidden h-4 w-px bg-gray-200 md:block" />
          <span className="hidden rounded-full border border-teal/20 bg-teal/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-teal md:inline-flex">
            {badge}
          </span>
          <span className="truncate text-sm font-medium text-gray-700">{section}</span>
          {subtitle ? <span className="truncate text-xs text-gray-500">{subtitle}</span> : null}
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">{rightSlot}</div>
      </div>
    </header>
  );
}
