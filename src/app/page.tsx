import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden border-b border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-honeydew/70 via-white to-white" />
          <div className="absolute -top-20 -right-16 h-72 w-72 rounded-full bg-sandy/20 blur-3xl" />
          <div className="mx-auto max-w-6xl px-6 py-24 lg:py-28 relative">
            <div className="grid gap-12 lg:grid-cols-[1fr,1.05fr] items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Text-first process modelling</p>
                <h1 className="mt-5 text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.05]">
                  Turn messy process notes into clean, shareable workflows
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600 max-w-xl">
                  Write in PML, watch diagrams render live, then share or export without hand-drawing a single box.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link href="/auth/signin" className="rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal/20 hover:bg-teal/90 transition-colors">
                    Start free
                  </Link>
                  <Link href="/demo" className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-900 hover:border-teal hover:text-teal transition-colors">
                    See live example
                  </Link>
                </div>
                <p className="mt-4 text-xs text-gray-500">No credit card required. Build your first real process in minutes.</p>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Before</p>
                  <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                    Notes from workshop: Intake request, validate identity, run checks, send approval, archive evidence.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-gray-900 p-4 text-gray-200 shadow-xl">
                    <p className="text-xs text-gray-400 font-mono">customer_onboarding.pml</p>
                    <pre className="mt-2 text-xs leading-relaxed font-mono text-gray-300">
{`@process L3 "Customer Onboarding"
event start inbound
event end outbound

actor Operations
  task verify as "verify identity"
  task checks as "run compliance checks"

flow
start -> verify -> checks -> end`}
                    </pre>
                  </div>
                  <div className="rounded-2xl border border-teal/20 bg-honeydew/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-teal">After</p>
                    <div className="mt-3 space-y-2">
                      <div className="h-8 rounded-md bg-teal/15 border border-teal/25" />
                      <div className="h-8 rounded-md bg-sandy/20 border border-sandy/30" />
                      <div className="h-8 rounded-md bg-smoky/20 border border-smoky/30" />
                    </div>
                    <p className="mt-3 text-xs text-gray-600">Live layout and lane-aware routing update as you type.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-8 border-b border-gray-100 bg-gray-50/70">
          <div className="mx-auto max-w-6xl px-6 grid gap-3 md:grid-cols-3 text-sm text-gray-700">
            <p>Built for ops teams, analysts, and delivery leads.</p>
            <p>Plain-text source of truth for humans and AI.</p>
            <p>Versioned process work, not slide-by-slide rework.</p>
          </div>
        </section>

        <section className="py-20" id="features">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">How it works</h2>
            <p className="mt-4 max-w-2xl text-gray-600">
              From rough notes to production-ready process maps in three straightforward steps.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <article className="rounded-2xl border border-gray-200 p-6 bg-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal">Step 1</p>
                <h3 className="mt-3 font-bold text-gray-900">Write or paste process context</h3>
                <div className="mt-4 h-24 rounded-xl border border-dashed border-gray-300 bg-gray-50" />
                <p className="mt-4 text-sm text-gray-600">Use workshop notes, policies, or direct prompts to create clean PML quickly.</p>
              </article>
              <article className="rounded-2xl border border-gray-200 p-6 bg-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-sandy">Step 2</p>
                <h3 className="mt-3 font-bold text-gray-900">Model renders and updates live</h3>
                <div className="mt-4 h-24 rounded-xl bg-gradient-to-r from-honeydew to-sandy/30" />
                <p className="mt-4 text-sm text-gray-600">Diagram layout and lane routing update as the process evolves.</p>
              </article>
              <article className="rounded-2xl border border-gray-200 p-6 bg-white">
                <p className="text-xs font-semibold uppercase tracking-wider text-smoky">Step 3</p>
                <h3 className="mt-3 font-bold text-gray-900">Share and export for execution</h3>
                <div className="mt-4 h-24 rounded-xl border border-gray-200 bg-white shadow-inner" />
                <p className="mt-4 text-sm text-gray-600">Publish links for review and export visuals for reports or playbooks.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50/60 border-y border-gray-100">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Built for real operating models</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'AI proposals that stay editable',
                  text: 'Get structured edits you can review, apply, and version instead of one-shot generated images.',
                },
                {
                  title: 'Cross-process navigation',
                  text: 'Link parent and child processes so teams can move through the model the same way work actually flows.',
                },
                {
                  title: 'Actor-focused views',
                  text: 'Filter by role to create onboarding and handoff views without duplicating documentation.',
                },
                {
                  title: 'Policy to process acceleration',
                  text: 'Translate compliance or policy text into process structure your team can test and improve.',
                },
                {
                  title: 'Version control ready',
                  text: 'Keep process definitions in plain text so diffs, reviews, and rollbacks stay transparent.',
                },
                {
                  title: 'Shareable process pages',
                  text: 'Publish read-only process views for stakeholders without opening full editing access.',
                },
              ].map((item) => (
                <article key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Pricing</p>
                <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">Start free. Upgrade when the workflow demands it.</h2>
              </div>
              <Link href="/pricing" className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 hover:border-teal hover:text-teal transition-colors">
                See full pricing
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              <article className="rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900">Free</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">$0</p>
                <p className="mt-2 text-sm text-gray-600">Build and validate real process models.</p>
              </article>
              <article className="rounded-2xl border border-teal/30 bg-honeydew/40 p-6">
                <h3 className="font-bold text-gray-900">Starter</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">$12</p>
                <p className="mt-2 text-sm text-gray-600">For practitioners who share and iterate weekly.</p>
              </article>
              <article className="rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900">Pro</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">$29</p>
                <p className="mt-2 text-sm text-gray-600">For teams standardizing process operations.</p>
              </article>
            </div>
          </div>
        </section>
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