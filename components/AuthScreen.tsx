'use client';

import { type FormEvent, useState } from 'react';
import { Compass, Loader2, Mail, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabase } from '@/lib/supabase';
type AuthMode = 'signin' | 'signup';

interface AuthScreenProps {
  initialMode?: AuthMode;
  onContinueAsGuest: () => Promise<void>;
}

export function AuthScreen({ initialMode = 'signin', onContinueAsGuest }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const supabase = getSupabase();
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMode('signin');
          setMessage('Check your email to confirm your account, then sign in.');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGuest() {
    setBusy(true);
    setError('');
    try {
      await onContinueAsGuest();
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : 'Guest access is unavailable. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0f19] px-4 py-10 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/70 p-7 shadow-2xl shadow-sky-950/30 backdrop-blur-xl sm:p-9">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-lg shadow-sky-500/25">
            <Compass className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Danex</p>
            <p className="text-xs text-slate-400">Pre-Meeting Intelligence</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {mode === 'signup' ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          Save briefings to your account, or continue as a guest with 5 free briefings.
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-7 space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="auth-name" className="text-slate-300">Name</Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
                <Input
                  id="auth-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  maxLength={100}
                  required
                  placeholder="Your name"
                  className="border-slate-700 bg-slate-950/60 pl-10 text-white placeholder:text-slate-500"
                  disabled={busy}
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="auth-email" className="text-slate-300">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" aria-hidden="true" />
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                maxLength={254}
                required
                placeholder="you@example.com"
                className="border-slate-700 bg-slate-950/60 pl-10 text-white placeholder:text-slate-500"
                disabled={busy}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password" className="text-slate-300">Password</Label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={8}
              maxLength={128}
              required
              placeholder="At least 8 characters"
              className="border-slate-700 bg-slate-950/60 text-white placeholder:text-slate-500"
              disabled={busy}
            />
          </div>

          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          {message && <p role="status" className="text-sm text-emerald-300">{message}</p>}

          <Button
            type="submit"
            disabled={busy}
            className="h-11 w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 font-semibold text-white hover:from-sky-400 hover:to-indigo-400"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {mode === 'signup' ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-slate-800" />
          or
          <span className="h-px flex-1 bg-slate-800" />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full rounded-xl border-slate-700 bg-transparent text-slate-400"
        >
          Continue with Google (coming soon)
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => void handleGuest()}
          className="mt-3 w-full rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white"
        >
          Continue as Guest
        </Button>
        <p className="mt-2 text-center text-xs text-slate-500">
          Guests get 5 briefings. Please sign in for more usage and to save your briefings.
        </p>

        <p className="mt-6 text-center text-sm text-slate-400">
          {mode === 'signup' ? 'Already have an account?' : 'New to Danex?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup');
              setError('');
              setMessage('');
            }}
            className="font-medium text-sky-400 hover:text-sky-300"
          >
            {mode === 'signup' ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </section>
    </main>
  );
}
