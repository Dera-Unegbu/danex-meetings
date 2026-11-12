'use client';

import { Moon, Sun, UserRound, Zap } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { UsageSummary } from '@/lib/briefing-api';

type Theme = 'dark' | 'light';
type AuthMode = 'signin' | 'signup';

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  usage: UsageSummary | null;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onAuthenticate: (mode: AuthMode) => void;
  onSignOut: () => void;
}

export function AccountModal({
  open,
  onOpenChange,
  user,
  usage,
  theme,
  onThemeChange,
  onAuthenticate,
  onSignOut,
}: AccountModalProps) {
  const isGuest = user.is_anonymous === true;
  const name = typeof user.user_metadata.full_name === 'string'
    ? user.user_metadata.full_name
    : '';
  const initial = isGuest ? 'G' : (name || user.email || 'U').trim().charAt(0).toUpperCase();

  function startAuthentication(mode: AuthMode) {
    onOpenChange(false);
    onAuthenticate(mode);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-slate-800/80 bg-slate-900/95 text-slate-100 shadow-2xl shadow-sky-950/40 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-600 text-sm font-bold text-white">
              {initial}
            </span>
            Account and settings
          </DialogTitle>
          <DialogDescription className="pt-1 text-slate-400">
            {isGuest
              ? 'Guest account · Please sign in for more usage.'
              : name || user.email || 'Signed-in account'}
          </DialogDescription>
        </DialogHeader>

        <section className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
              <Zap className="h-4 w-4 text-sky-400" aria-hidden="true" />
              Token usage
            </div>
            <span className="font-mono text-xs text-slate-300">
              {usage ? `${usage.remaining} / ${usage.limit} left` : 'Loading...'}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-[width]"
              style={{
                width: `${usage ? Math.min(100, (usage.used / usage.limit) * 100) : 0}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {isGuest
              ? 'Guest plan · 5 briefings total'
              : 'Free account · 50 briefings total'}
          </p>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
          <p className="mb-3 text-sm font-medium text-slate-200">Theme</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              aria-pressed={theme === 'dark'}
              onClick={() => onThemeChange('dark')}
              className="gap-2 border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800"
            >
              <Moon className="h-4 w-4" aria-hidden="true" />
              Dark
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-pressed={theme === 'light'}
              onClick={() => onThemeChange('light')}
              className="gap-2 border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800"
            >
              <Sun className="h-4 w-4" aria-hidden="true" />
              Light
            </Button>
          </div>
        </section>

        {isGuest ? (
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-slate-400">
              Sign in to get 50 briefings and store your briefings for later.
            </p>
            <Button
              type="button"
              onClick={() => startAuthentication('signup')}
              className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 font-semibold text-white hover:from-sky-400 hover:to-indigo-400"
            >
              <UserRound className="mr-2 h-4 w-4" aria-hidden="true" />
              Sign up with email
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => startAuthentication('signin')}
              className="w-full text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              I already have an account
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onSignOut}
            className="w-full rounded-xl border-slate-700 bg-transparent text-slate-200 hover:bg-slate-800"
          >
            Sign out
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
