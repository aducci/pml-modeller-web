'use client';

import { useState } from 'react';

type DevMagicLinkPanelProps = {
  from: string;
};

export function DevMagicLinkPanel({ from }: DevMagicLinkPanelProps) {
  const [email, setEmail] = useState('dev@example.com');
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setMagicLink(null);

    try {
      const response = await fetch('/api/auth/magic-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, from }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Unable to generate magic link.');
      } else {
        setMagicLink(data.magicLink);
      }
    } catch {
      setError('Unable to generate magic link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-sandy/40 bg-sandy/10 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-700">Temporary dev magic link</p>
      <p className="mt-2 text-xs text-gray-600">
        Temporary only: generate a one-time sign-in link to continue UX testing before email delivery is wired.
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-teal focus:outline-none"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {loading ? 'Generating...' : 'Generate link'}
        </button>
      </div>

      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}

      {magicLink ? (
        <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Magic link ready:</p>
          <a href={magicLink} className="mt-1 block break-all text-sm font-medium text-teal underline">
            {magicLink}
          </a>
        </div>
      ) : null}
    </div>
  );
}
