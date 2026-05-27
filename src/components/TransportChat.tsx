'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bus, Send, X, Loader2 } from 'lucide-react'
import { buildTransportTripContextFromSearch } from '@/lib/transportTripContext'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSearchStore } from '@/store/useSearchStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Živjo! Sem tvoj **globalni prevozni asistent** skybooplan. Pomagam pri relacijah, letališčih, vlakih, avtobusih, trajektih in lokalnem prevozu **kjerkoli na svetu** — z ocenami cen in časov za 2026.',
}

const QUICK_PROMPTS = [
  'Kako pridem iz letališča v center?',
  'Primerjava: vlak vs. avtobus',
  'Lokalni prevoz in vozovnice',
]

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const FAB_ARC_LABEL = 'TRAJEKTI • TAXI • PREVOZI • RENT-A-CAR'

/** Polkrožni napis nad FAB — ne zajema klikov (pointer-events: none) */
function TransportFabArcLabel() {
  /** Središče loka (cx, cy) in polmer r — lok enakomerno nad zgornjim robom gumba (64px) */
  const arcCx = 118
  const arcCy = 72
  const arcR = 94
  const arcStartX = arcCx - arcR
  const arcEndX = arcCx + arcR
  const arcPathD = `M ${arcStartX} ${arcCy} A ${arcR} ${arcR} 0 0 1 ${arcEndX} ${arcCy}`

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-[236px] max-w-[min(236px,calc(100vw-4rem))] h-[76px] pointer-events-none select-none z-0"
      aria-hidden
    >
      <svg
        viewBox="0 0 236 76"
        className="w-full h-full overflow-visible text-sky-600 drop-shadow-sm"
        role="img"
        aria-label={FAB_ARC_LABEL}
      >
        <defs>
          <path
            id="transport-fab-arc"
            d={arcPathD}
            fill="none"
          />
        </defs>
        <text
          fill="currentColor"
          className="text-[7px] sm:text-[7.5px] font-bold uppercase"
          style={{ letterSpacing: '0.1em', textAnchor: 'middle' }}
        >
          <textPath href="#transport-fab-arc" startOffset="50%" textAnchor="middle">
            {FAB_ARC_LABEL}
          </textPath>
        </text>
      </svg>
    </div>
  )
}

function renderMarkdownLite(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|###[^\n]+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-800">
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('###')) {
      return (
        <span key={i} className="block font-semibold text-sky-700 mt-2 mb-0.5 text-xs uppercase tracking-wide">
          {part.replace(/^###\s*/, '')}
        </span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function TransportChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)
  const { itinerary, activeLocation } = usePlannerStore()
  const {
    searchMode,
    origins,
    destination,
    hotelDestination,
    departureDate,
    returnDate,
    adults,
    children,
  } = useSearchStore()

  const tripContext = buildTransportTripContextFromSearch({
    searchMode,
    origins,
    destination,
    hotelDestination,
    departureDate,
    returnDate,
    adults,
    children,
    selectedFlight,
    activeLocation,
    itineraryLocations: itinerary.length
      ? Array.from(new Set(itinerary.map((d) => d.location)))
      : undefined,
  })

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open, isLoading])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const userMsg: ChatMessage = { id: uid(), role: 'user', content: trimmed }
      const assistantId = uid()
      const historyForApi = [...messages.filter((m) => m.id !== 'welcome'), userMsg]

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'welcome'),
        userMsg,
        { id: assistantId, role: 'assistant', content: '' },
      ])
      setInput('')
      setIsLoading(true)

      try {
        const res = await fetch('/api/transport-agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: historyForApi.map(({ role, content }) => ({ role, content })),
            tripContext,
          }),
        })

        if (!res.ok || !res.body) {
          throw new Error('Strežnik ni odgovoril')
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue
            try {
              const json = JSON.parse(line.slice(6)) as {
                text?: string
                error?: string
                done?: boolean
              }
              if (json.error) throw new Error(json.error)
              if (json.text) {
                accumulated += json.text
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: accumulated } : m
                  )
                )
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue
              throw e
            }
          }
        }

        if (!accumulated.trim()) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: 'Oprostite, nisem prejel odgovora. Poskusite znova.',
                  }
                : m
            )
          )
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    'Napaka pri povezavi s prevoznim asistentom. Preverite OPENAI_API_KEY ali poskusite kasneje.',
                }
              : m
          )
        )
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, messages, tripContext]
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col items-end gap-3',
        'bottom-[30px] right-[30px]',
        'pb-[max(0px,env(safe-area-inset-bottom))]',
        'pr-[max(0px,env(safe-area-inset-right))]'
      )}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'w-[min(100vw-48px,340px)] h-[min(72dvh,480px)]',
              'flex flex-col overflow-hidden',
              'bg-white rounded-2xl border border-slate-200/90',
              'shadow-[0_12px_48px_-12px_rgba(14,165,233,0.35)]'
            )}
          >
            <header className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-white">
              {/* BACKUP: bg-sky-500 */}
              <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center shadow-sm">
                <Bus className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-sm text-slate-900 leading-tight">
                  Prevozni asistent
                </h3>
                <p className="text-[10px] text-slate-500 truncate">
                  Globalno · vlaki · letališča · lokalno
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Zapri klepet"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-3 py-3 space-y-3"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[92%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap',
                      msg.role === 'user'
                        ? /* BACKUP: 'bg-sky-500 text-white rounded-br-md' */ 'bg-sky-600 text-white rounded-br-md'
                        : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-bl-md'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      msg.content ? (
                        renderMarkdownLite(msg.content)
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-slate-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Iščem in pišem…
                        </span>
                      )
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
            </div>

            {messages.length <= 1 && !isLoading && (
              <div className="shrink-0 px-3 pb-2 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="text-[10px] px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="shrink-0 p-3 border-t border-slate-100 bg-white flex gap-2 items-end"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                rows={1}
                placeholder="Kako pridem iz A v B?"
                disabled={isLoading}
                className="flex-1 resize-none max-h-24 px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={cn(
                  'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                  input.trim() && !isLoading
                    ? /* BACKUP: 'bg-sky-500 text-white hover:bg-sky-600 shadow-sm' */ 'bg-sky-600 text-white hover:bg-sky-700 shadow-sm'
                    : 'bg-slate-100 text-slate-400'
                )}
                aria-label="Pošlji"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-col items-center shrink-0">
        {!open && <TransportFabArcLabel />}
        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          className={cn(
            'relative z-10 w-16 h-16 rounded-full flex items-center justify-center',
            /* BACKUP: 'bg-gradient-to-br from-sky-500 to-sky-600 text-white' */
            'bg-gradient-to-br from-sky-600 to-sky-700 text-white hover:from-sky-700 hover:to-sky-800',
            'border-[3px] border-white ring-2 ring-sky-100/90',
            'transition-transform duration-200',
            !open && 'transport-fab-pulse',
            open && 'shadow-[0_10px_32px_-8px_rgba(14,165,233,0.6)] ring-sky-300'
          )}
          aria-label={open ? 'Zapri prevozni klepet' : 'Odpri prevozni klepet — rent a car in prevoz'}
          aria-expanded={open}
        >
          {open ? (
            <X className="w-7 h-7" strokeWidth={2.25} />
          ) : (
            <Bus className="w-7 h-7" strokeWidth={2.25} />
          )}
        </motion.button>
      </div>
    </div>
  )
}
