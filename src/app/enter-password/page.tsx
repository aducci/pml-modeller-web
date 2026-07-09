'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EnterPassword() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/enter-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        // Small delay to ensure cookie is set
        setTimeout(() => router.push('/'), 100);
      } else if (response.status === 401) {
        setError('Incorrect password');
        setPassword('');
        setIsLoading(false);
      } else if (response.status === 400) {
        setError('Password is required');
        setIsLoading(false);
      } else if (response.status === 500) {
        setError(data.error || 'Server error - please contact support');
        setIsLoading(false);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('[SiteGate] Fetch error:', err);
      setIsLoading(false);
    }
  }

  if (!mounted) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '24px' }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
      `}</style>
      
      <div style={{ width: '100%', maxWidth: '420px', background: 'white', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '48px 32px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 600, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          PML Modeller
        </h1>
        
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#64748b', marginBottom: '32px' }}>
          Enter password to continue
        </p>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '12px 14px', background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '6px', fontSize: '14px', marginBottom: '20px', animation: 'slideIn 0.2s ease-out' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#334155', marginBottom: '8px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              disabled={isLoading}
              autoComplete="off"
              style={{ width: '100%', padding: '12px 14px', fontSize: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', transition: 'all 0.2s' }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{ width: '100%', padding: '12px 16px', fontSize: '16px', fontWeight: 500, color: 'white', background: isLoading ? '#6b7280' : '#0f172a', border: 'none', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isLoading ? 0.6 : 1 }}
          >
            {isLoading ? 'Checking...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
