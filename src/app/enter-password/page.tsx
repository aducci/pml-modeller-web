'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  html, body, #__next {
    width: 100%;
    min-height: 100vh;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }
  
  .site-gate-container {
    width: 100%;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  
  .site-gate-card {
    width: 100%;
    max-width: 420px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    padding: 48px 32px;
  }
  
  .site-gate-logo {
    text-align: center;
    margin-bottom: 24px;
  }
  
  .site-gate-logo img {
    height: 48px;
    object-fit: contain;
  }
  
  .site-gate-title {
    text-align: center;
    font-size: 24px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }
  
  .site-gate-subtitle {
    text-align: center;
    font-size: 14px;
    color: #64748b;
    margin-bottom: 32px;
  }
  
  .site-gate-form-group {
    margin-bottom: 20px;
  }
  
  .site-gate-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #334155;
    margin-bottom: 8px;
  }
  
  .site-gate-input {
    width: 100%;
    padding: 12px 14px;
    font-size: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.2s;
    font-family: inherit;
  }
  
  .site-gate-input:focus {
    outline: none;
    border-color: #0f172a;
    box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
  }
  
  .site-gate-button {
    width: 100%;
    padding: 12px 16px;
    font-size: 16px;
    font-weight: 500;
    color: white;
    background: #0f172a;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .site-gate-button:hover:not(:disabled) {
    background: #1e293b;
    box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1);
  }
  
  .site-gate-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .site-gate-error {
    padding: 12px 14px;
    background: #fee2e2;
    border: 1px solid #fecaca;
    color: #991b1b;
    border-radius: 6px;
    font-size: 14px;
    margin-bottom: 20px;
    animation: siteGateSlideIn 0.2s ease-out;
  }
  
  @keyframes siteGateSlideIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 480px) {
    .site-gate-card {
      padding: 32px 20px;
    }
    
    .site-gate-title {
      font-size: 20px;
    }
  }
`;

export default function EnterPassword() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
        router.push('/');
      } else if (response.status === 401) {
        setError('Incorrect password');
        setPassword('');
      } else if (response.status === 400) {
        setError('Password is required');
      } else if (response.status === 500) {
        setError(data.error || 'Server error - please contact support');
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('[SiteGate] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="site-gate-container">
        <div className="site-gate-card">
          <div className="site-gate-logo">{/* Logo would go here */}</div>
          <h1 className="site-gate-title">PML Modeller</h1>
          <p className="site-gate-subtitle">Enter password to continue</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="site-gate-error">{error}</div>}

            <div className="site-gate-form-group">
              <label htmlFor="password" className="site-gate-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                disabled={isLoading}
                autoComplete="off"
                className="site-gate-input"
              />
            </div>

            <button type="submit" disabled={isLoading} className="site-gate-button">
              {isLoading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
