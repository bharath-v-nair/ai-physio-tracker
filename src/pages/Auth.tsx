import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { BrandMark } from '../components/layout/DashboardLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// FastAPI returns either a message or a list of field errors
const readError = (detail: unknown, fallback: string) => {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg).replace(/^Value error, /, '');
  return fallback;
};

const inputClass = 'block w-full px-3.5 py-2.5 mt-1.5 bg-white border border-rule rounded-[6px] text-ink placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-teal-100';

export const Auth = ({ mode = 'login' }: { mode?: 'login' | 'register' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const expired = params.get('expired') === '1' && mode === 'login';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    try {
      // Sign up: create the account first, then log in with the same details below
      if (mode === 'register') {
        const res = await fetch(`${API_URL}/api/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ full_name: String(form.get('name') || ''), email, password }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(readError(body?.detail, 'Sign-up failed. Use a valid email and a password of at least 8 characters.'));
          return;
        }
      }

      const res = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password }).toString(),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        navigate('/dashboard');
      } else {
        setError('That email and password don\'t match an account.');
      }
    } catch {
      setError("Can't reach the server. It may be starting up: wait 30 seconds and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center px-4 py-12">
      <Link to="/" className="mx-auto mb-8 flex items-center gap-2.5">
        <BrandMark size={30} />
        <span className="text-xl font-bold text-ink">PhysioAI</span>
      </Link>

      <section className="w-full max-w-md mx-auto bg-white border border-rule rounded-[4px] p-6 sm:p-8">
        <h1 className="text-[30px] leading-tight text-ink">{mode === 'login' ? 'Sign in' : 'Create an account'}</h1>
        <p className="text-muted mt-1 mb-6">
          {mode === 'login' ? 'Welcome back.' : 'Takes a minute. Then start with a 20-second posture check.'}
        </p>

        {expired && !error && (
          <p role="status" className="mb-5 px-3.5 py-3 rounded-[4px] bg-paper border border-rule text-sm text-ink">Your session expired. Please sign in again.</p>
        )}
        {error && (
          <p role="alert" className="mb-5 px-3.5 py-3 rounded-[4px] bg-flag-wash text-sm text-ink">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <label className="block text-sm font-semibold text-ink">
              Your name
              <input name="name" type="text" required maxLength={100} autoComplete="name" className={inputClass} />
            </label>
          )}
          <label className="block text-sm font-semibold text-ink">
            Email
            <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={inputClass} />
          </label>
          <label className="block text-sm font-semibold text-ink">
            Password
            <input name="password" type="password" required minLength={mode === 'register' ? 8 : undefined} maxLength={72}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={inputClass} />
            {mode === 'register' && <span className="block mt-1 font-normal text-muted">At least 8 characters.</span>}
          </label>
          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <p className="text-sm text-muted mt-6 text-center">
          {mode === 'login' ? "New here? " : 'Already have an account? '}
          <Link to={mode === 'login' ? '/register' : '/login'} className="font-semibold text-primary hover:underline">
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </Link>
        </p>
      </section>
    </div>
  );
};
