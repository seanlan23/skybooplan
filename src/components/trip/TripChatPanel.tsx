'use client';

import { useCallback, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import type { Itinerary } from '@/lib/types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function TripChatPanel({ itinerary }: { itinerary: Itinerary }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Pozdravljen! Sem tvoj asistent za pot **${itinerary.destination}**. Vprašaj me o prevozu, aktivnostih ali prilagoditvah plana.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text };
    const assistantId = uid();
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/transport-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages.filter((m) => m.id !== 'welcome'), userMsg].map(({ role, content }) => ({
            role,
            content,
          })),
          tripContext: {
            currentOrigin: itinerary.flights[0]?.from ?? '—',
            currentDestination: itinerary.destination,
            checkInDate: itinerary.startDate,
            checkOutDate: itinerary.endDate,
            passengerCount: 1,
            searchMode: 'ai_planner' as const,
            itineraryLocations: itinerary.days
              .map((d) => d.title || d.places[0]?.name)
              .filter(Boolean),
          },
        }),
      });

      if (!res.ok || !res.body) throw new Error('Strežnik ni odgovoril');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(line.slice(6)) as { text?: string; error?: string };
            if (json.error) throw new Error(json.error);
            if (json.text) {
              accumulated += json.text;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m))
              );
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      if (!accumulated.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'Oprostite, nisem prejel odgovora.' }
              : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Napaka pri povezavi. Poskusi znova.' }
            : m
        )
      );
    } finally {
      setLoading(false);
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [input, loading, itinerary, messages]);

  return (
    <div className="flex h-full min-h-[320px] flex-col">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'ml-auto bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Pišem…
          </div>
        )}
      </div>
      <form
        className="mt-4 flex gap-2 border-t border-slate-100 pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Vprašaj o poti…"
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
