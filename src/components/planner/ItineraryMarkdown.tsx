'use client'

/** Preprost prikaz Markdown odstavkov iz AI (brez zunanjih odvisnosti). */
export function ItineraryMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')

  return (
    <div className="text-sm text-slate-600 leading-relaxed space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trimEnd()
        if (!trimmed) return <div key={i} className="h-1" />

        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={i} className="text-xs font-bold uppercase tracking-wide text-slate-500 mt-2 first:mt-0">
              {trimmed.slice(4)}
            </h4>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h3 key={i} className="text-sm font-semibold text-slate-800 mt-2 first:mt-0">
              {trimmed.slice(3)}
            </h3>
          )
        }
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <p key={i} className="pl-3 text-slate-600 before:content-['•'] before:mr-2 before:text-slate-400">
              {trimmed.slice(2)}
            </p>
          )
        }

        const boldParts = trimmed.split(/\*\*(.+?)\*\*/g)
        if (boldParts.length > 1) {
          return (
            <p key={i}>
              {boldParts.map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j} className="font-semibold text-slate-800">
                    {part}
                  </strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </p>
          )
        }

        return <p key={i}>{trimmed}</p>
      })}
    </div>
  )
}
