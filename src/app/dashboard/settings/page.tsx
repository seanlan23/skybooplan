'use client';

import { getSupabaseBrowserClient } from '@/integrations/supabase/client';

export default function DashboardSettingsPage() {
  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Nastavitve</h1>
      <p className="text-slate-500 mt-2 text-sm">Upravljanje računa</p>
      <button
        type="button"
        onClick={handleLogout}
        className="mt-8 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Odjava
      </button>
    </div>
  );
}
