'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bookmark, Compass } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { format, addDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  GATEWAY_MODELS,
  type Briefing,
  type BriefingMeta,
  type GatewayModel,
  type MeetingType,
  type SavedBriefing,
} from '@/lib/briefing-types';
import type { BriefingStage } from '@/lib/briefing-generator';
import { BriefingApiError, getBriefingUsage, requestBriefing, type UsageSummary } from '@/lib/briefing-api';
import { listRecentBriefings } from '@/lib/briefing-store';
import { getSupabase } from '@/lib/supabase';
import { AuthScreen } from './AuthScreen';
import { AccountModal } from './AccountModal';
import { BriefingCanvas } from './BriefingCanvas';
import { ControlPanel } from './ControlPanel';
import { EmptyBriefingState, GenerationProgress } from './GenerationProgress';
import { RecentBriefings } from './RecentBriefings';

function defaultMeetingValue(): string {
  const tomorrowMorning = addDays(new Date(), 1);
  tomorrowMorning.setHours(9, 0, 0, 0);
  return format(tomorrowMorning, "yyyy-MM-dd'T'HH:mm");
}

interface CurrentBriefing {
  meta: BriefingMeta;
  briefing: Briefing;
}

export function PreMeetingApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [target, setTarget] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('Sales Call');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [meetingAt, setMeetingAt] = useState('');
  const [model, setModel] = useState<GatewayModel>(GATEWAY_MODELS[0].value);
  const [accountOpen, setAccountOpen] = useState(false);
  const [stage, setStage] = useState<BriefingStage | null>(null);
  const [current, setCurrent] = useState<CurrentBriefing | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedBriefing[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const refreshHistory = useCallback(async () => {
    if (!user || user.is_anonymous) {
      setHistory([]);
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);
    try {
      setHistory(await listRecentBriefings());
    } catch {
      toast({
        title: 'History unavailable',
        description: 'Recent briefings could not be loaded.',
        variant: 'destructive',
      });
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setMeetingAt(defaultMeetingValue());
    window.localStorage.removeItem('danex.tavilyApiKey');
    window.localStorage.removeItem('danex.bifrostVirtualKey');
    const savedTheme = window.localStorage.getItem('danex.theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      document.documentElement.dataset.theme = savedTheme;
    }

    const supabase = getSupabase();
    let active = true;
    const syncSession = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setAuthReady(true);
      if (!session) {
        setUsage(null);
        return;
      }

      try {
        const currentUsage = await getBriefingUsage(session.access_token);
        if (active) setUsage(currentUsage);
      } catch {
        if (active) {
          toast({
            title: 'Usage unavailable',
            description: 'Your available briefing count could not be loaded.',
            variant: 'destructive',
          });
        }
      }
    };

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        toast({
          title: 'Sign-in unavailable',
          description: error.message,
          variant: 'destructive',
        });
      }
      void syncSession(data.session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user || user.is_anonymous) {
      setHistory([]);
      setHistoryLoading(false);
      return;
    }
    void refreshHistory();
  }, [authReady, user, refreshHistory]);

  function handleThemeChange(nextTheme: 'dark' | 'light') {
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('danex.theme', nextTheme);
  }

  async function handleContinueAsGuest() {
    const { error } = await getSupabase().auth.signInAnonymously();
    if (error) throw error;
  }

  async function handleAuthenticate(mode: 'signin' | 'signup') {
    setAuthMode(mode);
    setAccountOpen(false);
    if (user?.is_anonymous) {
      const { error } = await getSupabase().auth.signOut();
      if (error) {
        toast({
          title: 'Could not leave guest mode',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  }

  async function handleSignOut() {
    const { error } = await getSupabase().auth.signOut();
    if (error) {
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    setAccountOpen(false);
    setAuthMode('signin');
  }

  async function handleGenerate() {
    const trimmedTarget = target.trim();
    const meetingDate = new Date(meetingAt);

    if (!trimmedTarget) {
      toast({
        title: 'Add a target',
        description: 'Enter a company or person to research.',
        variant: 'destructive',
      });
      return;
    }
    if (!meetingAt || Number.isNaN(meetingDate.getTime())) {
      toast({
        title: 'Pick a meeting time',
        description: 'Choose when your meeting is scheduled.',
        variant: 'destructive',
      });
      return;
    }
    if (meetingType === 'Custom' && !meetingDescription.trim()) {
      toast({
        title: 'Describe this meeting',
        description: 'Add a short description so the AI can infer the meeting style.',
        variant: 'destructive',
      });
      return;
    }
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Continue as a guest or sign in to generate a briefing.',
        variant: 'destructive',
      });
      return;
    }

    const { data: sessionData, error: sessionError } = await getSupabase().auth.getSession();
    if (sessionError || !sessionData.session) {
      toast({
        title: 'Session expired',
        description: 'Please sign in again to continue.',
        variant: 'destructive',
      });
      return;
    }

    const meta: BriefingMeta = {
      target: trimmedTarget,
      meetingType,
      meetingDescription:
        meetingType === 'Custom' ? meetingDescription.trim() : undefined,
      meetingAt: meetingDate,
      model,
    };

    try {
      setStage('generating');
      const result = await requestBriefing(meta, sessionData.session.access_token);
      const briefing = result.briefing;
      setUsage(result.usage);
      setCurrent({ meta, briefing });
      setActiveHistoryId(null);
      if (!user.is_anonymous) {
        await refreshHistory();
      } else {
        toast({
          title: 'Sign in to store your briefings for later',
          description: 'Guest briefings are not saved to your account.',
        });
      }
    } catch (error) {
      if (error instanceof BriefingApiError && error.status === 429) {
        toast({
          title: user.is_anonymous ? 'Guest limit reached' : 'Free account limit reached',
          description: error.message,
          variant: 'destructive',
        });
        setAccountOpen(true);
        void getBriefingUsage(sessionData.session.access_token).then(setUsage).catch(() => undefined);
      } else {
        toast({
          title: 'Briefing generation failed',
          description: error instanceof Error ? error.message : 'Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setStage(null);
    }
  }

  function handleSelectHistory(item: SavedBriefing) {
    setCurrent({ meta: item.meta, briefing: item.briefing });
    setActiveHistoryId(item.id);
  }

  if (!authReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0f19] text-slate-400">
        <span className="animate-pulse text-sm">Loading your account...</span>
      </main>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        key={authMode}
        initialMode={authMode}
        onContinueAsGuest={handleContinueAsGuest}
      />
    );
  }

  const accountName = user.is_anonymous
    ? 'Guest'
    : typeof user.user_metadata.full_name === 'string'
      ? user.user_metadata.full_name
      : user.email ?? 'Account';
  const accountInitial = accountName.trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0b0f19] text-slate-100 print:bg-white print:text-black">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 print:hidden">
        <div className="absolute -top-48 left-1/2 h-[560px] w-[880px] -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -right-40 top-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -left-32 top-1/2 h-80 w-80 rounded-full bg-emerald-500/5 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(to_right,rgba(148,163,184,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.10)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-slate-800/60 bg-[#0b0f19]/70 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25 ring-1 ring-white/20">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold tracking-tight text-white">Danex</p>
                <span className="hidden rounded-full border border-slate-700/70 bg-slate-900/70 px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-slate-400 sm:inline-flex">
                  Pre-Meeting
                </span>
              </div>
              <p className="truncate text-[11px] text-slate-500">Intelligence Agent</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {usage && (
              <span className="hidden text-xs text-slate-400 sm:inline">
                {usage.remaining} uses left
              </span>
            )}
            <span className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
              AI Ready
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Open account settings for ${accountName}`}
              onClick={() => setAccountOpen(true)}
              className="h-10 w-10 rounded-full border border-slate-800 bg-slate-900/60 text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              <span className="text-sm font-semibold" aria-hidden="true">{accountInitial}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <ControlPanel
          target={target}
          onTargetChange={setTarget}
          meetingType={meetingType}
          onMeetingTypeChange={setMeetingType}
          meetingDescription={meetingDescription}
          onMeetingDescriptionChange={setMeetingDescription}
          meetingAt={meetingAt}
          onMeetingAtChange={setMeetingAt}
          model={model}
          onModelChange={setModel}
          stage={stage}
          onGenerate={() => void handleGenerate()}
        />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            {stage ? (
              <GenerationProgress stage={stage} />
            ) : current ? (
              <BriefingCanvas meta={current.meta} briefing={current.briefing} />
            ) : (
              <EmptyBriefingState />
            )}
          </div>

          <RecentBriefings
            items={history}
            activeId={activeHistoryId}
            isLoading={historyLoading}
            isGuest={user.is_anonymous === true}
            onSelect={handleSelectHistory}
            onSignIn={() => setAccountOpen(true)}
          />
        </div>
      </main>

      <Button
        asChild
        size="icon"
        aria-label="Scroll to recent briefings"
        className="fixed bottom-4 right-4 z-40 h-12 w-12 rounded-full border border-sky-400/30 bg-slate-900 text-sky-300 shadow-lg shadow-black/40 hover:bg-slate-800 lg:hidden print:hidden"
      >
        <a href="#recent-briefings">
          <Bookmark className="h-5 w-5" aria-hidden="true" />
        </a>
      </Button>

      <AccountModal
        open={accountOpen}
        onOpenChange={setAccountOpen}
        user={user}
        usage={usage}
        theme={theme}
        onThemeChange={handleThemeChange}
        onAuthenticate={(mode) => void handleAuthenticate(mode)}
        onSignOut={() => void handleSignOut()}
      />
    </div>
  );
}
