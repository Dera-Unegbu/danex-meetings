import { History } from 'lucide-react';
import { format } from 'date-fns';
import type { SavedBriefing } from '@/lib/briefing-types';

interface RecentBriefingsProps {
  items: SavedBriefing[];
  activeId: string | null;
  isLoading: boolean;
  onSelect: (item: SavedBriefing) => void;
}

export function RecentBriefings({ items, activeId, isLoading, onSelect }: RecentBriefingsProps) {
  return (
    <aside
      id="recent-briefings"
      className="h-fit rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 shadow-xl shadow-sky-950/20 backdrop-blur-md print:hidden lg:sticky lg:top-24"
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-800 bg-slate-950/60 text-sky-400">
          <History className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Recent briefings
        </h2>
      </div>

      {isLoading && items.length === 0 && (
        <p className="animate-pulse text-xs text-slate-500">Loading history...</p>
      )}

      {!isLoading && items.length === 0 && (
        <p className="text-xs leading-relaxed text-slate-500">
          Briefings you generate are saved here so you can reopen them later.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                aria-current={isActive ? 'true' : undefined}
                className={`group relative w-full overflow-hidden rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? 'border-sky-500/40 bg-sky-500/10 shadow-inner shadow-sky-500/5'
                    : 'border-transparent hover:border-slate-800 hover:bg-slate-950/50'
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sky-400"
                  />
                )}
                <p className="truncate text-sm font-medium text-slate-200 transition-colors group-hover:text-white">
                  {item.meta.target}
                </p>
                <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wide text-slate-500">
                  {item.meta.meetingType} | {format(item.meta.meetingAt, 'MMM d, yyyy')}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
