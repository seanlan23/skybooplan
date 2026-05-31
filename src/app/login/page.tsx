import Link from 'next/link';
import { AuthForm } from '@/components/auth/AuthForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col">
      <header className="px-6 py-5">
        <Link href="/" className="font-display text-xl font-bold text-slate-900">
          skybooplan
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <AuthForm mode="login" />
      </main>
    </div>
  );
}
