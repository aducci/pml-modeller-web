import Link from 'next/link';
import { auth } from '@/lib/auth';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    cta: 'Start free',
    href: '/auth/signin',
    popular: false,
    description: 'For individuals getting started',
    users: '1 user',
  },
  {
    name: 'Starter',
    price: '$12',
    period: '/mo',
    cta: 'Upgrade to Starter',
    href: '/api/stripe/checkout',
    popular: true,
    description: 'For practitioners who model regularly',
    users: '1 user',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    cta: 'Upgrade to Pro',
    href: '/api/stripe/checkout',
    popular: false,
    description: 'For power users and teams',
    users: '1 user',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    cta: 'Contact sales',
    href: '/auth/signin',
    popular: false,
    description: 'For organisations at scale',
    users: 'Unlimited',
  },
];

const featureRows = [
  { name: 'Diagrams', free: '10', starter: '50', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'AI assist sessions', free: '3 / mo', starter: '30 / mo', pro: '100 / mo', enterprise: 'Unlimited' },
  { name: 'Export to BPMN', free: '3 / mo', starter: '50 / mo', pro: 'Unlimited', enterprise: 'Unlimited' },
  { name: 'Export (PNG / SVG)', free: true, starter: true, pro: true, enterprise: true },
  { name: 'Shareable links', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Process interface navigation', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Advanced layout views', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Diagram layout customisation', free: false, starter: false, pro: true, enterprise: true },
  { name: 'SSO (SAML 2.0 / OIDC)', free: false, starter: false, pro: false, enterprise: true },
  { name: 'SCIM provisioning', free: false, starter: false, pro: false, enterprise: true },
  { name: 'Audit log', free: false, starter: false, pro: false, enterprise: true },
  { name: 'Custom branding / white-label', free: false, starter: false, pro: false, enterprise: true },
  { name: 'Dedicated onboarding', free: false, starter: false, pro: false, enterprise: true },
  { name: 'Priority support', free: false, starter: false, pro: true, enterprise: 'Named CSM' },
];

export default async function Pricing() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-teal">PML Modeller</Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/#features" className="text-gray-600 hover:text-teal transition-colors">Features</Link>
            <Link href="/about" className="text-gray-600 hover:text-teal transition-colors">About</Link>
            <Link href="/docs" className="text-gray-600 hover:text-teal transition-colors">Docs</Link>
            <Link href="/pricing" className="text-teal font-semibold">Pricing</Link>
            {session?.user ? (
              <Link href="/dashboard" className="text-gray-600 hover:text-teal transition-colors">Dashboard</Link>
            ) : (
              <Link href="/auth/signin" className="text-gray-600 hover:text-teal transition-colors">Sign in</Link>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Start free. Upgrade when your team needs more power.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4 mb-20">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-3xl p-8 ${
                tier.popular
                  ? 'bg-gray-900 text-white border-2 border-teal shadow-2xl shadow-teal/20 relative'
                  : 'bg-white border border-gray-100 shadow-sm'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-teal px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                    Most popular
                  </span>
                </div>
              )}
              <h3 className={`text-2xl font-bold ${tier.popular ? 'text-white' : 'text-gray-900'}`}>{tier.name}</h3>
              <p className={`mt-2 text-sm ${tier.popular ? 'text-gray-300' : 'text-gray-600'}`}>{tier.description}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className={`text-4xl font-bold tracking-tight ${tier.popular ? 'text-white' : 'text-gray-900'}`}>{tier.price}</span>
                <span className={tier.popular ? 'text-gray-400' : 'text-gray-500'}>{tier.period}</span>
              </div>
              <p className={`mt-1 text-xs ${tier.popular ? 'text-gray-400' : 'text-gray-500'}`}>{tier.users}</p>
              <Link
                href={tier.href}
                className={`mt-8 block rounded-xl px-4 py-3 text-center text-sm font-bold transition-all ${
                  tier.popular
                    ? 'bg-teal text-white hover:bg-teal/90 shadow-lg shadow-teal/25'
                    : 'border border-gray-200 text-gray-900 hover:border-teal hover:text-teal'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Compare plans</h2>
            <p className="mt-1 text-sm text-gray-600">Every feature, clearly laid out.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-8 py-5 text-sm font-semibold text-gray-900 w-48">Feature</th>
                  <th className="text-center px-6 py-5 text-sm font-bold text-gray-900 w-28">Free</th>
                  <th className="text-center px-6 py-5 text-sm font-bold text-teal w-28 bg-teal/5">Starter</th>
                  <th className="text-center px-6 py-5 text-sm font-bold text-gray-900 w-28">Pro</th>
                  <th className="text-center px-6 py-5 text-sm font-bold text-gray-900 w-28">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {featureRows.map((row) => (
                  <tr key={row.name} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-8 py-4 text-sm font-medium text-gray-900">{row.name}</td>
                    <td className="px-6 py-4 text-center text-sm">
                      {typeof row.free === 'boolean' ? (
                        row.free ? (
                          <svg className="w-5 h-5 mx-auto text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-gray-700 font-medium">{row.free}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm bg-teal/[0.03]">
                      {typeof row.starter === 'boolean' ? (
                        row.starter ? (
                          <svg className="w-5 h-5 mx-auto text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-teal font-bold">{row.starter}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? (
                          <svg className="w-5 h-5 mx-auto text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-gray-700 font-medium">{row.pro}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      {typeof row.enterprise === 'boolean' ? (
                        row.enterprise ? (
                          <svg className="w-5 h-5 mx-auto text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )
                      ) : (
                        <span className="text-gray-700 font-medium">{row.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-teal transition-colors">
            ← Back to home
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} PML Modeller. Built with pml-core.
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/about" className="hover:text-teal transition-colors">About</Link>
            <Link href="/pricing" className="hover:text-teal transition-colors">Pricing</Link>
            <a href="#" className="hover:text-teal transition-colors">Privacy</a>
            <a href="#" className="hover:text-teal transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}