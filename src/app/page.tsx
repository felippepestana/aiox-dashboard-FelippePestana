'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gavel,
  Stethoscope,
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
    title: 'Modulo Juridico',
    description: 'Gestao de processos, clientes, prazos, peticoes e financeiro juridico.',
    icon: Gavel,
    href: '/legal',
    gradient: 'from-amber-500 to-amber-700',
    shadow: 'shadow-amber-500/20',
  },
  {
    id: 'dental',
    title: 'Modulo Dental',
    description: 'Gestao de clinica odontologica, pacientes, agendamentos e faturamento.',
    icon: Stethoscope,
    href: '/dental',
    gradient: 'from-cyan-500 to-cyan-700',
    shadow: 'shadow-cyan-500/20',
  },
  {
    id: 'dashboard',
    title: 'Dashboard AIOS',
    description: 'Kanban, squads, agentes, monitoramento e configuracoes do sistema.',
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
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-[#1a2332] bg-[#0d1320]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20">
              <Gavel className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide">
                AIOX <span className="text-amber-400">Platform</span>
              </h1>
              <p className="text-xs text-[#6b7a8d]">
                Bem-vindo, {user.name}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-2 text-sm text-[#8899aa] hover:text-white hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold mb-4 tracking-tight">
            AIOX <span className="text-amber-400">Platform</span>
          </h2>
          <h3 className="text-xl font-semibold mb-3 text-[#8899aa]">
            Selecione um <span className="text-amber-400">Modulo</span>
          </h3>
          <p className="text-[#6b7a8d] max-w-md mx-auto">
            Escolha o modulo desejado para acessar as ferramentas e funcionalidades.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => router.push(mod.href)}
                className="group relative rounded-2xl p-[1px] bg-gradient-to-b from-[#1a2332] to-transparent hover:from-amber-500/40 hover:to-transparent transition-all duration-300 hover:scale-[1.03]"
              >
                <div className="rounded-2xl bg-[#0d1320] p-8 h-full flex flex-col items-start text-left transition-all duration-300 group-hover:bg-[#111827]">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${mod.gradient} shadow-lg ${mod.shadow} mb-5 transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">
                    {mod.title}
                  </h3>
                  <p className="text-sm text-[#6b7a8d] mb-6 flex-1">
                    {mod.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Acessar</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* Version Footer */}
      <footer className="relative text-center py-6">
        <p className="text-xs text-[#4a5568]">v1.0.0</p>
      </footer>
    </div>
  );
}
