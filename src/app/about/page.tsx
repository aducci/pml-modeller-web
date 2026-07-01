import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-14 lg:grid-cols-2 items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">About PML Modeller</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
              We built the process modeller we wanted to use ourselves
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Most process knowledge still lives in slide decks, docs, and inbox threads. We wanted a workflow where process design is as fast as writing and as reliable as versioned code.
            </p>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              The result is PML: a concise language that is readable by humans, friendly to AI assistants, and directly connected to a live process diagram.
            </p>

            <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <p className="text-sm font-semibold text-gray-900">From principle to product</p>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-teal" />
                  <span>Text-first process modelling language</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-sandy" />
                  <span>Live layout and lane-aware rendering</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-smoky" />
                  <span>AI-assisted edits that remain fully reviewable</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Principle 1: Text first</h3>
              <p className="text-gray-600 leading-relaxed">
                Process definitions should be readable and editable without a complex UI. The source should stand on its own.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Principle 2: AI compatible by design</h3>
              <p className="text-gray-600 leading-relaxed">
                AI is useful only when outputs are valid and usable. PML is structured so suggestions become reviewable model edits, not throwaway artifacts.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Principle 3: Human auditable</h3>
              <p className="text-gray-600 leading-relaxed">
                Every change should be inspectable in plain text, trackable in version control, and understandable during reviews and audits.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20 rounded-2xl border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900">Where we are now</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">Current stage</p>
              <p className="mt-2 text-sm text-gray-600">Early production rollout with active iteration based on user feedback.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Stable today</p>
              <p className="mt-2 text-sm text-gray-600">Live rendering, AI proposal workflow, shareable read-only pages.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Focus this quarter</p>
              <p className="mt-2 text-sm text-gray-600">Pricing rollout, docs depth, and tighter workflow adoption loops.</p>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Model your next process in text, not in drag-and-drop guesswork</h2>
          <p className="text-gray-600 mb-8">Start with a free workspace and decide later when to scale usage.</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center justify-center rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal/20 hover:bg-teal/90 transition-all"
          >
            Start free
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