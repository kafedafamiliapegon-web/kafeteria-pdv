"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

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
      alert("Login inválido: " + error.message);
      return;
    }

    router.push("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#07130d] p-6 text-white">
      <section className="w-full max-w-md rounded-[32px] bg-[#103520] p-8 shadow-2xl">
        <div className="text-center">
          <div className="text-6xl">☕</div>

          <h1 className="mt-4 text-4xl font-bold">Kafeteria PDV</h1>

          <p className="mt-2 text-green-100/60">
            Entre para acessar o sistema
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl bg-black/20 p-4 outline-none"
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-2xl bg-black/20 p-4 outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") entrar();
            }}
          />

          <button
            onClick={entrar}
            disabled={carregando}
            className="w-full rounded-2xl bg-green-600 py-4 font-bold hover:bg-green-500 disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </section>
    </main>
  );
}