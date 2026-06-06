"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

function LogoKafeteria() {
  return (
    <img
      src="/logo.png"
      alt="Logo Kafeteria"
      className="h-full w-full object-contain"
    />
  );
}

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email.trim() || !senha.trim()) {
      alert("Digite email e senha");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error) {
      alert("Login inv\u00E1lido: " + error.message);
      return;
    }

    router.push("/");
  }

  return (
    <main className="pdv-page flex min-h-screen items-center justify-center px-4 py-8 text-[#123b24] sm:px-6">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/45 bg-[#fffdf2] shadow-2xl shadow-[#102f1d]/20 lg:grid-cols-[1fr_440px]">
        <div className="relative hidden min-h-[620px] overflow-hidden bg-[linear-gradient(145deg,#062518,#0b5a34_52%,#123b24)] p-10 text-[#fffdf2] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_16%,rgba(247,244,233,0.28),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(184,214,174,0.18),transparent_34%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="h-28 w-28 rounded-[30px] border border-white/18 bg-white/10 p-3 shadow-2xl shadow-black/25">
                <LogoKafeteria />
              </div>

              <div className="mt-10">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#dcebd8]/70">
                  Kafeteria PDV
                </p>

                <h1 className="mt-4 max-w-md text-5xl font-black leading-[0.98]">
                  Sistema de gestao para cafeteria
                </h1>

                <p className="mt-5 max-w-sm text-base font-semibold leading-7 text-[#eef6ec]/68">
                  Acesse o painel para gerenciar vendas, mesas, caixa,
                  produtos, relatorios e cupons em um so lugar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["Vendas", "Caixa", "Produtos"].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/12 bg-white/10 p-4 text-sm font-black"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[linear-gradient(135deg,#fffdf2,#dcebd8)] p-6 sm:p-10">
          <div className="mx-auto flex max-w-md flex-col justify-center">
            <div className="text-center">
              <div className="mx-auto h-28 w-28 rounded-[30px] border border-[#0b5a34]/12 bg-white/80 p-3 shadow-xl shadow-[#264127]/14">
                <LogoKafeteria />
              </div>

              <h2 className="mt-7 text-4xl font-black leading-tight text-[#123b24]">
                Entrar no sistema
              </h2>

              <p className="mt-3 text-sm font-bold text-[#123b24]/60">
                Use seu email e senha para acessar o Kafeteria PDV.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#123b24]/72">
                  Email
                </span>

                <input
                  type="email"
                  placeholder="admin@kafeteria.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-[#0b5a34]/14 bg-white/85 px-5 py-4 font-bold text-[#123b24] outline-none transition placeholder:text-[#123b24]/34 focus:border-[#0b7d42]/50 focus:ring-4 focus:ring-[#0b7d42]/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-[#123b24]/72">
                  Senha
                </span>

                <input
                  type="password"
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-2xl border border-[#0b5a34]/14 bg-white/85 px-5 py-4 font-bold text-[#123b24] outline-none transition placeholder:text-[#123b24]/34 focus:border-[#0b7d42]/50 focus:ring-4 focus:ring-[#0b7d42]/10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") entrar();
                  }}
                />
              </label>

              <button
                onClick={entrar}
                disabled={carregando}
                className="w-full rounded-2xl bg-[linear-gradient(135deg,#0b7d42,#0b5a34)] py-4 text-base font-black text-[#fffdf2] shadow-xl shadow-[#0b5a34]/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {carregando ? "Entrando..." : "Entrar"}
              </button>
            </div>

            <div className="mt-6 rounded-2xl border border-[#0b5a34]/10 bg-white/55 px-5 py-4 text-center text-xs font-bold text-[#123b24]/58">
              Ambiente seguro para uso interno da cafeteria.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
