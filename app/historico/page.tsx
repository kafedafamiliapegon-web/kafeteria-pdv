"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function Historico() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  async function carregar() {
    const { data } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    const lista = data || [];

    setVendas(lista);

    const soma = lista.reduce(
      (acc, venda) => acc + Number(venda.total),
      0
    );

    setTotal(soma);
  }

  function dataBR(data: string) {
    return new Date(data).toLocaleString("pt-BR");
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-[#07130d] p-8 text-white">
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-bold">📈 Histórico</h1>

          <p className="mt-3 text-green-100/60">
            Todas as vendas realizadas.
          </p>
        </div>

        <Link
          href="/"
          className="rounded-2xl bg-[#103520] px-6 py-4 font-bold hover:bg-green-700"
        >
          ← Voltar
        </Link>
      </div>

      <div className="mb-10 grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl bg-[#103520] p-6">
          <p className="text-green-100/70">Total Vendido</p>

          <h2 className="mt-4 text-4xl font-bold">
            R$ {total.toFixed(2)}
          </h2>
        </div>

        <div className="rounded-3xl bg-[#103520] p-6">
          <p className="text-green-100/70">Quantidade</p>

          <h2 className="mt-4 text-4xl font-bold">{vendas.length}</h2>
        </div>

        <div className="rounded-3xl bg-[#103520] p-6">
          <p className="text-green-100/70">Ticket Médio</p>

          <h2 className="mt-4 text-4xl font-bold">
            R$ {vendas.length ? (total / vendas.length).toFixed(2) : "0.00"}
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {vendas.length === 0 && (
          <div className="rounded-3xl bg-[#103520] p-10 text-center text-green-100/60">
            Nenhuma venda registrada ainda.
          </div>
        )}

        {vendas.map((venda, index) => (
          <div key={venda.id} className="rounded-3xl bg-[#103520] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Venda #{index + 1}</h2>

                <p className="text-green-100/60">
                  {dataBR(venda.created_at)}
                </p>
              </div>

              <div className="text-right">
                <div className="rounded-full bg-green-500/20 px-4 py-2">
                  {venda.payment_method}
                </div>

                <h2 className="mt-3 text-3xl font-bold">
                  R$ {Number(venda.total).toFixed(2)}
                </h2>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}