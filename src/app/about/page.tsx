import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-teal">PML Modeller</Link>
          <div className="flex gap-6 text-sm font-medium">
            <Link href="/#features" className="text-gray-600 hover:text-teal transition-colors">Features</Link>
            <Link href="/about" className="text-teal font-semibold">About</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-teal transition-colors">Pricing</Link>
            <Link href="/auth/signin" className="text-gray-600 hover:text-teal transition-colors">Sign in</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-16 lg:grid-cols-2 items-start">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              We're making process modelling feel like writing.
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              PML Modeller was created by a team that got tired of fighting diagramming tools. We wanted something that let us think in text, move fast, and still produce diagrams people could actually read.
            </p>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              The result is PML—a concise, AI-readable language for process modelling—and a live editor that renders it in real time.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Our mission</h3>
              <p className="text-gray-600 leading-relaxed">
                Most organisation run on processes that live in slides, wikis, and people&apos;s heads. PML Modeller exists to give those processes a single, editable, shareable home—one that feels as natural as writing a document.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Why PML?</h3>
              <p className="text-gray-600 leading-relaxed">
                PML is purpose-built for collaboration between humans and AI. Unlike BPMN or Visio, it compresses complexity into a readable language while remaining expressive enough for enterprise workflows.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Who it&apos;s for</h3>
              <p className="text-gray-600 leading-relaxed">
                Business analysts, operations teams, engineering leads, and consultants. Anyone who needs to document, review, or iterate on processes without leaving their text editor.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="text-4xl font-bold text-teal">10k+</div>
            <div className="mt-1 text-sm text-gray-600">Diagrams created</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-sandy">2,400+</div>
            <div className="mt-1 text-sm text-gray-600">Teams onboarded</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-smoky">99.9%</div>
            <div className="mt-1 text-sm text-gray-600">Uptime SLA</div>
          </div>
        </div>

        <div className="mt-24 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to try?</h2>
          <p className="text-gray-600 mb-8">Start with 10 free diagrams. No credit card required.</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal/20 hover:bg-teal/90 transition-all"
          >
            Get started free
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} PML Modeller. Built with pml-core.
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-teal transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-teal transition-colors">Pricing</Link>
            <a href="#" className="hover:text-teal transition-colors">Privacy</a>
            <a href="#" className="hover:text-teal transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}