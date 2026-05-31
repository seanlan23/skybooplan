import Link from 'next/link';

export function SupabaseSetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <p className="text-4xl mb-4" aria-hidden>
          ⚙️
        </p>
        <h1 className="text-xl font-bold text-slate-900">Nadzorna plošča ni nastavljena</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          V produkciji manjkata{' '}
          <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> in{' '}
          <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> v
          Vercel okolju. Brez tega prijava in shranjevanje planov ne delujeta.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-sky-600 hover:underline"
        >
          ← Nazaj na iskanje
        </Link>
      </div>
    </div>
  );
}
