'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveApiKeys, type ApiKeys } from '@/lib/settings-storage';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
}

export function SettingsModal({ open, onOpenChange, keys, onSave }: SettingsModalProps) {
  const [draft, setDraft] = useState<ApiKeys>(keys);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(keys);
      setRevealed(false);
    }
  }, [open, keys]);

  function handleSave() {
    saveApiKeys(draft);
    onSave({ tavily: draft.tavily.trim(), bifrost: draft.bifrost.trim() });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-slate-800/80 bg-slate-900/95 text-slate-100 shadow-2xl shadow-sky-950/40 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-400">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
            </span>
            API Settings
          </DialogTitle>
          <DialogDescription className="pt-1 text-slate-400">
            Keys are stored only in this browser. They are never saved to the briefing history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label
              htmlFor="tavily-key"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
            >
              Tavily API Key
            </Label>
            <Input
              id="tavily-key"
              type={revealed ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              value={draft.tavily}
              onChange={(event) => setDraft({ ...draft, tavily: event.target.value })}
              placeholder="tvly-..."
              className="h-11 rounded-xl border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus-visible:border-sky-500/60 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-0"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="bifrost-key"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400"
            >
              Bifrost Virtual Key
            </Label>
            <Input
              id="bifrost-key"
              type={revealed ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              value={draft.bifrost}
              onChange={(event) => setDraft({ ...draft, bifrost: event.target.value })}
              placeholder="Virtual key"
              className="h-11 rounded-xl border-slate-800 bg-slate-950/60 text-slate-100 placeholder:text-slate-600 focus-visible:border-sky-500/60 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-0"
            />
          </div>

          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="inline-flex items-center gap-2 text-sm font-medium text-sky-400 transition-colors hover:text-sky-300"
          >
            {revealed ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            {revealed ? 'Hide keys' : 'Show keys'}
          </button>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full border-slate-700 bg-transparent text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/25 transition-all hover:from-sky-400 hover:to-indigo-400"
          >
            Save Keys
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
