'use client';

import type { FormEvent } from 'react';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GATEWAY_MODELS,
  MEETING_TYPES,
  type GatewayModel,
  type MeetingType,
} from '@/lib/briefing-types';
import type { BriefingStage } from '@/lib/briefing-generator';
import { Textarea } from '@/components/ui/textarea';

const STAGE_LABELS: Record<BriefingStage, string> = {
  searching: 'Searching Tavily...',
  synthesizing: 'Synthesizing with Bifrost...',
};

const PRESET_TARGETS = ['Anthropic', 'OpenAI', 'Stripe', 'Figma'];
const MAX_MEETING_DESCRIPTION_WORDS = 1000;

function countWords(value: string): number {
  return value.trim().match(/\S+/g)?.length ?? 0;
}

function limitWords(value: string, limit: number): string {
  const words = value.trim().split(/\s+/);
  if (!value.trim() || words.length <= limit) return value;
  return words.slice(0, limit).join(' ');
}

interface ControlPanelProps {
  target: string;
  onTargetChange: (value: string) => void;
  meetingType: MeetingType;
  onMeetingTypeChange: (value: MeetingType) => void;
  meetingDescription: string;
  onMeetingDescriptionChange: (value: string) => void;
  meetingAt: string;
  onMeetingAtChange: (value: string) => void;
  model: GatewayModel;
  onModelChange: (value: GatewayModel) => void;
  stage: BriefingStage | null;
  onGenerate: () => void;
}

export function ControlPanel({
  target,
  onTargetChange,
  meetingType,
  onMeetingTypeChange,
  meetingDescription,
  onMeetingDescriptionChange,
  meetingAt,
  onMeetingAtChange,
  model,
  onModelChange,
  stage,
  onGenerate,
}: ControlPanelProps) {
  const isGenerating = stage !== null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onGenerate();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-panel backdrop-blur-md sm:p-8 print:hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl"
      />

      <div className="relative">
        <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-sky-400">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Pre-meeting intelligence
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Know the room before you walk in.
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">
          Enter a company or person and we&apos;ll assemble a dated, source-backed executive dossier
          for your next meeting.
        </p>

        <div className="mt-6 space-y-2">
          <Label
            htmlFor="target"
            className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400"
          >
            Company or person (add location if relevant)
          </Label>
          <div className="group relative">
            <Search
              className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-sky-400"
              aria-hidden="true"
            />
            <Input
              id="target"
              value={target}
              onChange={(event) => onTargetChange(event.target.value)}
              placeholder="e.g. Acme Robotics, Austin, TX or Jane Doe in London"
              maxLength={240}
              className="h-14 rounded-full border-slate-700/70 bg-slate-950/60 pl-12 pr-5 text-base text-white shadow-inner shadow-black/30 transition-shadow placeholder:text-slate-500 focus-visible:border-sky-500/60 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-0"
              disabled={isGenerating}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Try</span>
            {PRESET_TARGETS.map((preset) => {
              const isActive = target.trim().toLowerCase() === preset.toLowerCase();
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={isGenerating}
                  onClick={() => onTargetChange(preset)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 ${
                    isActive
                      ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:-translate-y-0.5 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-2 lg:col-span-3">
            <Label
              htmlFor="meeting-type"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
            >
              Meeting type
            </Label>
            <Select
              value={meetingType}
              onValueChange={(value) => onMeetingTypeChange(value as MeetingType)}
              disabled={isGenerating}
            >
              <SelectTrigger
                id="meeting-type"
                className="h-11 rounded-xl border-slate-800 bg-slate-950/50 text-slate-200 focus:ring-2 focus:ring-sky-500/50 focus:ring-offset-0"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-800 bg-slate-900 text-slate-200">
                {MEETING_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
                <SelectItem value="Custom">Custom — let AI infer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {meetingType === 'Custom' && (
            <div className="space-y-2 md:col-span-2 lg:col-span-12">
              <Label
                htmlFor="meeting-description"
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
              >
                Describe this meeting
              </Label>
              <Textarea
                id="meeting-description"
                value={meetingDescription}
                onChange={(event) =>
                  onMeetingDescriptionChange(
                    limitWords(event.target.value, MAX_MEETING_DESCRIPTION_WORDS)
                  )
                }
                placeholder="Describe the goal, attendees, or context. The AI will infer the meeting style."
                className="min-h-28 rounded-xl border-slate-800 bg-slate-950/50 text-slate-200 placeholder:text-slate-500 focus-visible:border-sky-500/60 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-0"
                disabled={isGenerating}
              />
              <p className="text-right font-mono text-[10px] text-slate-500">
                {countWords(meetingDescription)}/{MAX_MEETING_DESCRIPTION_WORDS} words
              </p>
            </div>
          )}

          <div className="space-y-2 lg:col-span-5">
            <Label
              htmlFor="meeting-at"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
            >
              Meeting date and time
            </Label>
            <Input
              id="meeting-at"
              type="datetime-local"
              value={meetingAt}
              onChange={(event) => onMeetingAtChange(event.target.value)}
              className="h-11 rounded-xl border-slate-800 bg-slate-950/50 text-slate-200 [color-scheme:dark] focus-visible:border-sky-500/60 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-0"
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2 lg:col-span-4">
            <Label
              htmlFor="model"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
            >
              Model gateway
            </Label>
            <Select
              value={model}
              onValueChange={(value) => onModelChange(value as GatewayModel)}
              disabled={isGenerating}
            >
              <SelectTrigger
                id="model"
                className="h-11 rounded-xl border-slate-800 bg-slate-950/50 text-slate-200 focus:ring-2 focus:ring-sky-500/50 focus:ring-offset-0"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-800 bg-slate-900 text-slate-200">
                {GATEWAY_MODELS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-800/70 pt-5 sm:flex-row sm:items-center sm:justify-between md:col-span-2 lg:col-span-12">
            <p className="max-w-xl text-xs leading-relaxed text-slate-500 sm:text-sm">
              Searches the 30 days before your meeting and cites every claim to a dated source.
            </p>
            <Button
              type="submit"
              disabled={isGenerating}
              className="h-12 min-w-[240px] gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-7 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:-translate-y-0.5 hover:from-sky-400 hover:to-indigo-400 hover:shadow-xl hover:shadow-sky-500/30 disabled:translate-y-0 disabled:opacity-80"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              {stage ? STAGE_LABELS[stage] : 'Generate Briefing'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
