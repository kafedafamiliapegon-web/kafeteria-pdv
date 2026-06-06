"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "../../../components/Header";
import { supabase } from "../../../lib/supabase";

type ProdutoCupom = {
  name?: string | null;
};

type ItemCupom = {
  id: string;
  qty: number | string | null;
  price: number | string | null;
  products?: ProdutoCupom | ProdutoCupom[] | null;
};

type PedidoCupom = {
  id: string;
  table_id?: string | null;
  order_items?: ItemCupom[] | null;
};

type VendaCupom = {
  id: string;
  order_id?: string | null;
  payment_method?: string | null;
  total?: number | string | null;
  created_at?: string | null;
  orders?: PedidoCupom | PedidoCupom[] | null;
};

type ConfigCupom = {
  company_name?: string | null;
  phone?: string | null;
  instagram?: string | null;
  address?: string | null;
};

function LogoKafeteria() {
  return (
    <img
      src="/logo.png"
      alt="Logo Kafeteria"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}

export default function Cupom() {
  const params = useParams();
  const saleId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [venda, setVenda] = useState<VendaCupom | null>(null);
  const [config, setConfig] = useState<ConfigCupom | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!saleId) {
      setErro("Cupom nao encontrado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const [vendaResponse, configResponse] = await Promise.all([
      supabase
        .from("sales")
        .select(
          `
          id,
          order_id,
          payment_method,
          total,
          created_at,
          orders (
            id,
            table_id,
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
        .eq("id", saleId)
        .maybeSingle(),

      supabase.from("company_settings").select("*").limit(1).maybeSingle(),
    ]);

    if (vendaResponse.error) {
      setErro(vendaResponse.error.message);
      setVenda(null);
      setCarregando(false);
      return;
    }

    if (!vendaResponse.data) {
      setErro("Venda nao encontrada.");
      setVenda(null);
      setCarregando(false);
      return;
    }

    setVenda(vendaResponse.data as VendaCupom);
    setConfig((configResponse.data as ConfigCupom | null) || null);
    setCarregando(false);
  }

  function imprimir() {
    window.print();
  }

  function dinheiro(valor: number | string | null | undefined) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  function dataBR(data: string | null | undefined) {
    if (!data) return "-";

    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function pedidoDaVenda() {
    if (!venda?.orders) return null;

    return Array.isArray(venda.orders) ? venda.orders[0] : venda.orders;
  }

  function itensDaVenda() {
    return pedidoDaVenda()?.order_items || [];
  }

  function nomeProduto(item: ItemCupom) {
    const produto = Array.isArray(item.products)
      ? item.products[0]
      : item.products;

    return produto?.name || "Produto";
  }

  function tipoVenda() {
    return pedidoDaVenda()?.table_id ? "Mesa/Comanda" : "Venda rapida";
  }

  useEffect(() => {
    carregar();
  }, [saleId]);

  const itens = itensDaVenda();

  return (
    <main className="pdv-page">
      <section className="pdv-main">
        <div className="print:hidden">
          <Header
            title="Cupom"
            subtitle="Comprovante da venda"
            backTo="/historico"
            backLabel="Voltar ao historico"
          />
        </div>

        <div className="print-area">
          <section
            className="receipt-paper mx-auto max-w-md rounded-[28px] bg-[#fffdf2] p-7 text-[#123b24] shadow-2xl shadow-black/20"
            style={{
              border: "1px solid rgba(18, 59, 36, 0.12)",
            }}
          >
          <div className="text-center">
            <div className="receipt-logo mx-auto h-24 w-24 rounded-[28px] border border-[#0b5a34]/12 bg-white/80 p-3">
              <LogoKafeteria />
            </div>

            <h1 className="mt-4 text-2xl font-black">
              {config?.company_name || "Kafeteria"}
            </h1>

            {config?.phone && (
              <p className="mt-1 text-sm font-bold text-[#123b24]/70">
                {config.phone}
              </p>
            )}

            {config?.instagram && (
              <p className="text-sm font-bold text-[#123b24]/70">
                {config.instagram}
              </p>
            )}

            {config?.address && (
              <p className="text-sm font-bold text-[#123b24]/70">
                {config.address}
              </p>
            )}
          </div>

          <div className="my-6 border-t border-dashed border-[#123b24]/25" />

          {carregando && (
            <div className="py-10 text-center text-sm font-black text-[#123b24]/70">
              Carregando cupom...
            </div>
          )}

          {!carregando && erro && (
            <div className="rounded-2xl bg-[#f8f6ea] p-5 text-center text-sm font-black text-[#123b24]/70">
              {erro}
            </div>
          )}

          {!carregando && !erro && venda && (
            <>
              <div className="space-y-2 text-sm font-bold">
                <p>
                  <strong>Venda:</strong> {venda.id.slice(0, 8)}
                </p>

                <p>
                  <strong>Tipo:</strong> {tipoVenda()}
                </p>

                <p>
                  <strong>Pagamento:</strong>{" "}
                  {venda.payment_method || "Nao informado"}
                </p>

                <p>
                  <strong>Data:</strong> {dataBR(venda.created_at)}
                </p>
              </div>

              <div className="my-6 border-t border-dashed border-[#123b24]/25" />

              <div>
                <h2 className="mb-3 text-base font-black">Itens do pedido</h2>

                {itens.length === 0 && (
                  <p className="rounded-2xl bg-[#f8f6ea] p-4 text-sm font-bold text-[#123b24]/62">
                    Itens indisponiveis para esta venda.
                  </p>
                )}

                <div className="space-y-3">
                  {itens.map((item) => {
                    const quantidade = Number(item.qty || 0);
                    const preco = Number(item.price || 0);
                    const subtotal = quantidade * preco;

                    return (
                      <div
                        key={item.id}
                        className="receipt-item grid grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-2xl bg-[#f8f6ea] p-4"
                      >
                        <div>
                          <div className="font-black">
                            {quantidade}x {nomeProduto(item)}
                          </div>

                          <div className="mt-1 text-xs font-bold text-[#123b24]/58">
                            Unitario: {dinheiro(preco)}
                          </div>
                        </div>

                        <div className="font-black text-[#0b7d42]">
                          {dinheiro(subtotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="my-6 border-t border-dashed border-[#123b24]/25" />

              <div className="receipt-total flex items-center justify-between text-2xl font-black">
                <span>Total</span>
                <span className="text-[#0b7d42]">{dinheiro(venda.total)}</span>
              </div>

              <div className="my-6 border-t border-dashed border-[#123b24]/25" />

              <p className="text-center text-sm font-bold text-[#123b24]/62">
                Obrigado pela preferencia.
              </p>
            </>
          )}
          </section>
        </div>

        {!carregando && !erro && venda && (
          <div className="mx-auto mt-6 max-w-md print:hidden">
            <button onClick={imprimir} className="pdv-finish">
              Imprimir / Salvar PDF
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
