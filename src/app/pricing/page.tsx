'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader';

type BillingCycle = 'monthly' | 'annual';
type PlanName = 'Free' | 'Starter' | 'Pro' | 'Enterprise';

const plans = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    promise: 'Core workflow modelling for individual operators.',
    cta: 'Start free',
    href: '/auth/signin?from=pricing',
    capacity: ['10 diagrams', '3 AI assist sessions per month', '3 BPMN exports'],
    features: ['PNG and SVG export', 'Basic process library', 'Single user workspace'],
  },
  {
    name: 'Starter',
    monthly: 12,
    annual: 10,
    promise: 'For practitioners who share and iterate weekly.',
    cta: 'Choose Starter',
    href: '/auth/signin?from=pricing',
    highlighted: true,
    capacity: ['50 diagrams', '30 AI assist sessions per month', '50 BPMN exports'],
    features: ['Shareable links', 'Cross-process navigation', 'Advanced layout views'],
  },
  {
    name: 'Pro',
    monthly: 29,
    annual: 24,
    promise: 'For teams standardizing process operations.',
    cta: 'Choose Pro',
    href: '/auth/signin?from=pricing',
    capacity: ['Unlimited diagrams', '100 AI assist sessions per month', 'Unlimited BPMN exports'],
    features: ['Layout and view customization', 'Priority support', 'Team process governance'],
  },
  {
    name: 'Enterprise',
    monthly: 1120,
    annual: 920,
    promise: 'Unified process repository with enterprise security and controls.',
    cta: 'Contact sales',
    href: '/auth/signin?from=pricing',
    capacity: ['10 seats included', '2,000 shared AI generations', '100 organizations'],
    features: ['SSO and SCIM', 'Private AI routing', 'Self-hosted options and audit trails'],
  },
] as const;

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingCycle>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanName>('Starter');
  const [seats, setSeats] = useState(1);

  const annualSavings = useMemo(() => {
    return {
      starter: (12 - 10) * 12,
      pro: (29 - 24) * 12,
      enterprise: (1120 - 920) * 12,
    };
  }, []);

  const calculator = useMemo(() => {
    const plan = plans.find((p) => p.name === selectedPlan) ?? plans[1];
    const unit = billing === 'monthly' ? plan.monthly : plan.annual;
    const billableSeats = selectedPlan === 'Enterprise' ? Math.max(seats, 10) : seats;
    const total = unit * billableSeats;
    return {
      plan,
      total,
      billableSeats,
      period: billing === 'monthly' ? 'month' : 'month (annual billing)',
    };
  }, [billing, selectedPlan, seats]);

  return (
    <div className="min-h-screen bg-white page-enter">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden border-b border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-honeydew/70 via-white to-white" />
          <div className="mx-auto max-w-6xl px-6 py-20 relative">
            <p className="text-sm font-semibold uppercase tracking-wider text-teal">Pricing</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-gray-900 max-w-3xl">
              Pick the plan that matches your process maturity
            </h1>
            <p className="mt-5 text-lg text-gray-600 max-w-2xl leading-relaxed">
              Start with practical limits, then scale governance, collaboration, and enterprise controls as your operating model grows.
            </p>

            <p className="mt-10 text-xs font-bold uppercase tracking-[0.16em] text-gray-500">Available plans</p>

            <div className="mt-8 inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setBilling('monthly')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  billing === 'monthly' ? 'bg-teal text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling('annual')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  billing === 'annual' ? 'bg-teal text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Annual
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-500">Save up to 30% with annual billing.</p>
          </div>
        </section>

        <section className="py-14">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-6 lg:grid-cols-4">
              {plans.map((plan) => {
                const price = billing === 'monthly' ? plan.monthly : plan.annual;
                return (
                  <article
                    key={plan.name}
                    className={`rounded-2xl border p-7 shadow-sm ${
                      plan.highlighted ? 'border-teal/40 bg-honeydew/30' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                      {plan.highlighted ? (
                        <span className="rounded-full bg-teal/10 px-3 py-1 text-xs font-semibold text-teal">
                          Most popular
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm text-gray-600">{plan.promise}</p>

                    <div className="mt-6">
                      <p className="text-4xl font-bold text-gray-900">
                        ${price}
                        <span className="ml-1 text-base font-medium text-gray-500">/mo</span>
                      </p>
                      {billing === 'annual' && plan.name === 'Starter' ? (
                        <p className="mt-2 text-xs text-teal">Save ${annualSavings.starter} per year</p>
                      ) : null}
                      {billing === 'annual' && plan.name === 'Pro' ? (
                        <p className="mt-2 text-xs text-teal">Save ${annualSavings.pro} per year</p>
                      ) : null}
                      {billing === 'annual' && plan.name === 'Enterprise' ? (
                        <p className="mt-2 text-xs text-teal">Save ${annualSavings.enterprise} per seat per year</p>
                      ) : null}
                    </div>

                    <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-gray-500">Capacity</p>
                    <ul className="mt-3 space-y-2 text-sm text-gray-700">
                      {plan.capacity.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-teal" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-gray-500">Features</p>
                    <ul className="mt-3 space-y-2 text-sm text-gray-700">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <span className="mt-1 h-2 w-2 rounded-full bg-sandy" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={plan.href}
                      className={`mt-7 inline-flex w-full justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                        plan.highlighted
                          ? 'bg-teal text-white hover:bg-teal/90'
                          : 'border border-gray-200 text-gray-900 hover:border-teal hover:text-teal'
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-12 border-y border-gray-100 bg-gray-50/60">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
              <h3 className="text-2xl font-bold text-gray-900">Pricing calculator</h3>
              <p className="mt-2 text-gray-600">Estimate monthly spend by plan and seat count.</p>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Plan</label>
                    <select
                      value={selectedPlan}
                      onChange={(e) => setSelectedPlan(e.target.value as PlanName)}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                    >
                      {plans.map((plan) => (
                        <option key={plan.name} value={plan.name}>{plan.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Seats</label>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={seats}
                      onChange={(e) => setSeats(Number(e.target.value))}
                      className="mt-2 w-full accent-teal"
                    />
                    <p className="mt-1 text-sm text-gray-600">{seats} selected</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-sm text-gray-600">{calculator.plan.name} plan ({calculator.billableSeats} seats)</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">${calculator.total} / {calculator.period}</p>
                  {billing === 'annual' ? (
                    <p className="mt-2 text-sm text-teal">Billed yearly at ${calculator.total * 12}</p>
                  ) : null}
                  <Link
                    href="/auth/signin?from=pricing"
                    className="mt-5 inline-flex rounded-lg bg-teal px-5 py-3 text-sm font-semibold text-white hover:bg-teal/90"
                  >
                    Continue to checkout
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 border-y border-gray-100 bg-white">
          <div className="mx-auto max-w-6xl px-6">
            <h3 className="text-2xl font-bold text-gray-900">Frequently asked questions</h3>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-5">
                <h4 className="font-semibold text-gray-900">Can I cancel at any time?</h4>
                <p className="mt-2 text-sm text-gray-600">Yes. You can cancel from billing settings and keep access until the end of your paid period.</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-5">
                <h4 className="font-semibold text-gray-900">What happens when I hit limits?</h4>
                <p className="mt-2 text-sm text-gray-600">The blocked action shows an inline upgrade prompt so you can continue without losing context.</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-5">
                <h4 className="font-semibold text-gray-900">Do you support invoicing?</h4>
                <p className="mt-2 text-sm text-gray-600">Invoicing and custom terms are available on enterprise plans.</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-5">
                <h4 className="font-semibold text-gray-900">Is my process data used to train public models?</h4>
                <p className="mt-2 text-sm text-gray-600">No. Customer process content is not used to train public foundation models.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
