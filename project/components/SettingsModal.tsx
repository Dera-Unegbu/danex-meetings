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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-teal-700" aria-hidden="true" />
            API Settings
          </DialogTitle>
          <DialogDescription>
            Keys are stored only in this browser. They are never saved to the briefing history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="tavily-key">Tavily API Key</Label>
            <Input
              id="tavily-key"
              type={revealed ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              value={draft.tavily}
              onChange={(event) => setDraft({ ...draft, tavily: event.target.value })}
              placeholder="tvly-..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bifrost-key">Bifrost Virtual Key</Label>
            <Input
              id="bifrost-key"
              type={revealed ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              value={draft.bifrost}
              onChange={(event) => setDraft({ ...draft, bifrost: event.target.value })}
              placeholder="Virtual key"
            />
          </div>

          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-800 transition-colors hover:text-teal-900"
          >
            {revealed ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            {revealed ? 'Hide keys' : 'Show keys'}
          </button>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-teal-700 text-white hover:bg-teal-800">
            Save Keys
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
