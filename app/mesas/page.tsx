"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function Mesas() {
  const [nome, setNome] = useState("");
  const [mesas, setMesas] = useState<any[]>([]);

  async function carregar() {
    const { data } = await supabase
      .from("tables_open")
      .select("*")
      .order("opened_at", { ascending: false });

    setMesas(data || []);
  }

  async function criar() {
    if (!nome.trim()) {
      alert("Digite um nome");
      return;
    }

    await supabase.from("tables_open").insert({
      name: nome,
    });

    setNome("");
    carregar();
  }

  function hora(data: string) {
    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-[#07130d] p-8 text-white lg:p-10">
      <div className="mb-10">
        <h1 className="text-5xl font-bold">🪑 Mesas</h1>

        <p className="mt-3 text-green-100/60">
          Crie mesas e comandas livremente. Sem limite.
        </p>
      </div>

      <div className="mb-10 flex gap-4">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Mesa 1, João, Externa"
          className="flex-1 rounded-3xl bg-[#103520] p-5 outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") criar();
          }}
        />

        <button
          onClick={criar}
          className="rounded-3xl bg-green-600 px-10 font-bold hover:bg-green-500"
        >
          ＋ Criar
        </button>
      </div>

      {mesas.length === 0 && (
        <div className="rounded-3xl bg-[#103520] p-20 text-center">
          <div className="text-7xl">🪑</div>

          <h2 className="mt-6 text-3xl font-bold">Nenhuma mesa aberta</h2>

          <p className="mt-3 text-green-100/60">
            Crie a primeira mesa ou comanda para começar.
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {mesas.map((mesa) => (
          <div
            key={mesa.id}
            className="rounded-[32px] bg-[#103520] p-7 transition hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="text-6xl">🪑</div>

              <div className="rounded-full bg-green-500/20 px-4 py-2 text-sm font-bold text-green-300">
                🟢 Aberta
              </div>
            </div>

            <h2 className="mt-6 text-3xl font-bold capitalize">
              {mesa.name}
            </h2>

            <div className="mt-6 space-y-2">
              <p className="text-green-100/70">🧾 0 itens</p>

              <p className="text-green-100/70">🕒 {hora(mesa.opened_at)}</p>
            </div>

            <Link
              href={`/comanda/${mesa.id}`}
              className="mt-8 block w-full rounded-2xl border border-green-500/30 py-4 text-center font-bold hover:bg-green-600"
            >
              Abrir Comanda
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}