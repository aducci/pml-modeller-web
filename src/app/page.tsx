import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-honeydew via-white to-white opacity-70" />
          <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-gradient-to-br from-sandy/20 to-smoky/10 rounded-full blur-3xl" />
          <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32 relative">
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal/10 text-teal text-xs font-semibold uppercase tracking-wider mb-6">
                  <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                  AI-Native Process Modelling
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                  Design processes with words.
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600 max-w-xl">
                  PML is a lightweight language built for AI-native teams. Describe any workflow in structured text and watch it render into a professional process diagram. The same text your model writes is the source of truth for your team.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/auth/signin"
                    className="rounded-lg bg-teal px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-teal/20 hover:bg-teal/90 transition-all"
                  >
                    Start building free
                  </Link>
                  <Link
                    href="/about"
                    className="rounded-lg border border-gray-200 px-6 py-3 text-center text-sm font-semibold text-gray-900 hover:border-teal hover:text-teal transition-all"
                  >
                    Learn more
                  </Link>
                </div>
                <p className="mt-4 text-xs text-gray-500">No credit card required. Free tier includes up to 10 diagrams.</p>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-teal/10 via-sandy/10 to-smoky/10 rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-2xl border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-sandy/80" />
                    <div className="w-3 h-3 rounded-full bg-honeydew/60" />
                    <span className="ml-3 text-xs text-gray-400 font-mono">order_fulfillment.pml</span>
                  </div>
                  <pre className="font-mono text-sm leading-relaxed text-gray-300">
{`process Order Fulfillment {
  actor Customer
  actor Warehouse
  actor Delivery

  Customer -> Warehouse
    : Place Order
  Warehouse -> Warehouse
    : Pick & Pack
  Warehouse -> Delivery
    : Ship
  Delivery -> Customer
    : Deliver
}`}
                  </pre>
                  <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-between text-xs text-gray-400">
                    <span>Auto-layout enabled</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-honeydew animate-pulse" />
                      Rendering...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 bg-gray-50/50 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-transparent via-honeydew/5 to-transparent pointer-events-none" />
          <div className="mx-auto max-w-7xl px-6 relative">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal/10 text-teal text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                Platform capabilities
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
                Built for how modern teams actually work
              </h2>
              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                PML Modeller bridges the gap between rapid ideation and formal process documentation. Everything is designed to keep you in flow.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="group relative rounded-3xl bg-white p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-teal/5 hover:border-teal/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal to-teal/80 flex items-center justify-center mb-6 shadow-lg shadow-teal/20 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Instant rendering</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Watch actors, activities, and flows update live as you type. No compile step, no preview button—just fluid, debounced rendering at 300ms.
                  </p>
                </div>
              </div>

              <div className="group relative rounded-3xl bg-white p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-sandy/5 hover:border-sandy/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-sandy/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sandy to-sandy/80 flex items-center justify-center mb-6 shadow-lg shadow-sandy/20 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">AI-aligned syntax</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    PML is structured for LLMs. Clean grammar, deterministic output means AI generates valid models on the first pass—zero wasted context or credits on broken layouts.
                  </p>
                </div>
              </div>

              <div className="group relative rounded-3xl bg-white p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-smoky/5 hover:border-smoky/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-smoky/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-smoky to-smoky/80 flex items-center justify-center mb-6 shadow-lg shadow-smoky/20 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Enhanced layout algorithms</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Advanced auto-layout with swimlanes, orthogonal routing, and intelligent spacing. From quick sketches to publication-ready BPMN-style documentation in one click.
                  </p>
                </div>
              </div>

              <div className="group relative rounded-3xl bg-white p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-teal/5 hover:border-teal/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal to-teal/80 flex items-center justify-center mb-6 shadow-lg shadow-teal/20 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Rich process metadata</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Attach risks, applications, controls, and compliance tags directly to steps. Every diagram becomes a living process register with full audit traceability.
                  </p>
                </div>
              </div>

              <div className="group relative rounded-3xl bg-white p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-sandy/5 hover:border-sandy/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-sandy/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sandy to-sandy/80 flex items-center justify-center mb-6 shadow-lg shadow-sandy/20 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Per-actor training views</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    See every step through the lens of a specific actor. Perfect for onboarding, training manuals, and stakeholder reviews—filter to one role and trace their entire journey.
                  </p>
                </div>
              </div>

              <div className="group relative rounded-3xl bg-white p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-smoky/5 hover:border-smoky/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-smoky/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-smoky to-smoky/80 flex items-center justify-center mb-6 shadow-lg shadow-smoky/20 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Cross-file process navigation</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Jump between linked sub-processes, referenced workflows, and parent diagrams. A process library that behaves like a hyperlinked knowledge base.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="group relative rounded-3xl bg-white p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-teal/5 hover:border-teal/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal to-teal/80 flex items-center justify-center mb-6 shadow-lg shadow-teal/20 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Shareable links</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Publish read-only diagram views with hardened sharing. Viewers see your product, sign up, and inherit your best practices.
                  </p>
                </div>
              </div>

              <div className="group relative rounded-3xl bg-white p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-sandy/5 hover:border-sandy/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-sandy/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sandy to-sandy/80 flex items-center justify-center mb-6 shadow-lg shadow-sandy/20 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Version control ready</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Plain-text PML lives naturally in Git. Diffs, reviews, and rollbacks work exactly as they should—no proprietary blobs required.
                  </p>
                </div>
              </div>

              <div className="group relative rounded-3xl bg-white p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-smoky/5 hover:border-smoky/20 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-smoky/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-smoky to-smoky/80 flex items-center justify-center mb-6 shadow-lg shadow-smoky/20 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Enterprise security</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    SOC2-ready infrastructure, SSO via Google and GitHub, granular access controls, and SCIM provisioning. Built for teams who take data seriously.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-3xl bg-gradient-to-br from-teal to-teal/90 p-10 lg:p-16 text-white shadow-xl shadow-teal/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sandy/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-smoky/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              <div className="relative grid gap-10 lg:grid-cols-2 items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">
                    The future of process documentation is conversational
                  </h2>
                  <p className="mt-4 text-teal-100 text-lg leading-relaxed">
                    PML was designed from the ground up to be AI-native. That means AI assistants can author, analyse, and refactor processes with confidence—because the grammar is simple enough for machines and precise enough for humans.
                  </p>
                  <ul className="mt-6 space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="mt-1 w-5 h-5 rounded-full bg-honeydew/20 flex items-center justify-center flex-shrink-0">
                        <span className="w-2 h-2 rounded-full bg-honeydew" />
                      </span>
                      <span className="text-teal-50">Prompt your AI to generate entire process maps from meeting notes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 w-5 h-5 rounded-full bg-honeydew/20 flex items-center justify-center flex-shrink-0">
                        <span className="w-2 h-2 rounded-full bg-honeydew" />
                      </span>
                      <span className="text-teal-50">Refactor workflows by instructing the model to merge or split activities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1 w-5 h-5 rounded-full bg-honeydew/20 flex items-center justify-center flex-shrink-0">
                        <span className="w-2 h-2 rounded-full bg-honeydew" />
                      </span>
                      <span className="text-teal-50">Generate compliance-ready diagrams from policy documents automatically</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <p className="text-sm font-medium text-honeydew mb-3">AI Prompt Example</p>
                  <p className="text-white/90 text-sm leading-relaxed">
                    &ldquo;Based on these customer support tickets, map out our returns process. Include the refund approval step, the warehouse inspection, and the notification to the customer. Use PML.&rdquo;
                  </p>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-teal-100">
                      Result: A complete, editable process diagram in seconds.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gray-50/50">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-center text-gray-600 max-w-2xl mx-auto mb-16">
              From idea to diagram in three steps. No steep learning curve, no export friction.
            </p>
            <div className="grid gap-12 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-teal/10 flex items-center justify-center text-lg font-bold text-teal">1</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Write PML</h3>
                <p className="mt-2 text-gray-600 text-sm">Describe activities, actors, and flows using a simple, declarative syntax. Or let your AI write it for you.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-sandy/10 flex items-center justify-center text-lg font-bold text-sandy">2</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Model renders live</h3>
                <p className="mt-2 text-gray-600 text-sm">Watch your diagram build itself. Pan, zoom, and re-layout as the PML evolves.</p>
              </div>
              <div className="text-center">
                <div className="mx-auto h-12 w-12 rounded-full bg-smoky/10 flex items-center justify-center text-lg font-bold text-smoky">3</div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Share or export</h3>
                <p className="mt-2 text-gray-600 text-sm">Publish a shareable link, export SVG for your slide deck, or commit the PML to your repo.</p>
              </div>
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