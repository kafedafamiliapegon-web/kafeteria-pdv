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

  const cardsResumo = [
    {
      icon: "\uD83D\uDCB0",
      title: "Vendas",
      value: `R$ ${dados.vendas.toFixed(2)}`,
    },
    {
      icon: "\uD83E\uDE91",
      title: "Mesas",
      value: dados.mesas,
    },
    {
      icon: "\uD83D\uDCE6",
      title: "Produtos",
      value: dados.produtos,
    },
    {
      icon: "\uD83D\uDCC8",
      title: "Ticket",
      value: `R$ ${dados.ticket.toFixed(2)}`,
    },
  ];

  const acoes = [
    {
      icon: "\uD83E\uDE91",
      label: "Mesas",
      href: "/mesas",
      featured: false,
    },
    {
      icon: "\u26A1",
      label: "Venda R\u00E1pida",
      href: "/venda-rapida",
      featured: true,
    },
    {
      icon: "\uD83D\uDCE6",
      label: "Produtos",
      href: "/produtos",
      featured: false,
    },
    {
      icon: "\uD83D\uDCC8",
      label: "Hist\u00F3rico",
      href: "/historico",
      featured: false,
    },
    {
      icon: "\uD83D\uDCB0",
      label: "Caixa",
      href: "/caixa",
      featured: false,
    },
    {
      icon: "\uD83D\uDCCA",
      label: "Relat\u00F3rios",
      href: "/relatorios",
      featured: false,
    },
    {
      icon: "\u2699\uFE0F",
      label: "Config.",
      href: "/configuracoes",
      featured: false,
    },
  ];

  return (
    <main className="min-h-screen bg-[#03140f] px-4 py-5 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:gap-7">
        <section className="rounded-[2rem] border border-emerald-300/10 bg-[radial-gradient(circle_at_top_left,_rgba(12,111,64,0.34),_transparent_35%),linear-gradient(135deg,_rgba(9,70,42,0.9),_rgba(3,20,15,0.96))] p-6 shadow-2xl shadow-black/30 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-emerald-300/20 bg-[#0f3a25] text-4xl shadow-lg shadow-black/25 sm:h-20 sm:w-20 sm:text-5xl">
                {"\u2615"}
              </div>

              <div>
                <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                  Kafeteria
                </h1>

                <p className="mt-2 text-sm font-medium text-emerald-100/65 sm:text-base">
                  Painel principal da Kafeteria
                </p>
              </div>
            </div>

            <button
              onClick={sair}
              className="w-full rounded-2xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/35 transition hover:-translate-y-0.5 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300/70 sm:w-auto"
            >
              Sair
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cardsResumo.map((card) => (
            <div
              key={card.title}
              className="min-h-44 rounded-[1.75rem] border border-emerald-200/10 bg-[#0f3a25] p-6 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-emerald-300/20 hover:bg-[#114329] sm:p-7"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-300/10 text-4xl ring-1 ring-emerald-200/10">
                {card.icon}
              </div>

              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100/55">
                {card.title}
              </h2>

              <div className="mt-3 text-4xl font-black leading-none text-white">
                {card.value}
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-[2rem] border border-emerald-200/10 bg-[#062118] p-4 shadow-2xl shadow-black/25 sm:p-6 lg:p-8">
          <div className="grid gap-4 lg:grid-cols-2">
            {acoes.map((acao) => (
              <Link
                key={acao.href}
                href={acao.href}
                className={`group flex min-h-28 items-center gap-5 rounded-[1.75rem] border p-6 text-3xl font-black shadow-lg shadow-black/20 transition hover:-translate-y-1 sm:min-h-32 sm:p-8 ${
                  acao.featured
                    ? "border-emerald-300/25 bg-[#06a63c] text-white hover:bg-[#10b94a]"
                    : "border-emerald-200/10 bg-[#0f3a25] text-white hover:border-emerald-300/25 hover:bg-[#13462d]"
                }`}
              >
                <span
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-4xl transition group-hover:scale-105 ${
                    acao.featured
                      ? "bg-white/15 shadow-inner"
                      : "bg-emerald-300/10 ring-1 ring-emerald-200/10"
                  }`}
                >
                  {acao.icon}
                </span>

                <span>{acao.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-emerald-200/10 bg-[#0b2f21] p-6 shadow-xl shadow-black/20">
            <h2 className="text-2xl font-black text-white">
              {"\uD83E\uDDFE"} {"\u00DAltimas vendas"}
            </h2>

            <div className="mt-6 space-y-4">
              {ultimas.length === 0 && (
                <p className="text-emerald-100/60">Nenhuma venda ainda.</p>
              )}

              {ultimas.map((venda) => (
                <div
                  key={venda.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-950/35 px-4 py-3 text-sm text-emerald-50"
                >
                  <div>{venda.payment_method}</div>

                  <div className="font-bold">
                    R$ {Number(venda.total).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-200/10 bg-[#0b2f21] p-6 shadow-xl shadow-black/20">
            <h2 className="text-2xl font-black text-white">
              {"\u26A0\uFE0F"} Estoque baixo
            </h2>

            <div className="mt-6 space-y-4">
              {baixo.length ? (
                baixo.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-4 rounded-2xl bg-emerald-950/35 px-4 py-3 text-sm text-emerald-50"
                  >
                    <div>{p.name}</div>

                    <div className="font-bold">{p.stock}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-emerald-950/35 px-4 py-3 text-emerald-100/70">
                  Tudo OK {"\u2615"}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
