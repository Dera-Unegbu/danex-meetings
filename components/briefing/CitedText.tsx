import { Fragment } from 'react';

const CITATION_PATTERN = /(\[\d+\])/g;

export function CitedText({ text }: { text: string }) {
  return (
    <>
      {text.split(CITATION_PATTERN).map((part, index) => {
        const match = /^\[(\d+)\]$/.exec(part);
        if (!match) {
          return <Fragment key={index}>{part}</Fragment>;
        }
        return (
          <a
            key={index}
            href={`#source-${match[1]}`}
            className="mx-0.5 inline-flex items-center rounded-md border border-sky-500/20 bg-sky-500/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-sky-300 no-underline transition-colors hover:border-sky-400/40 hover:bg-sky-500/20 hover:text-sky-200 print:border-0 print:bg-transparent print:p-0 print:text-slate-700"
          >
            {part}
          </a>
        );
      })}
    </>
  );
}
