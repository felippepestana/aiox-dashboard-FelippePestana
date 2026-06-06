'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Gavel, Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

type Tab = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('login');

  // ── Login form ─────────────────────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // ── Signup form ────────────────────────────────────────────────────────────
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  // ── Shared state ───────────────────────────────────────────────────────────
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function switchTab(next: Tab) {
    setTab(next);
    setError('');
    setSuccess('');
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!loginEmail || !loginPassword) {
      setError('Preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login');
        return;
      }

      router.push('/legal');
      router.refresh();
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!signupName || !signupEmail || !signupPassword || !signupConfirm) {
      setError('Preencha todos os campos');
      return;
    }

    if (signupPassword !== signupConfirm) {
      setError('As senhas não coincidem');
      return;
    }

    if (signupPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          name: signupName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao criar conta');
        return;
      }

      // If the server returned a session (email confirmation disabled) — log in directly
      if (data.user) {
        router.push('/legal');
        router.refresh();
        return;
      }

      // Otherwise inform the user to confirm their email
      setSuccess(data.message || 'Verifique seu email para confirmar o cadastro');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card with amber gradient border */}
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-amber-500/40 via-amber-600/20 to-transparent">
          <div className="rounded-2xl bg-[#0d1320] p-8">

            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20 mb-4">
                <Gavel className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                AIOX <span className="text-amber-400">LEGAL</span>
              </h1>
              <p className="text-sm text-[#6b7a8d] mt-1">
                Plataforma Juridica Full-Service
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-lg bg-[#0a0f1a] border border-[#1a2332] p-1 mb-6">
              <button
                type="button"
                onClick={() => switchTab('login')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  tab === 'login'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
                    : 'text-[#6b7a8d] hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => switchTab('signup')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  tab === 'signup'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm'
                    : 'text-[#6b7a8d] hover:text-white'
                }`}
              >
                Criar Conta
              </button>
            </div>

            {/* Feedback messages */}
            {error && (
              <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-5 flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-400">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* ── Login Form ─────────────────────────────────────────────── */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label htmlFor="login-email" className="block text-sm font-medium text-[#8899aa] mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
                    <input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] pl-10 pr-4 py-3 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-sm font-medium text-[#8899aa] mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
                    <input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Sua senha"
                      required
                      className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] pl-10 pr-4 py-3 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-white hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-amber-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>
            )}

            {/* ── Signup Form ────────────────────────────────────────────── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-5">
                <div>
                  <label htmlFor="signup-name" className="block text-sm font-medium text-[#8899aa] mb-2">
                    Nome
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
                    <input
                      id="signup-name"
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                      className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] pl-10 pr-4 py-3 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-[#8899aa] mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
                    <input
                      id="signup-email"
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] pl-10 pr-4 py-3 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-[#8899aa] mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
                    <input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] pl-10 pr-4 py-3 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-confirm" className="block text-sm font-medium text-[#8899aa] mb-2">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
                    <input
                      id="signup-confirm"
                      type="password"
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      placeholder="Repita a senha"
                      required
                      className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] pl-10 pr-4 py-3 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 text-sm font-semibold text-white hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-amber-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-[#1a2332] text-center">
              <p className="text-xs text-[#4a5568]">
                Plataforma Juridica Full-Service
              </p>
              <p className="text-xs text-[#4a5568] mt-1">
                APEX Legal &copy; {new Date().getFullYear()}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
