'use client';

import type { FormEvent } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
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

const STAGE_LABELS: Record<BriefingStage, string> = {
  searching: 'Searching Tavily...',
  synthesizing: 'Synthesizing with Bifrost...',
};

interface ControlPanelProps {
  target: string;
  onTargetChange: (value: string) => void;
  meetingType: MeetingType;
  onMeetingTypeChange: (value: MeetingType) => void;
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
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm print:hidden"
    >
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-12">
        <div className="space-y-2 md:col-span-2 lg:col-span-4">
          <Label htmlFor="target">Company or person</Label>
          <Input
            id="target"
            value={target}
            onChange={(event) => onTargetChange(event.target.value)}
            placeholder="e.g. Acme Robotics or Jane Doe"
            maxLength={120}
            className="h-11"
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="meeting-type">Meeting type</Label>
          <Select
            value={meetingType}
            onValueChange={(value) => onMeetingTypeChange(value as MeetingType)}
            disabled={isGenerating}
          >
            <SelectTrigger id="meeting-type" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEETING_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 lg:col-span-3">
          <Label htmlFor="meeting-at">Meeting date and time</Label>
          <Input
            id="meeting-at"
            type="datetime-local"
            value={meetingAt}
            onChange={(event) => onMeetingAtChange(event.target.value)}
            className="h-11"
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-2 lg:col-span-3">
          <Label htmlFor="model">Model gateway</Label>
          <Select
            value={model}
            onValueChange={(value) => onModelChange(value as GatewayModel)}
            disabled={isGenerating}
          >
            <SelectTrigger id="model" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GATEWAY_MODELS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between md:col-span-2 lg:col-span-12">
          <p className="text-sm text-slate-500">
            Searches the 30 days before your meeting and cites every claim to a dated source.
          </p>
          <Button
            type="submit"
            disabled={isGenerating}
            className="h-11 min-w-[220px] gap-2 bg-teal-700 px-6 text-white transition-all hover:bg-teal-800 disabled:opacity-80"
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
    </form>
  );
}
