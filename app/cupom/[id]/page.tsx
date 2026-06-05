"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "../../../components/Header";
import { supabase } from "../../../lib/supabase";

export default function Cupom() {
  const { id } = useParams();

  const [venda, setVenda] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [itens, setItens] = useState<any[]>([]);

  async function carregar() {
    const { data: vendaData } = await supabase
      .from("sales")
      .select("*")
      .eq("id", id)
      .single();

    const { data: configData } = await supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .single();

    setVenda(vendaData);
    setConfig(configData);

    if (vendaData?.order_id) {
      const { data: itensData } = await supabase
        .from("order_items")
        .select(`
          *,
          products (
            name
          )
        `)
        .eq("order_id", vendaData.order_id);

      setItens(itensData || []);
    }
  }

  function imprimir() {
    window.print();
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-[#07130d] p-8 text-white lg:p-10">
      <div className="print:hidden">
        <Header title="🧾 Cupom" backTo="/historico" />
      </div>

      <section className="mx-auto max-w-md rounded-3xl bg-white p-8 text-black print:rounded-none print:p-4">
        <div className="text-center">
          <div className="text-5xl">☕</div>

          <h1 className="mt-3 text-2xl font-bold">
            {config?.company_name || "Kafeteria"}
          </h1>

          {config?.phone && <p>{config.phone}</p>}
          {config?.instagram && <p>{config.instagram}</p>}
          {config?.address && <p className="text-sm">{config.address}</p>}
        </div>

        <div className="my-6 border-t border-dashed border-black/30" />

        <div className="space-y-2 text-sm">
          <p>
            <strong>Venda:</strong> {String(venda?.id || "").slice(0, 8)}
          </p>

          <p>
            <strong>Pagamento:</strong> {venda?.payment_method}
          </p>

          <p>
            <strong>Data:</strong>{" "}
            {venda?.created_at
              ? new Date(venda.created_at).toLocaleString("pt-BR")
              : ""}
          </p>
        </div>

        <div className="my-6 border-t border-dashed border-black/30" />

        <div>
          <h2 className="mb-3 font-bold">Itens do pedido</h2>

          {itens.length === 0 && (
            <p className="text-sm text-black/60">
              Itens indisponíveis para vendas antigas.
            </p>
          )}

          <div className="space-y-3">
            {itens.map((item) => {
              const nomeProduto =
                item.products?.name || "Produto";

              const subtotal =
                Number(item.qty) *
                Number(item.price);

              return (
                <div key={item.id}>
                  <div className="flex justify-between gap-4">
                    <span>
                      {item.qty}x {nomeProduto}
                    </span>

                    <span>
                      R$ {subtotal.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-black/60">
                    Unitário: R$ {Number(item.price).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="my-6 border-t border-dashed border-black/30" />

        <div className="flex justify-between text-2xl font-bold">
          <span>Total</span>
          <span>R$ {Number(venda?.total || 0).toFixed(2)}</span>
        </div>

        <div className="my-6 border-t border-dashed border-black/30" />

        <p className="text-center text-sm">Obrigado pela preferência ☕</p>
      </section>

      <div className="mx-auto mt-6 max-w-md print:hidden">
        <button
          onClick={imprimir}
          className="w-full rounded-2xl bg-green-600 py-4 font-bold hover:bg-green-500"
        >
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>
    </main>
  );
}