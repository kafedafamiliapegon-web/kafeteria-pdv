"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

type ItemCarrinho = {
  produto: any;
  qty: number;
};

const categorias = ["Todos", "Cafés", "Bebidas", "Salgados", "Doces", "Outros"];

export default function VendaRapida() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<any[]>([]);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [pagamento, setPagamento] = useState("PIX");
  const [busca, setBusca] = useState("");
  const [categoriaAtual, setCategoriaAtual] = useState("Todos");

  async function carregar() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("name", { ascending: true });

    setProdutos(data || []);
  }

  const produtosFiltrados = produtos.filter((produto) => {
    const combinaBusca = produto.name
      .toLowerCase()
      .includes(busca.toLowerCase());

    const combinaCategoria =
      categoriaAtual === "Todos" ||
      (produto.category || "Outros") === categoriaAtual;

    return combinaBusca && combinaCategoria;
  });

  function adicionar(produto: any) {
    if (produto.stock <= 0) {
      alert("Produto sem estoque");
      return;
    }

    setItens((atual) => {
      const existente = atual.find((item) => item.produto.id === produto.id);

      if (existente) {
        if (existente.qty >= produto.stock) {
          alert("Estoque insuficiente");
          return atual;
        }

        return atual.map((item) =>
          item.produto.id === produto.id
            ? {
                ...item,
                qty: item.qty + 1,
              }
            : item
        );
      }

      return [
        ...atual,
        {
          produto,
          qty: 1,
        },
      ];
    });
  }

  function diminuir(produtoId: string) {
    setItens((atual) =>
      atual
        .map((item) =>
          item.produto.id === produtoId
            ? {
                ...item,
                qty: item.qty - 1,
              }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  }

  function remover(produtoId: string) {
    setItens((atual) => atual.filter((item) => item.produto.id !== produtoId));
  }

  const total = itens.reduce(
    (soma, item) => soma + Number(item.produto.price) * item.qty,
    0
  );

  async function verificarCaixaAberto() {
    const { data } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return data;
  }

  async function finalizarVenda() {
    if (itens.length === 0) {
      alert("Adicione pelo menos um item");
      return;
    }

    const caixaAberto = await verificarCaixaAberto();

    if (!caixaAberto) {
      alert("O caixa está fechado. Abra o caixa antes de finalizar vendas.");
      router.push("/caixa");
      return;
    }

    const confirmar = confirm(
      `Finalizar venda rápida de R$ ${total.toFixed(2)} em ${pagamento}?`
    );

    if (!confirmar) return;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        table_id: null,
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

    const orderItems = itens.map((item) => ({
      order_id: order.id,
      product_id: item.produto.id,
      qty: item.qty,
      price: Number(item.produto.price),
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      alert(itemsError.message);
      return;
    }

    for (const item of itens) {
      const novoEstoque = Number(item.produto.stock) - item.qty;

      const { error: stockError } = await supabase
        .from("products")
        .update({
          stock: novoEstoque,
        })
        .eq("id", item.produto.id);

      if (stockError) {
        alert(stockError.message);
        return;
      }
    }

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        payment_method: pagamento,
        total: total,
        order_id: order.id,
        cash_register_id: caixaAberto.id,
      })
      .select()
      .single();

    if (saleError) {
      alert(saleError.message);
      return;
    }

    alert("Venda rápida finalizada com sucesso ☕");

    router.push(`/cupom/${sale.id}`);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-[#07130d] p-8 text-white lg:p-10">
      <Header title="⚡ Venda Rápida" />

      <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
        <section>
          <div className="mb-6">
            <h2 className="text-3xl font-bold">Produtos</h2>

            <p className="mt-2 text-green-100/60">
              Venda de balcão sem abrir mesa ou comanda.
            </p>

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto..."
              className="mt-5 w-full rounded-2xl bg-[#103520] p-5 outline-none"
            />

            <div className="mt-5 flex flex-wrap gap-3">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaAtual(cat)}
                  className={`rounded-full px-5 py-3 font-bold ${
                    categoriaAtual === cat
                      ? "bg-green-600 text-white"
                      : "bg-[#103520] text-green-100/70 hover:bg-green-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {produtosFiltrados.length === 0 && (
              <div className="rounded-3xl bg-[#103520] p-8 text-center text-green-100/60">
                Nenhum produto encontrado.
              </div>
            )}

            {produtosFiltrados.map((item) => (
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

                <div className="mt-4 flex items-start justify-between gap-3">
                  <h2 className="text-2xl font-bold">{item.name}</h2>

                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-200">
                    {item.category || "Outros"}
                  </span>
                </div>

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
          <h2 className="text-3xl font-bold">🛒 Carrinho</h2>

          <div className="mt-6 space-y-3">
            {itens.length === 0 && (
              <p className="rounded-xl bg-black/10 p-4 text-green-100/60">
                Nenhum item adicionado.
              </p>
            )}

            {itens.map((item) => {
              const subtotal = Number(item.produto.price) * item.qty;

              return (
                <div
                  key={item.produto.id}
                  className="rounded-xl bg-black/10 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong>
                        {item.qty}x {item.produto.name}
                      </strong>

                      <p className="text-sm text-green-100/70">
                        Unitário: R$ {Number(item.produto.price).toFixed(2)}
                      </p>

                      <p className="mt-1 font-bold text-green-300">
                        R$ {subtotal.toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => remover(item.produto.id)}
                      className="rounded-xl bg-red-500/20 px-3 py-2 text-red-200 hover:bg-red-500/30"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => diminuir(item.produto.id)}
                      className="rounded-xl bg-black/20 py-3 font-bold hover:bg-black/30"
                    >
                      −
                    </button>

                    <button
                      onClick={() => adicionar(item.produto)}
                      className="rounded-xl bg-green-600 py-3 font-bold hover:bg-green-500"
                    >
                      ＋
                    </button>
                  </div>
                </div>
              );
            })}
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