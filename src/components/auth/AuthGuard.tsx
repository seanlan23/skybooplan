'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/integrations/supabase/client';
import { isSupabaseConfigured } from '@/integrations/supabase/config';
import { SupabaseSetupNotice } from '@/components/auth/SupabaseSetupNotice';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;

    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (!data.user) {
        router.replace('/login');
        return;
      }
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (!session?.user) {
        router.replace('/login');
        return;
      }
      setUser(session.user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [router, configured]);

  if (!configured) {
    return <SupabaseSetupNotice />;
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Nalaganje…
      </div>
    );
  }

  return <>{children}</>;
}
