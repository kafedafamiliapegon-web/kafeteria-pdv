"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

export default function Historico() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

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

    const soma = lista.reduce(
      (acc, venda) => acc + Number(venda.total),
      0
    );

    setTotal(soma);
  }

  async function apagarVenda(venda: any) {
    const confirmar = confirm(
      `Apagar esta venda?\n\nValor: R$ ${Number(venda.total).toFixed(
        2
      )}\nPagamento: ${venda.payment_method}\n\nEssa ação não apaga produtos cadastrados.`
    );

    if (!confirmar) return;

    const palavra = prompt('Para confirmar, digite exatamente: APAGAR');

    if (palavra !== "APAGAR") {
      alert("Operação cancelada.");
      return;
    }

    const orderId = venda.order_id || venda.orders?.id;

    if (orderId) {
      const { error: itemsError } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", orderId);

      if (itemsError) {
        alert(itemsError.message);
        return;
      }
    }

    const { error: saleError } = await supabase
      .from("sales")
      .delete()
      .eq("id", venda.id);

    if (saleError) {
      alert(saleError.message);
      return;
    }

    if (orderId) {
      const { error: orderError } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (orderError) {
        alert(orderError.message);
        return;
      }
    }

    alert("Venda apagada com sucesso.");

    carregar();
  }

  function dataBR(data: string) {
    return new Date(data).toLocaleString("pt-BR");
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-[#07130d] p-8 text-white lg:p-10">
      <Header title="📈 Histórico" />

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

        {vendas.map((venda, index) => {
          const itens = venda.orders?.order_items || [];

          return (
            <div key={venda.id} className="rounded-3xl bg-[#103520] p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Venda #{index + 1}</h2>

                  <p className="text-green-100/60">
                    {dataBR(venda.created_at)}
                  </p>

                  <div className="mt-5 space-y-2">
                    <h3 className="font-bold text-green-200">
                      Itens do pedido
                    </h3>

                    {itens.length === 0 && (
                      <p className="text-sm text-green-100/50">
                        Itens indisponíveis para vendas antigas.
                      </p>
                    )}

                    {itens.map((item: any) => {
                      const nomeProduto = item.products?.name || "Produto";

                      const subtotal = Number(item.qty) * Number(item.price);

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl bg-black/10 p-3"
                        >
                          <div className="flex justify-between gap-4">
                            <span>
                              {item.qty}x {nomeProduto}
                            </span>

                            <span>
                              R$ {subtotal.toFixed(2)}
                            </span>
                          </div>

                          <p className="text-xs text-green-100/50">
                            Unitário: R$ {Number(item.price).toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <div className="w-fit rounded-full bg-green-500/20 px-4 py-2">
                    {venda.payment_method}
                  </div>

                  <h2 className="text-3xl font-bold">
                    R$ {Number(venda.total).toFixed(2)}
                  </h2>

                  <Link
                    href={`/cupom/${venda.id}`}
                    className="rounded-xl bg-green-600 px-5 py-3 text-center font-bold hover:bg-green-500"
                  >
                    🧾 Ver Cupom
                  </Link>

                  <button
                    onClick={() => apagarVenda(venda)}
                    className="rounded-xl bg-red-600/80 px-5 py-3 text-center font-bold hover:bg-red-500"
                  >
                    🗑️ Apagar Venda
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}