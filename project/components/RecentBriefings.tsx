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
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
      <div className="mb-4 flex items-center gap-2">
        <History className="h-4 w-4 text-teal-700" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-900">Recent briefings</h2>
      </div>

      {isLoading && items.length === 0 && <p className="text-sm text-slate-500">Loading history...</p>}

      {!isLoading && items.length === 0 && (
        <p className="text-sm leading-relaxed text-slate-500">
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
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? 'border-teal-300 bg-teal-50'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <p className="truncate text-sm font-medium text-slate-900">{item.meta.target}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
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
