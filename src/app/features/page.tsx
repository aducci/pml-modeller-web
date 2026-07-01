import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

const cardTones = [
  'before:bg-teal',
  'before:bg-sandy',
  'before:bg-smoky',
  'before:bg-teal',
  'before:bg-sandy',
] as const;

const pillars = [
  {
    title: 'Authoring speed',
    summary: 'Move from workshop notes to an editable process model in minutes.',
    points: [
      'Text-first modelling with immediate visual feedback',
      'No drag-and-drop bottlenecks for first draft creation',
      'Reusable process structures for recurring operating patterns',
    ],
  },
  {
    title: 'AI-assisted modelling',
    summary: 'Use AI as a structured collaborator, not a black-box diagram generator.',
    points: [
      'Patch-style suggestions you can review before applying',
      'Context-aware edits aligned to process structure',
      'Faster refinement for exceptions, controls, and handoffs',
    ],
  },
  {
    title: 'Governance and controls',
    summary: 'Keep process definitions auditable and enterprise-ready as you scale.',
    points: [
      'Version-friendly source for reviews and approvals',
      'Metadata support for controls and compliance context',
      'Clear ownership boundaries across process responsibilities',
    ],
  },
  {
    title: 'Collaboration and sharing',
    summary: 'Share what stakeholders need without exposing full editing surfaces.',
    points: [
      'Read-only links for review and sign-off flows',
      'Role-focused communication around process steps',
      'Faster review cycles with less handover friction',
    ],
  },
  {
    title: 'Enterprise readiness',
    summary: 'Adopt from individual analysts to structured multi-team operations.',
    points: [
      'Plan tiers that map to maturity stages',
      'Pathway to SSO, SCIM, and private AI options',
      'Operational support model for production usage',
    ],
  },
] as const;

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white page-enter">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden border-b border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-honeydew/65 via-white to-white" />
          <div className="feature-orb absolute -top-16 -left-12 h-52 w-52 rounded-full bg-teal/20 blur-3xl" />
          <div className="feature-orb feature-orb-delay absolute -bottom-20 right-0 h-60 w-60 rounded-full bg-sandy/25 blur-3xl" />
          <div className="mx-auto max-w-6xl px-6 py-20 relative">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Features</p>
            <h1 className="mt-5 max-w-4xl text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-[1.08]">
              Design processes with
              {' '}
              <span className="feature-gradient-text">less friction</span>
              {' '}
              and more operational confidence
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-gray-600">
              PML Modeller combines text-first authoring, AI-assisted refinement, and shareable process outputs so teams can move from concept to execution without tool friction.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <Link href="/demo" className="rounded-lg bg-teal px-5 py-3 font-semibold text-white hover:bg-teal/90">Open demo</Link>
              <Link href="/pricing" className="rounded-lg border border-gray-200 px-5 py-3 font-semibold text-gray-900 hover:border-teal hover:text-teal">View pricing</Link>
            </div>
            <div className="mt-10 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-700">First draft process model in one focused session.</div>
              <div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-700">Review flows through links without exposing edit controls.</div>
              <div className="rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm text-gray-700">Source stays version-friendly for operational governance.</div>
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-gray-100 bg-gray-50/60">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Capability pillars</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">Everything required to move from draft to operating model</h2>
              </div>
              <Link href="/demo" className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-900 hover:border-teal hover:text-teal">Try capability flow</Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {pillars.map((pillar, idx) => (
                <article
                  key={pillar.title}
                  className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm feature-stagger feature-card-hover before:absolute before:inset-x-0 before:top-0 before:h-1 ${cardTones[idx]}`}
                  style={{ animationDelay: `${idx * 70}ms` }}
                >
                  <h2 className="text-xl font-bold text-gray-900">{pillar.title}</h2>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{pillar.summary}</p>
                  <ul className="mt-4 space-y-2 text-sm text-gray-700">
                    {pillar.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-teal" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Why teams switch</p>
            <h3 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">Traditional diagramming vs PML Modeller workflow</h3>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <article className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                <p className="text-sm font-bold text-gray-900">Traditional diagramming</p>
                <ul className="mt-4 space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-gray-400" />Start with canvas mechanics before process logic</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-gray-400" />Edits often require manual rework across lanes and links</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-gray-400" />Review cycles rely on static exports and disconnected comments</li>
                </ul>
              </article>
              <article className="rounded-2xl border border-teal/25 bg-honeydew/40 p-6">
                <p className="text-sm font-bold text-gray-900">PML Modeller workflow</p>
                <ul className="mt-4 space-y-3 text-sm text-gray-700">
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-teal" />Start with intent in text and render structure immediately</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-teal" />Use AI suggestions as reviewable process edits</li>
                  <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-teal" />Share controlled views while preserving source continuity</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="py-16 border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Animated workflow preview</p>
              <h3 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Watch text become process flow</h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
                This is the core product moment: define process intent in text, then watch dependencies and sequence render into a structured visual flow in real time.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-900 p-5 shadow-xl">
              <svg viewBox="0 0 560 180" className="w-full h-auto" role="img" aria-label="Animated process flow">
                <rect x="18" y="62" width="104" height="52" rx="10" fill="#0F766E" opacity="0.9" />
                <rect x="228" y="22" width="104" height="52" rx="10" fill="#FFB563" opacity="0.95" />
                <rect x="228" y="106" width="104" height="52" rx="10" fill="#A26769" opacity="0.95" />
                <rect x="438" y="62" width="104" height="52" rx="10" fill="#2E2E2E" stroke="#6B7280" />

                <path d="M122 88 C160 88, 184 48, 228 48" className="feature-flow-path" />
                <path d="M122 88 C160 88, 184 132, 228 132" className="feature-flow-path feature-flow-path-delay" />
                <path d="M332 48 C370 48, 394 88, 438 88" className="feature-flow-path" />
                <path d="M332 132 C370 132, 394 88, 438 88" className="feature-flow-path feature-flow-path-delay" />

                <text x="70" y="92" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Start</text>
                <text x="280" y="52" textAnchor="middle" fill="#111827" fontSize="12" fontWeight="700">Verify</text>
                <text x="280" y="136" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Review</text>
                <text x="490" y="92" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">Complete</text>
              </svg>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50/60">
          <div className="mx-auto max-w-6xl px-6 grid gap-10 lg:grid-cols-2 items-center">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wider font-semibold">
                <span>Actor view</span>
                <span>Live focus mode</span>
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-gray-200 px-4 py-3 bg-white">
                  <p className="text-sm font-semibold text-gray-800">Customer lane</p>
                </div>
                <div className="rounded-lg border border-teal/30 px-4 py-3 bg-teal/10 feature-lane-active">
                  <p className="text-sm font-semibold text-teal">Operations lane (active)</p>
                </div>
                <div className="rounded-lg border border-gray-200 px-4 py-3 bg-white">
                  <p className="text-sm font-semibold text-gray-800">Compliance lane</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Animated actor focus</p>
              <h3 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Guide stakeholders through their part of the process</h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
                Highlight a single role path during reviews or training so each audience sees exactly what applies to them without processing the full diagram complexity.
              </p>
              <div className="mt-6 flex gap-3">
                <Link href="/auth/signin?from=features" className="rounded-lg bg-teal px-5 py-3 text-sm font-semibold text-white hover:bg-teal/90">
                  Start free
                </Link>
                <Link href="/demo" className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 hover:border-teal hover:text-teal">
                  See live demo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
