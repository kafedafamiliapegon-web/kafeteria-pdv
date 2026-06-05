"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const router = useRouter();

  const [dados, setDados] = useState({
    vendas: 0,
    mesas: 0,
    produtos: 0,
    ticket: 0,
  });

  const [ultimas, setUltimas] = useState<any[]>([]);
  const [baixo, setBaixo] = useState<any[]>([]);

  async function sair() {
    const confirmar = confirm("Deseja sair do sistema?");

    if (!confirmar) return;

    await supabase.auth.signOut();

    router.push("/login");
  }

  async function carregar() {
    const [sales, tables, products] = await Promise.all([
      supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase.from("tables_open").select("*").eq("status", "open"),

      supabase.from("products").select("*").eq("active", true),
    ]);

    const vendas = sales.data || [];
    const produtos = products.data || [];

    const total = vendas.reduce((a, b) => a + Number(b.total), 0);

    setDados({
      vendas: total,
      mesas: tables.data?.length || 0,
      produtos: produtos.length,
      ticket: vendas.length ? total / vendas.length : 0,
    });

    setUltimas(vendas);

    setBaixo(
      produtos.filter(
        (p) => Number(p.stock) <= Number(p.minimum_stock || 0)
      )
    );
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-[#07130d] p-8 text-white">
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-6xl font-bold">☕ Kafeteria</h1>

          <p className="mt-3 text-green-100/60">Painel principal da Kafeteria</p>
        </div>

        <button
          onClick={sair}
          className="rounded-2xl bg-red-600/80 px-6 py-4 font-bold hover:bg-red-500"
        >
          Sair
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["💰", "Vendas", `R$ ${dados.vendas.toFixed(2)}`],
          ["🪑", "Mesas", dados.mesas],
          ["📦", "Produtos", dados.produtos],
          ["📈", "Ticket", `R$ ${dados.ticket.toFixed(2)}`],
        ].map((card) => (
          <div key={String(card[1])} className="rounded-3xl bg-[#103520] p-8">
            <div className="text-5xl">{card[0]}</div>

            <h2 className="mt-5 text-xl">{card[1]}</h2>

            <div className="mt-4 text-4xl font-bold">{card[2]}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-7">
        <Link
          href="/mesas"
          className="rounded-3xl bg-[#103520] p-8 text-3xl font-bold hover:bg-green-700"
        >
          🪑 Mesas
        </Link>

        <Link
          href="/venda-rapida"
          className="rounded-3xl bg-green-700 p-8 text-3xl font-bold hover:bg-green-600"
        >
          ⚡ Venda Rápida
        </Link>

        <Link
          href="/produtos"
          className="rounded-3xl bg-[#103520] p-8 text-3xl font-bold hover:bg-green-700"
        >
          📦 Produtos
        </Link>

        <Link
          href="/historico"
          className="rounded-3xl bg-[#103520] p-8 text-3xl font-bold hover:bg-green-700"
        >
          📈 Histórico
        </Link>

        <Link
          href="/caixa"
          className="rounded-3xl bg-[#103520] p-8 text-3xl font-bold hover:bg-green-700"
        >
          💰 Caixa
        </Link>

        <Link
          href="/relatorios"
          className="rounded-3xl bg-[#103520] p-8 text-3xl font-bold hover:bg-green-700"
        >
          📊 Relatórios
        </Link>

        <Link
          href="/configuracoes"
          className="rounded-3xl bg-[#103520] p-8 text-3xl font-bold hover:bg-green-700"
        >
          ⚙️ Config.
        </Link>
      </div>

      <div className="mt-10 grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl bg-[#103520] p-8">
          <h2 className="mb-6 text-3xl font-bold">🧾 Últimas vendas</h2>

          <div className="space-y-4">
            {ultimas.length === 0 && (
              <p className="text-green-100/60">Nenhuma venda ainda.</p>
            )}

            {ultimas.map((venda) => (
              <div key={venda.id} className="flex justify-between">
                <div>{venda.payment_method}</div>

                <div>R$ {Number(venda.total).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-[#103520] p-8">
          <h2 className="mb-6 text-3xl font-bold">⚠️ Estoque baixo</h2>

          <div className="space-y-4">
            {baixo.length ? (
              baixo.map((p) => (
                <div key={p.id} className="flex justify-between">
                  <div>{p.name}</div>

                  <div>{p.stock}</div>
                </div>
              ))
            ) : (
              <div>Tudo OK ☕</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}