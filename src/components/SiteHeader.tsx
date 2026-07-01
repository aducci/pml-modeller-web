import Link from 'next/link';

export function SiteHeader({ brandHref = '/' }: { brandHref?: string }) {
  return (
    <nav className="border-b border-gray-100" style={{ marginBottom: 6, minHeight: 48 }}>
      <div className="mx-auto max-w-6xl px-6 flex items-center justify-between" style={{ paddingTop: 14, paddingBottom: 8 }}>
        <Link href={brandHref} className="text-xl font-bold tracking-tight text-teal">
          PML Modeller
        </Link>
        <div className="flex gap-6 text-sm font-medium">
          <Link href="#features" className="text-gray-600 hover:text-teal transition-colors">Features</Link>
          <Link href="/about" className="text-gray-600 hover:text-teal transition-colors">About</Link>
          <Link href="/docs" className="text-gray-600 hover:text-teal transition-colors">Docs</Link>
          <Link href="/pricing" className="text-gray-600 hover:text-teal transition-colors">Pricing</Link>
          <Link href="/demo" className="text-gray-600 hover:text-teal transition-colors">Demo</Link>
          <Link href="/auth/signin" className="text-gray-600 hover:text-teal transition-colors">Sign in</Link>
        </div>
      </div>
    </nav>
  );
}
