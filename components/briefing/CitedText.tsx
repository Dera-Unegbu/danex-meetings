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
            className="mx-0.5 inline-flex items-center rounded bg-teal-50 px-1.5 py-0.5 text-xs font-semibold text-teal-800 no-underline transition-colors hover:bg-teal-100 print:bg-transparent print:p-0 print:text-teal-800"
          >
            {part}
          </a>
        );
      })}
    </>
  );
}
