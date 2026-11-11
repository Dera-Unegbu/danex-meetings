'use client';

import { useCallback, useEffect, useState } from 'react';
import { Compass, Settings } from 'lucide-react';
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
import { describeGenerationError, generateBriefing, type BriefingStage } from '@/lib/briefing-generator';
import { listRecentBriefings, saveBriefing } from '@/lib/briefing-store';
import { loadApiKeys, type ApiKeys } from '@/lib/settings-storage';
import { BriefingCanvas } from './BriefingCanvas';
import { ControlPanel } from './ControlPanel';
import { EmptyBriefingState, GenerationProgress } from './GenerationProgress';
import { RecentBriefings } from './RecentBriefings';
import { SettingsModal } from './SettingsModal';

const EMPTY_KEYS: ApiKeys = { tavily: '', bifrost: '' };

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
  const [target, setTarget] = useState('');
  const [meetingType, setMeetingType] = useState<MeetingType>('Sales Call');
  const [meetingAt, setMeetingAt] = useState('');
  const [model, setModel] = useState<GatewayModel>(GATEWAY_MODELS[0].value);
  const [keys, setKeys] = useState<ApiKeys>(EMPTY_KEYS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stage, setStage] = useState<BriefingStage | null>(null);
  const [current, setCurrent] = useState<CurrentBriefing | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedBriefing[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const refreshHistory = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    setKeys(loadApiKeys());
    setMeetingAt(defaultMeetingValue());
    void refreshHistory();
  }, [refreshHistory]);

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
    if (!keys.tavily || !keys.bifrost) {
      toast({
        title: 'API keys needed',
        description: 'Add your Tavily and Bifrost keys in Settings to generate a briefing.',
        variant: 'destructive',
      });
      setSettingsOpen(true);
      return;
    }

    const meta: BriefingMeta = {
      target: trimmedTarget,
      meetingType,
      meetingAt: meetingDate,
      model,
    };

    try {
      const briefing = await generateBriefing(meta, keys, setStage);
      setCurrent({ meta, briefing });
      setActiveHistoryId(null);
      saveBriefing(meta, briefing)
        .then(refreshHistory)
        .catch(() =>
          toast({
            title: 'Not saved to history',
            description: 'This briefing is on screen, but it could not be saved for later.',
            variant: 'destructive',
          })
        );
    } catch (error) {
      const { title, description } = describeGenerationError(error);
      toast({ title, description, variant: 'destructive' });
    } finally {
      setStage(null);
    }
  }

  function handleSelectHistory(item: SavedBriefing) {
    setCurrent({ meta: item.meta, briefing: item.briefing });
    setActiveHistoryId(item.id);
  }

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
            <span className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
              AI Ready
            </span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open API settings"
              onClick={() => setSettingsOpen(true)}
              className="h-10 w-10 rounded-full border border-slate-800 bg-slate-900/60 text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
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
            onSelect={handleSelectHistory}
          />
        </div>
      </main>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        keys={keys}
        onSave={setKeys}
      />
    </div>
  );
}
