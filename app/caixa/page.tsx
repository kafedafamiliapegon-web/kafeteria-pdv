"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

export default function Caixa() {
  const [caixa, setCaixa] = useState<any>(null);
  const [valorInicial, setValorInicial] = useState("");
  const [vendas, setVendas] = useState<any[]>([]);
  const [historicoCaixas, setHistoricoCaixas] = useState<any[]>([]);

  const [resumo, setResumo] = useState({
    pix: 0,
    cartao: 0,
    dinheiro: 0,
    vendas: 0,
    total: 0,
    totalComInicial: 0,
  });

  function numero(valor: string) {
    return Number(valor.replace(",", "."));
  }

  async function carregarHistoricoCaixas() {
    const { data } = await supabase
      .from("cash_registers")
      .select("*")
      .order("opened_at", { ascending: false })
      .limit(10);

    setHistoricoCaixas(data || []);
  }

  async function carregar() {
    const { data: caixaAberto } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setCaixa(caixaAberto);

    await carregarHistoricoCaixas();

    if (!caixaAberto) {
      setVendas([]);
      setResumo({
        pix: 0,
        cartao: 0,
        dinheiro: 0,
        vendas: 0,
        total: 0,
        totalComInicial: 0,
      });

      return;
    }

    const { data } = await supabase
      .from("sales")
      .select("*")
      .eq("cash_register_id", caixaAberto.id)
      .order("created_at", { ascending: false });

    const lista = data || [];

    setVendas(lista);

    let pix = 0;
    let cartao = 0;
    let dinheiro = 0;

    lista.forEach((venda) => {
      const valor = Number(venda.total || 0);

      if (venda.payment_method === "PIX") pix += valor;
      if (venda.payment_method === "Cartão") cartao += valor;
      if (venda.payment_method === "Dinheiro") dinheiro += valor;
    });

    const total = pix + cartao + dinheiro;
    const inicial = Number(caixaAberto.opening_amount || 0);

    setResumo({
      pix,
      cartao,
      dinheiro,
      vendas: lista.length,
      total,
      totalComInicial: total + inicial,
    });
  }

  async function abrirCaixa() {
    if (!valorInicial.trim()) {
      alert("Digite o valor inicial do caixa");
      return;
    }

    const { error } = await supabase.from("cash_registers").insert({
      opening_amount: numero(valorInicial),
      status: "open",
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Caixa aberto ☕");

    setValorInicial("");
    carregar();
  }

  async function fecharCaixa() {
    if (!caixa) return;

    const confirmar = confirm(
      `Fechar caixa?\n\nVendas: R$ ${resumo.total.toFixed(
        2
      )}\nTotal com valor inicial: R$ ${resumo.totalComInicial.toFixed(2)}`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("cash_registers")
      .update({
        status: "closed",
        closing_amount: resumo.totalComInicial,
        closed_at: new Date().toISOString(),
      })
      .eq("id", caixa.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Caixa fechado com sucesso");

    carregar();
  }

  function dataBR(data: string | null) {
    if (!data) return "—";

    return new Date(data).toLocaleString("pt-BR");
  }

  function dinheiro(valor: any) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-[#07130d] p-8 text-white lg:p-10">
      <Header title="💰 Caixa" backTo="/" backLabel="🏠 Início" />

      <div className="mb-8 flex justify-end">
        <button
          onClick={carregar}
          className="rounded-2xl bg-[#103520] px-6 py-4 font-bold hover:bg-green-700"
        >
          Atualizar
        </button>
      </div>

      {!caixa && (
        <section className="max-w-xl rounded-3xl bg-[#103520] p-8">
          <h2 className="text-3xl font-bold">Abrir caixa</h2>

          <p className="mt-3 text-green-100/60">
            Informe o valor inicial em dinheiro para começar o dia.
          </p>

          <div className="mt-6 space-y-4">
            <input
              value={valorInicial}
              onChange={(e) => setValorInicial(e.target.value)}
              placeholder="Valor inicial. Ex: 100,00"
              className="w-full rounded-2xl bg-black/20 p-4 outline-none"
            />

            <button
              onClick={abrirCaixa}
              className="w-full rounded-2xl bg-green-600 py-4 font-bold hover:bg-green-500"
            >
              Abrir Caixa
            </button>
          </div>
        </section>
      )}

      {caixa && (
        <>
          <section className="mb-10 rounded-3xl bg-green-700 p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-green-100/80">Status</p>

                <h2 className="mt-2 text-4xl font-bold">Caixa Aberto</h2>

                <p className="mt-2 text-green-100/80">
                  Aberto em: {dataBR(caixa.opened_at)}
                </p>
              </div>

              <button
                onClick={fecharCaixa}
                className="rounded-2xl bg-red-600/80 px-8 py-4 font-bold hover:bg-red-500"
              >
                Fechar Caixa
              </button>
            </div>
          </section>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-[#103520] p-8">
              <div className="text-4xl">💵</div>

              <h2 className="mt-5 text-xl">Valor inicial</h2>

              <div className="mt-4 text-4xl font-bold">
                {dinheiro(caixa.opening_amount)}
              </div>
            </div>

            <div className="rounded-3xl bg-[#103520] p-8">
              <div className="text-4xl">🧾</div>

              <h2 className="mt-5 text-xl">Vendas</h2>

              <div className="mt-4 text-4xl font-bold">{resumo.vendas}</div>
            </div>

            <div className="rounded-3xl bg-[#103520] p-8">
              <div className="text-4xl">💰</div>

              <h2 className="mt-5 text-xl">Total vendas</h2>

              <div className="mt-4 text-4xl font-bold">
                {dinheiro(resumo.total)}
              </div>
            </div>

            <div className="rounded-3xl bg-green-700 p-8">
              <div className="text-4xl">✅</div>

              <h2 className="mt-5 text-xl">Total final</h2>

              <div className="mt-4 text-4xl font-bold">
                {dinheiro(resumo.totalComInicial)}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl bg-[#103520] p-8">
              <div className="text-4xl">🟢</div>

              <h2 className="mt-5 text-xl">PIX</h2>

              <div className="mt-4 text-4xl font-bold">
                {dinheiro(resumo.pix)}
              </div>
            </div>

            <div className="rounded-3xl bg-[#103520] p-8">
              <div className="text-4xl">💳</div>

              <h2 className="mt-5 text-xl">Cartão</h2>

              <div className="mt-4 text-4xl font-bold">
                {dinheiro(resumo.cartao)}
              </div>
            </div>

            <div className="rounded-3xl bg-[#103520] p-8">
              <div className="text-4xl">💵</div>

              <h2 className="mt-5 text-xl">Dinheiro</h2>

              <div className="mt-4 text-4xl font-bold">
                {dinheiro(resumo.dinheiro)}
              </div>
            </div>
          </div>

          <section className="mt-10 rounded-3xl bg-[#103520] p-8">
            <h2 className="mb-6 text-3xl font-bold">🧾 Vendas do caixa</h2>

            <div className="space-y-4">
              {vendas.length === 0 && (
                <p className="text-green-100/60">
                  Nenhuma venda neste caixa ainda.
                </p>
              )}

              {vendas.map((venda) => (
                <div
                  key={venda.id}
                  className="flex justify-between border-b border-white/10 pb-4"
                >
                  <div>
                    <strong>{venda.payment_method}</strong>

                    <p className="text-sm text-green-100/60">
                      {dataBR(venda.created_at)}
                    </p>
                  </div>

                  <div className="font-bold">{dinheiro(venda.total)}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="mt-10 rounded-3xl bg-[#103520] p-8">
        <h2 className="mb-6 text-3xl font-bold">📚 Histórico de caixas</h2>

        <div className="space-y-4">
          {historicoCaixas.length === 0 && (
            <p className="text-green-100/60">
              Nenhum caixa registrado ainda.
            </p>
          )}

          {historicoCaixas.map((item) => (
            <div key={item.id} className="rounded-2xl bg-black/10 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <strong>
                    {item.status === "open"
                      ? "🟢 Caixa aberto"
                      : "⚪ Caixa fechado"}
                  </strong>

                  <p className="mt-1 text-sm text-green-100/60">
                    Aberto: {dataBR(item.opened_at)}
                  </p>

                  <p className="text-sm text-green-100/60">
                    Fechado: {dataBR(item.closed_at)}
                  </p>
                </div>

                <div className="text-right">
                  <p>Inicial: {dinheiro(item.opening_amount)}</p>

                  <p className="font-bold">
                    Final:{" "}
                    {item.closing_amount ? dinheiro(item.closing_amount) : "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}