'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>Site Access</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html, body {
            width: 100%;
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .container {
            width: 100%;
            max-width: 420px;
            padding: 24px;
          }
          
          .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            padding: 48px 32px;
          }
          
          .logo {
            text-align: center;
            margin-bottom: 24px;
          }
          
          .logo img {
            height: 48px;
            object-fit: contain;
          }
          
          .title {
            text-align: center;
            font-size: 24px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
          }
          
          .subtitle {
            text-align: center;
            font-size: 14px;
            color: #64748b;
            margin-bottom: 32px;
          }
          
          .form-group {
            margin-bottom: 20px;
          }
          
          label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #334155;
            margin-bottom: 8px;
          }
          
          input[type="password"] {
            width: 100%;
            padding: 12px 14px;
            font-size: 16px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            transition: all 0.2s;
            font-family: inherit;
          }
          
          input[type="password"]:focus {
            outline: none;
            border-color: #0f172a;
            box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
          }
          
          button {
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
          
          button:hover:not(:disabled) {
            background: #1e293b;
            box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1);
          }
          
          button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          
          .error {
            padding: 12px 14px;
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #991b1b;
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 20px;
            animation: slideIn 0.2s ease-out;
          }
          
          @keyframes slideIn {
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
            .card {
              padding: 32px 20px;
            }
            
            .title {
              font-size: 20px;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="card">
            <div className="logo">
              {/* Logo would go here */}
            </div>
            <h1 className="title">PML Modeller</h1>
            <p className="subtitle">Enter password to continue</p>

            <form onSubmit={handleSubmit}>
              {error && <div className="error">{error}</div>}

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              <button type="submit" disabled={isLoading}>
                {isLoading ? 'Checking...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      </body>
    </html>
  );
}
