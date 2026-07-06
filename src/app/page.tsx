'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';

/* ──────────────────────────────────────────
   PipelineFlow — vertical animated flow for
   AI Modelling & Signoff sections
   ────────────────────────────────────────── */
function PipelineFlow({ steps }: { steps: readonly string[] }) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveIdx((p) => (p + 1) % steps.length), 1200);
    return () => clearInterval(t);
  }, [steps.length]);

  return (
    <div className="flex flex-col items-center gap-0">
      {steps.map((step, i) => (
        <div key={step} className="flex flex-col items-center">
          <div
            className={`flex h-10 min-w-[160px] items-center justify-center rounded-lg border-2 px-4 text-sm font-semibold transition-all duration-700 ${
              i === activeIdx
                ? 'border-teal bg-teal text-white shadow-md shadow-teal/20 scale-105'
                : i < activeIdx
                  ? 'border-teal/30 bg-honeydew/60 text-teal'
                  : 'border-gray-200 bg-white text-gray-400'
            }`}
          >
            {step}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-6 w-0.5 transition-colors duration-700 ${
                i < activeIdx ? 'bg-teal/50' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────
   SectionDivider
   ────────────────────────────────────────── */
function SectionDivider() {
  return <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />;
}

/* ──────────────────────────────────────────
   Home page
   ────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main>
        {/* ════════════════════════════════════
            S1 — Hero
           ════════════════════════════════════ */}
        <section className="relative overflow-hidden border-b border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-honeydew/70 via-white to-white" />
          <div className="absolute -top-20 -right-16 h-72 w-72 rounded-full bg-sandy/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-16 h-60 w-60 rounded-full bg-teal/10 blur-3xl" />
          <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28 relative">
            <div className="grid gap-6 lg:grid-cols-[0.7fr,1.5fr] items-center">
              {/* left column — copy */}
              <div className="page-enter lg:-ml-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">
                  AI-native process modelling
                </p>
                <h1 className="feature-gradient-text mt-5 text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
                  Model Enterprise Processes<br />at the Speed of Thought
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600 max-w-xl">
                  PML is an AI-native process language designed for enterprise productivity.
                  Focus on the process itself — not boxes, arrows, and layout.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/auth/signin"
                    className="rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal/20 hover:bg-teal/90 transition-colors"
                  >
                    Start Modelling
                  </Link>
                  <Link
                    href="/demo"
                    className="rounded-lg border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-900 hover:border-teal hover:text-teal transition-colors"
                  >
                    View Example
                  </Link>
                  <Link
                    href="/auth/signin?feature=ai"
                    className="rounded-lg px-6 py-3 text-sm font-semibold text-teal hover:text-teal/80 transition-colors"
                  >
                    Generate with AI →
                  </Link>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  No credit card required. Build your first real process in minutes.
                </p>
              </div>

              {/* right column — workflow video */}
              <div className="page-enter-delay lg:-mr-32">
                <video
                  className="w-full rounded-2xl shadow-xl shadow-teal/10 ring-1 ring-gray-100"
                  src="/media/pml-workflow.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════
            S2 — The Problem
           ════════════════════════════════════ */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">The problem</p>
              <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Enterprise Process Modelling Is Broken
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Most enterprise modelling tools force you to spend more time arranging boxes
                than describing the process itself.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: '⊞', text: 'Diagram layout consumes most modelling effort' },
                { icon: '⚠', text: 'Process quality depends on modeller experience' },
                { icon: '○', text: 'AI struggles with visual diagram formats' },
                { icon: '✕', text: 'Knowledge is lost after workshops end' },
                { icon: '✎', text: 'Process sign-off is manual and painful' },
                { icon: '⚑', text: 'Changes require full diagram redraws' },
              ].map((item) => (
                <div
                  key={item.text}
                  className="feature-card-hover flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4"
                >
                  <span className="mt-0.5 text-lg text-teal">{item.icon}</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ════════════════════════════════════
            S3 — Meet PML
           ════════════════════════════════════ */}
        <section className="py-20 bg-gradient-to-r from-honeydew/30 via-white to-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Meet PML</p>
              <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Designed for Enterprise Productivity
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                PML is a process modelling language designed specifically for enterprise productivity
                — to model processes at speed.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: 'AI Native',
                  icon: '◆',
                  text: 'Built for AI understanding and generation. The syntax is designed so AI can read, write, and validate processes without ambiguity.',
                },
                {
                  title: 'Quality Enforced',
                  icon: '◈',
                  text: 'The language itself guides completeness and consistency. Missing actors, undefined flows, and gaps surface immediately — not during review.',
                },
                {
                  title: 'Knowledge Retained',
                  icon: '◇',
                  text: 'Processes become maintainable enterprise assets rather than static pictures. Version-controlled, diffable, reviewable — the process outlives the workshop.',
                },
              ].map((card) => (
                <article
                  key={card.title}
                  className="feature-card-hover rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <span className="text-2xl text-teal">{card.icon}</span>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">{card.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ════════════════════════════════════
            S4 — Why Model as Text?
           ════════════════════════════════════ */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-sandy">Why text</p>
              <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Why Model as Text?
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                It&apos;s a text specification — AI focused and lean. The tool does all layout and
                you don&apos;t need to worry. But because of this, we have so much freedom for
                other things: rendering in different views, AI analysis, export to any format.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {/* traditional */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Traditional</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-4xl text-gray-400">
                  <span className="h-12 w-12 rounded border-2 border-gray-300 bg-white" />
                  <span className="text-2xl">→</span>
                  <span className="h-12 w-12 rounded border-2 border-gray-300 bg-white" />
                  <span className="text-2xl">→</span>
                  <span className="h-12 w-12 rounded-full border-2 border-gray-300 bg-white" />
                </div>
                <ul className="mt-6 space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Manual layout</li>
                  <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Diagram maintenance</li>
                  <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Difficult for AI</li>
                  <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Limited views</li>
                </ul>
              </div>

              {/* PML */}
              <div className="rounded-2xl border border-teal/20 bg-honeydew/30 p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-teal">PML</p>
                <pre className="mt-4 overflow-x-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-gray-200 font-mono">
{`@process L3 "Loan Origination"
event appReq inbound
event appSub outbound

actor Bank
  task validate as "Validate"
  task approve  as "Approve"
  task reject   as "Reject"

flow key
  appReq > validate > approve > appSub
  reject > appSub`}
                </pre>
                <ul className="mt-6 space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2"><span className="text-teal">✓</span> Focus on intent</li>
                  <li className="flex items-center gap-2"><span className="text-teal">✓</span> AI friendly</li>
                  <li className="flex items-center gap-2"><span className="text-teal">✓</span> Source controlled</li>
                  <li className="flex items-center gap-2"><span className="text-teal">✓</span> Multiple renderings</li>
                  <li className="flex items-center gap-2"><span className="text-teal">✓</span> Automatically laid out</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-xl font-bold text-gray-900">
                You write the process. <span className="text-teal">We handle the diagram.</span>
              </p>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ════════════════════════════════════
            S5 — AI Assisted Modelling
           ════════════════════════════════════ */}
        <section className="py-20 bg-gradient-to-br from-honeydew/40 via-white to-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-[1fr,1.2fr] items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">AI assisted</p>
                <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                  AI-Assisted Modelling
                </h2>
                <p className="mt-4 text-lg leading-8 text-gray-600">
                  Describe your process. The PML DSL pushes modelling quality to both the modeller
                  and AI — every suggestion is reviewable, every edit is structured.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    { title: 'Describe Your Process', text: 'Explain the process in natural language. No syntax required to start.' },
                    { title: 'AI Generates PML', text: 'Generate structured enterprise models instantly from plain descriptions.' },
                    { title: 'AI Challenges Assumptions', text: 'The AI actively interrogates for gaps, inconsistencies, and missing edge cases.' },
                    { title: 'Live Visualisation', text: 'See your process rendered in real time as the AI works.' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-start gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-teal shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <PipelineFlow
                  steps={[
                    'Describe Process',
                    'AI Generates PML',
                    'PML Validates',
                    'AI Interrogates',
                    'Diagram Updates Live',
                    'Enterprise Approval',
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ════════════════════════════════════
            S6 — Quality by Design
           ════════════════════════════════════ */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-10 lg:grid-cols-2 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-smoky">Quality</p>
                <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                  Quality by Design
                </h2>
                <p className="mt-4 text-lg leading-8 text-gray-600">
                  PML embeds modelling standards directly into the language. The grammar itself
                  requires completeness — partial models are valid drafts, but published models
                  must be complete.
                </p>
                <ul className="mt-6 space-y-3 text-sm text-gray-700">
                  {[
                    'Mandatory structure — the grammar enforces completeness',
                    'Real-time diagnostics surface gaps as you type',
                    'Built-in compliance with common process frameworks',
                    'AI layer reviews for logical consistency, not just syntax',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-0.5 text-teal">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* validation visual */}
              <div className="rounded-2xl border border-gray-200 bg-gray-900 p-6 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Live Validation</p>
                <div className="mt-4 space-y-3 font-mono text-sm">
                  {[
                    { msg: '⚠ Missing actor', variant: 'amber' },
                    { msg: '⚠ Missing exception flow', variant: 'amber' },
                    { msg: '⚠ Missing approval step', variant: 'amber' },
                    { msg: '⚠ Undefined business rule', variant: 'amber' },
                    { msg: '✓ Process complete', variant: 'green' },
                  ].map((d) => (
                    <div
                      key={d.msg}
                      className={`rounded-lg border px-3 py-2 ${
                        d.variant === 'green'
                          ? 'border-teal/30 bg-teal/10 text-teal'
                          : 'border-sandy/30 bg-sandy/10 text-sandy'
                      }`}
                    >
                      {d.msg}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ════════════════════════════════════
            S7 — Enterprise Process Signoff
           ════════════════════════════════════ */}
        <section className="py-20 bg-gray-50/60">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-[1.2fr,1fr] items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-sandy">Signoff</p>
                <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                  Stop Scheduling Workshops.
                </h2>
                <p className="mt-4 text-lg leading-8 text-gray-600">
                  Send deeplinks to SMEs for feedback — AI assisted. The system handles commentary,
                  approval state, and audit history without scheduling a single meeting.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    'Deep-link reviews — no account required',
                    'AI assisted interviews with SMEs',
                    'Approval workflows with audit trail',
                    'Threaded feedback on specific nodes',
                    'Colour-coded approval state visualisation',
                    'Every change logged and attributable',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-teal" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <PipelineFlow
                  steps={[
                    'Model Complete',
                    'Send Deep Link',
                    'SME Reviews',
                    'AI Interviews SME',
                    'Changes Applied',
                    'Approval Recorded',
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ════════════════════════════════════
            S8 — Multiple Views
           ════════════════════════════════════ */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Views</p>
              <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Multiple Views. One Source of Truth.
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                Because PML models processes as structured knowledge rather than static diagrams,
                the same process can be rendered in many different ways — each automatically laid
                out from the same source.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Process View', desc: 'Standard end-to-end flow' },
                { label: 'Swimlane View', desc: 'Actor-aligned lanes' },
                { label: 'Capability View', desc: 'Function-oriented grouping' },
                { label: 'Journey View', desc: 'Customer experience lens' },
                { label: 'BPMN Export', desc: 'Standard interchange format' },
                { label: 'Image Export', desc: 'PNG or SVG output' },
                { label: 'Custom Renderers', desc: 'Build your own view' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="feature-card-hover rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-center"
                >
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ════════════════════════════════════
            S9 — Export to BPMN
           ════════════════════════════════════ */}
        <section className="py-20 bg-gradient-to-br from-honeydew/30 via-white to-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-10 lg:grid-cols-2 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-smoky">Export</p>
                <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                  Export to BPMN
                </h2>
                <p className="mt-4 text-lg leading-8 text-gray-600">
                  Need BPMN? No problem. Build rapidly in PML, use AI assistance, refine
                  interactively — then export to standard BPMN format with your layout preserved.
                </p>
                <div className="mt-6 space-y-3 text-sm text-gray-700">
                  {[
                    'Our layout algorithm is the bridge to BPMN compatibility',
                    'Get to a mature model fast — no manual repositioning after export',
                    'Platform handles the diagram; you keep the process knowledge',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-teal shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <PipelineFlow
                  steps={[
                    'PML',
                    'AI Assisted Refinement',
                    'Automatic Layout',
                    'BPMN Export',
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ════════════════════════════════════
            S10 — How It Works
           ════════════════════════════════════ */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">How it works</p>
              <h2 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                Three Ways to Model
              </h2>
              <p className="mt-4 text-lg leading-8 text-gray-600">
                You can write PML directly, describe the process to AI, or collaborate with your
                team through structured review.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Write PML',
                  desc: 'You write. We render. Full control for power users who want precise, hand-crafted process definitions.',
                  borderCls: 'border-teal/20',
                  textCls: 'text-teal',
                },
                {
                  step: '02',
                  title: 'Describe to AI',
                  desc: 'You explain. AI models. Start with natural language and finish with a structured, validated process.',
                  borderCls: 'border-sandy/20',
                  textCls: 'text-sandy',
                },
                {
                  step: '03',
                  title: 'Collaborate',
                  desc: 'Experts review. AI interrogates. Teams approve. End-to-end enterprise workflow for mature operating models.',
                  borderCls: 'border-smoky/20',
                  textCls: 'text-smoky',
                },
              ].map((card) => (
                <article
                  key={card.step}
                  className={`feature-card-hover rounded-2xl border ${card.borderCls} bg-white p-6 shadow-sm`}
                >
                  <p className={`text-xs font-bold uppercase tracking-wider ${card.textCls}`}>
                    {card.step}
                  </p>
                  <h3 className="mt-3 text-lg font-bold text-gray-900">{card.title}</h3>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{card.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ════════════════════════════════════
            S11 — Pricing
           ════════════════════════════════════ */}
        <section className="py-20 bg-gray-50/60">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal">Pricing</p>
                <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                  Start free. Upgrade when the workflow demands it.
                </h2>
              </div>
              <Link
                href="/pricing"
                className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 hover:border-teal hover:text-teal transition-colors"
              >
                See full pricing
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {[
                { name: 'Free', price: '$0', desc: 'Build and validate real process models.', highlight: false },
                { name: 'Starter', price: '$12', desc: 'For practitioners who share and iterate weekly.', highlight: true },
                { name: 'Pro', price: '$29', desc: 'For teams standardizing process operations.', highlight: false },
              ].map((plan) => (
                <article
                  key={plan.name}
                  className={`rounded-2xl border p-6 ${
                    plan.highlight
                      ? 'border-teal/30 bg-honeydew/40'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <h3 className="font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {plan.price}
                    <span className="text-base font-medium text-gray-500">/mo</span>
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{plan.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ════════════════════════════════════
            S12 — Final CTA
           ════════════════════════════════════ */}
        <section className="py-24 bg-white">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="feature-orb mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-teal/20 to-sandy/20 blur-2xl" />
            <h2 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-gray-900 leading-[1.15]">
              Process knowledge should be written, validated, collaborated on, and generated by AI
              —{' '}
              <span className="feature-gradient-text">not drawn by hand.</span>
            </h2>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/auth/signin"
                className="rounded-lg bg-teal px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-teal/20 hover:bg-teal/90 transition-colors"
              >
                Start Modelling
              </Link>
              <Link
                href="/demo"
                className="rounded-lg border border-gray-200 px-8 py-3 text-sm font-semibold text-gray-900 hover:border-teal hover:text-teal transition-colors"
              >
                View Demo
              </Link>
              <Link
                href="/demo"
                className="rounded-lg px-8 py-3 text-sm font-semibold text-teal hover:text-teal/80 transition-colors"
              >
                Read the Language Spec →
              </Link>
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
            <Link href="/features" className="hover:text-teal transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-teal transition-colors">Pricing</Link>
            <a href="#" className="hover:text-teal transition-colors">Privacy</a>
            <a href="#" className="hover:text-teal transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}