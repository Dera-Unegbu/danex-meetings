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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Danex</p>
              <p className="text-xs text-slate-500">Pre-Meeting Intelligence</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open API settings"
            onClick={() => setSettingsOpen(true)}
            className="text-slate-600 hover:text-slate-900"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
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

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
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
