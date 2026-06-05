"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

export default function Relatorios() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pix, setPix] = useState(0);
  const [cartao, setCartao] = useState(0);
  const [dinheiro, setDinheiro] = useState(0);
  const [produtos, setProdutos] = useState<any[]>([]);

  async function carregar() {
    const { data } = await supabase
      .from("sales")
      .select(
        `
        *,
        orders (
          id,
          order_items (
            id,
            qty,
            price,
            products (
              name
            )
          )
        )
      `
      )
      .order("created_at", {
        ascending: false,
      });

    const lista = data || [];

    setVendas(lista);

    let somaTotal = 0;
    let somaPix = 0;
    let somaCartao = 0;
    let somaDinheiro = 0;

    const mapaProdutos: any = {};

    lista.forEach((venda) => {
      const valor = Number(venda.total || 0);

      somaTotal += valor;

      if (venda.payment_method === "PIX") somaPix += valor;
      if (venda.payment_method === "Cartão") somaCartao += valor;
      if (venda.payment_method === "Dinheiro") somaDinheiro += valor;

      const itens = venda.orders?.order_items || [];

      itens.forEach((item: any) => {
        const nome = item.products?.name || "Produto";
        const quantidade = Number(item.qty || 0);
        const subtotal = quantidade * Number(item.price || 0);

        if (!mapaProdutos[nome]) {
          mapaProdutos[nome] = {
            nome,
            quantidade: 0,
            total: 0,
          };
        }

        mapaProdutos[nome].quantidade += quantidade;
        mapaProdutos[nome].total += subtotal;
      });
    });

    setTotal(somaTotal);
    setPix(somaPix);
    setCartao(somaCartao);
    setDinheiro(somaDinheiro);

    setProdutos(
      Object.values(mapaProdutos).sort(
        (a: any, b: any) => b.quantidade - a.quantidade
      )
    );
  }

  useEffect(() => {
    carregar();
  }, []);

  const ticketMedio = vendas.length ? total / vendas.length : 0;

  return (
    <main className="min-h-screen bg-[#07130d] p-8 text-white lg:p-10">
      <Header title="📊 Relatórios" />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-[#103520] p-8">
          <div className="text-4xl">💰</div>
          <p className="mt-5 text-green-100/70">Total vendido</p>
          <h2 className="mt-3 text-4xl font-bold">
            R$ {total.toFixed(2)}
          </h2>
        </div>

        <div className="rounded-3xl bg-[#103520] p-8">
          <div className="text-4xl">🧾</div>
          <p className="mt-5 text-green-100/70">Vendas</p>
          <h2 className="mt-3 text-4xl font-bold">{vendas.length}</h2>
        </div>

        <div className="rounded-3xl bg-[#103520] p-8">
          <div className="text-4xl">📈</div>
          <p className="mt-5 text-green-100/70">Ticket médio</p>
          <h2 className="mt-3 text-4xl font-bold">
            R$ {ticketMedio.toFixed(2)}
          </h2>
        </div>

        <div className="rounded-3xl bg-green-700 p-8">
          <div className="text-4xl">☕</div>
          <p className="mt-5 text-green-100/70">Mais vendido</p>
          <h2 className="mt-3 text-3xl font-bold">
            {produtos[0]?.nome || "Nenhum"}
          </h2>
        </div>
      </div>

      <div className="mt-10 grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl bg-[#103520] p-8">
          <h2 className="mb-6 text-3xl font-bold">💳 Pagamentos</h2>

          <div className="space-y-4">
            <div className="flex justify-between rounded-2xl bg-black/10 p-5">
              <span>PIX</span>
              <strong>R$ {pix.toFixed(2)}</strong>
            </div>

            <div className="flex justify-between rounded-2xl bg-black/10 p-5">
              <span>Cartão</span>
              <strong>R$ {cartao.toFixed(2)}</strong>
            </div>

            <div className="flex justify-between rounded-2xl bg-black/10 p-5">
              <span>Dinheiro</span>
              <strong>R$ {dinheiro.toFixed(2)}</strong>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-[#103520] p-8">
          <h2 className="mb-6 text-3xl font-bold">🏆 Produtos mais vendidos</h2>

          <div className="space-y-4">
            {produtos.length === 0 && (
              <p className="text-green-100/60">
                Nenhum produto vendido ainda.
              </p>
            )}

            {produtos.map((produto, index) => (
              <div
                key={produto.nome}
                className="flex items-center justify-between rounded-2xl bg-black/10 p-5"
              >
                <div>
                  <strong>
                    #{index + 1} {produto.nome}
                  </strong>

                  <p className="text-sm text-green-100/60">
                    {produto.quantidade} unidade(s)
                  </p>
                </div>

                <strong>R$ {produto.total.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}