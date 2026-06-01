'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gavel,
  LayoutDashboard,
  LogOut,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

const MODULES = [
  {
    id: 'legal',
    title: 'Plataforma Jurídica',
    description: 'Processos, clientes, prazos, petições, IA jurídica, financeiro e estratégia.',
    icon: Gavel,
    href: '/legal',
    gradient: 'from-amber-500 to-amber-700',
    shadow: 'shadow-amber-500/20',
  },
  {
    id: 'dashboard',
    title: 'Ferramentas do Sistema',
    description: 'Squads, agentes, monitoramento e configurações da plataforma.',
    icon: LayoutDashboard,
    href: '/kanban',
    gradient: 'from-violet-500 to-violet-700',
    shadow: 'shadow-violet-500/20',
  },
];

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <header className="relative border-b border-[#1a2332] bg-[#0d1320]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20">
              <Gavel className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">AIOX <span className="text-amber-400">LEGAL</span></h1>
              <p className="text-[10px] text-amber-400/60 tracking-widest">ADVOCACIA INTELIGENTE</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#6b7a8d]">{user.name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 rounded-lg border border-[#1a2332] px-3 py-1.5 text-xs text-[#6b7a8d] hover:text-red-400 hover:border-red-500/20 transition-colors">
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Bem-vindo, <span className="text-amber-400">{user.name}</span></h2>
          <p className="text-[#6b7a8d] mt-2">Selecione o módulo para começar</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => router.push(mod.href)}
                className={`group relative rounded-2xl border border-[#1a2332] bg-[#0d1320] p-8 text-left hover:border-amber-500/30 transition-all duration-300 ${mod.shadow}`}
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${mod.gradient} shadow-lg mb-4`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{mod.title}</h3>
                <p className="text-sm text-[#6b7a8d] mb-4">{mod.description}</p>
                <span className="flex items-center gap-1 text-sm text-amber-400 group-hover:gap-2 transition-all">
                  Acessar <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
