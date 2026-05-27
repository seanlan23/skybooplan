const SEARCH_TIMEOUT_MS = 14_000

interface SerperOrganic {
  title?: string
  snippet?: string
  link?: string
}

/** Spletno iskanje za prevozne vozne rede, cene in aplikacije */
export async function searchWeb(query: string): Promise<string> {
  const trimmed = query.trim()
  if (!trimmed) return 'Prazen iskalni niz.'

  if (process.env.SERPER_API_KEY) {
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: trimmed,
          num: 8,
          gl: process.env.SERPER_GL ?? 'us',
          hl: 'en',
        }),
        signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
      })

      if (res.ok) {
        const data = (await res.json()) as { organic?: SerperOrganic[] }
        const lines = (data.organic ?? [])
          .slice(0, 8)
          .map(
            (r, i) =>
              `${i + 1}. ${r.title ?? '—'}\n   ${r.snippet ?? ''}\n   ${r.link ?? ''}`
          )
        if (lines.length) return lines.join('\n\n')
      }
    } catch {
      // nadaljuj na rezervo
    }
  }

  try {
    const res = await fetch(`https://s.jina.ai/${encodeURIComponent(trimmed)}`, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    })
    if (res.ok) {
      const text = await res.text()
      if (text.trim()) return text.trim().slice(0, 12_000)
    }
  } catch {
    // spodaj fallback
  }

  return [
    'Spletno iskanje ni uspelo.',
    'Svetuj uporabniku, naj preveri 12Go.asia, Baolau, uradno stran železnice ali Google Maps Transit.',
    `Iskalni niz: ${trimmed}`,
  ].join('\n')
}
