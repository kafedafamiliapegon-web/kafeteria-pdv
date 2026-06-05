"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../components/Header";
import { supabase } from "../../../lib/supabase";

export default function Comanda() {
  const { id } = useParams();
  const router = useRouter();

  const [mesa, setMesa] = useState<any>();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [itens, setItens] = useState<any[]>([]);
  const [pagamento, setPagamento] = useState("PIX");

  async function carregar() {
    const { data: mesaData } = await supabase
      .from("tables_open")
      .select("*")
      .eq("id", id)
      .single();

    setMesa(mesaData);

    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true });

    setProdutos(data || []);
  }

  function adicionar(produto: any) {
    if (produto.stock <= 0) {
      alert("Produto sem estoque");
      return;
    }

    const quantidadeNoCarrinho = itens.filter((i) => i.id === produto.id).length;

    if (quantidadeNoCarrinho >= produto.stock) {
      alert("Estoque insuficiente");
      return;
    }

    setItens((atual) => [...atual, produto]);
  }

  function remover(index: number) {
    setItens((atual) => atual.filter((_, i) => i !== index));
  }

  const total = itens.reduce((soma, item) => soma + Number(item.price), 0);

  async function finalizarVenda() {
    if (itens.length === 0) {
      alert("Adicione pelo menos um item");
      return;
    }

    const confirmar = confirm(
      `Finalizar venda de R$ ${total.toFixed(2)} em ${pagamento}?`
    );

    if (!confirmar) return;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        table_id: id,
        status: "closed",
        subtotal: total,
        discount: 0,
        total: total,
      })
      .select()
      .single();

    if (orderError) {
      alert(orderError.message);
      return;
    }

    const itensAgrupados = itens.reduce((acc: any, item: any) => {
      if (!acc[item.id]) {
        acc[item.id] = {
          product_id: item.id,
          qty: 0,
          price: Number(item.price),
          stock: Number(item.stock),
        };
      }

      acc[item.id].qty += 1;

      return acc;
    }, {});

    const orderItems = Object.values(itensAgrupados).map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      qty: item.qty,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      alert(itemsError.message);
      return;
    }

    for (const item of Object.values(itensAgrupados) as any[]) {
      const novoEstoque = item.stock - item.qty;

      const { error: stockError } = await supabase
        .from("products")
        .update({
          stock: novoEstoque,
        })
        .eq("id", item.product_id);

      if (stockError) {
        alert(stockError.message);
        return;
      }
    }

    const { error: saleError } = await supabase.from("sales").insert({
      payment_method: pagamento,
      total: total,
    });

    if (saleError) {
      alert(saleError.message);
      return;
    }

    await supabase
      .from("tables_open")
      .update({
        status: "closed",
      })
      .eq("id", id);

    alert("Venda finalizada com sucesso ☕");

    router.push("/mesas");
  }

  useEffect(() => {
    if (id) carregar();
  }, [id]);

  return (
    <main className="min-h-screen bg-[#07130d] p-8 text-white lg:p-10">
      <Header title={`🧾 ${mesa?.name || "Comanda"}`} />

      <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
        <section>
          <div className="mb-6">
            <h2 className="text-3xl font-bold">Produtos</h2>

            <p className="mt-2 text-green-100/60">
              Clique em um produto para adicionar ao pedido.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {produtos.map((item) => (
              <div
                key={item.id}
                onClick={() => adicionar(item)}
                className="cursor-pointer rounded-3xl bg-[#103520] p-5 transition hover:scale-[1.02]"
              >
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    className="h-48 w-full rounded-2xl object-cover object-center"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-2xl bg-black/10 text-6xl">
                    ☕
                  </div>
                )}

                <h2 className="mt-4 text-2xl font-bold">{item.name}</h2>

                <div className="mt-2 flex items-center justify-between">
                  <p className="text-green-300">
                    R$ {Number(item.price).toFixed(2)}
                  </p>

                  <p className="text-sm text-green-200/70">
                    Estoque: {item.stock}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="sticky top-10 h-fit rounded-3xl bg-[#103520] p-6">
          <h2 className="text-3xl font-bold">🛒 Pedido</h2>

          <div className="mt-6 space-y-3">
            {itens.length === 0 && (
              <p className="rounded-xl bg-black/10 p-4 text-green-100/60">
                Nenhum item adicionado.
              </p>
            )}

            {itens.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-black/10 p-4"
              >
                <div>
                  <strong>{item.name}</strong>
                  <p className="text-sm text-green-100/70">
                    R$ {Number(item.price).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => remover(i)}
                  className="rounded-xl bg-red-500/20 px-3 py-2 text-red-200 hover:bg-red-500/30"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <label className="text-sm text-green-100/70">
              Forma de pagamento
            </label>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {["PIX", "Cartão", "Dinheiro"].map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => setPagamento(tipo)}
                  className={`rounded-xl border py-3 font-bold ${
                    pagamento === tipo
                      ? "border-green-400 bg-green-600"
                      : "border-white/10"
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-between text-3xl font-bold text-green-300">
              <span>Total</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>

            <button
              onClick={finalizarVenda}
              className="mt-6 w-full rounded-2xl bg-green-600 py-5 font-bold hover:bg-green-500"
            >
              Finalizar Venda
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}