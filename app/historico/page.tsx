"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

export default function Historico() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("sales")
      .select(
        `
        *,
        orders (
          id,
          table_id,
          order_items (
            id,
            product_id,
            qty,
            price,
            products (
              id,
              name,
              stock
            )
          )
        )
      `
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      alert(error.message);
      setCarregando(false);
      return;
    }

    const lista = data || [];

    setVendas(lista);

    const soma = lista.reduce(
      (acc, venda) => acc + Number(venda.total || 0),
      0
    );

    setTotal(soma);
    setCarregando(false);
  }

  async function devolverEstoque(itens: any[]) {
    for (const item of itens) {
      const produtoId = item.product_id || item.products?.id;

      if (!produtoId) continue;

      const estoqueAtual = Number(item.products?.stock || 0);
      const quantidadeVendida = Number(item.qty || 0);
      const novoEstoque = estoqueAtual + quantidadeVendida;

      const { error } = await supabase
        .from("products")
        .update({
          stock: novoEstoque,
        })
        .eq("id", produtoId);

      if (error) {
        alert(error.message);
        return false;
      }
    }

    return true;
  }

  async function apagarVenda(venda: any) {
    const confirmar = confirm(
      `Apagar esta venda?\n\nValor: ${dinheiro(
        venda.total
      )}\nPagamento: ${
        venda.payment_method
      }\n\nO estoque dos itens vendidos será devolvido.`
    );

    if (!confirmar) return;

    const palavra = prompt("Para confirmar, digite exatamente: APAGAR");

    if (palavra !== "APAGAR") {
      alert("Operação cancelada.");
      return;
    }

    const orderId = venda.order_id || venda.orders?.id;
    const itens = venda.orders?.order_items || [];

    if (itens.length > 0) {
      const estoqueOk = await devolverEstoque(itens);

      if (!estoqueOk) return;
    }

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

    alert("Venda apagada e estoque devolvido com sucesso.");

    carregar();
  }

  function dataBR(data: string) {
    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function dinheiro(valor: any) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  function tipoVenda(venda: any) {
    return venda.orders?.table_id ? "Mesa/Comanda" : "Venda rápida";
  }

  useEffect(() => {
    carregar();
  }, []);

  const maiorVenda = vendas.reduce((maior, venda) => {
    const valor = Number(venda.total || 0);
    return valor > maior ? valor : maior;
  }, 0);

  return (
    <main className="pdv-page">
      <section className="pdv-main">
        <Header
          title="Histórico"
          subtitle="Consulta de vendas e cupons"
          backTo="/"
          backLabel="Ir para o início"
        />

        <section className="pdv-stats mb-5">
          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Total vendido</div>
                <div className="pdv-stat-value">{dinheiro(total)}</div>
                <div className="pdv-stat-note">somatório das vendas</div>
              </div>

              <div className="pdv-stat-icon">R$</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Quantidade</div>
                <div className="pdv-stat-value">{vendas.length}</div>
                <div className="pdv-stat-note">vendas registradas</div>
              </div>

              <div className="pdv-stat-icon">VD</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Maior venda</div>
                <div className="pdv-stat-value">{dinheiro(maiorVenda)}</div>
                <div className="pdv-stat-note">maior valor registrado</div>
              </div>

              <div className="pdv-stat-icon">MV</div>
            </div>
          </div>
        </section>

        <section className="pdv-panel">
          <div className="pdv-panel-header">
            <div>
              <h2 className="pdv-panel-title">Vendas registradas</h2>
              <p className="pdv-panel-subtitle">
                Veja cupons, formas de pagamento e itens vendidos.
              </p>
            </div>

            <button
              onClick={carregar}
              className="pdv-more-link"
              style={{
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Atualizar
            </button>
          </div>

          {carregando && (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#123b24",
                fontWeight: 950,
              }}
            >
              Carregando histórico...
            </div>
          )}

          {!carregando && vendas.length === 0 && (
            <div
              style={{
                padding: 52,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 92,
                  height: 92,
                  margin: "0 auto 18px",
                  borderRadius: 28,
                  background:
                    "linear-gradient(135deg, rgba(11,90,52,0.12), rgba(255,255,255,0.7))",
                  display: "grid",
                  placeItems: "center",
                  color: "#123b24",
                  fontSize: 28,
                  fontWeight: 950,
                }}
              >
                HI
              </div>

              <h2 className="pdv-panel-title">Nenhuma venda registrada</h2>

              <p className="pdv-panel-subtitle">
                As vendas finalizadas aparecerão aqui automaticamente.
              </p>
            </div>
          )}

          {!carregando && vendas.length > 0 && (
            <div
              style={{
                display: "grid",
                gap: 14,
              }}
            >
              {vendas.map((venda, index) => {
                const itens = venda.orders?.order_items || [];

                return (
                  <article
                    key={venda.id}
                    className="pdv-product-card"
                    style={{
                      padding: 0,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 1fr) auto",
                        gap: 16,
                        padding: 18,
                        background:
                          "linear-gradient(135deg, #0b5a34, #123b24)",
                        color: "#fffdf2",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <h2
                            style={{
                              fontSize: 24,
                              fontWeight: 950,
                              lineHeight: 1,
                            }}
                          >
                            Venda #{index + 1}
                          </h2>

                          <span
                            style={{
                              borderRadius: 999,
                              background: "rgba(247,244,233,0.16)",
                              padding: "8px 12px",
                              fontSize: 12,
                              fontWeight: 950,
                            }}
                          >
                            {tipoVenda(venda)}
                          </span>

                          <span
                            style={{
                              borderRadius: 999,
                              background: "rgba(247,244,233,0.16)",
                              padding: "8px 12px",
                              fontSize: 12,
                              fontWeight: 950,
                            }}
                          >
                            {venda.payment_method}
                          </span>
                        </div>

                        <p
                          style={{
                            marginTop: 9,
                            color: "rgba(246,255,240,0.68)",
                            fontWeight: 700,
                          }}
                        >
                          {dataBR(venda.created_at)}
                        </p>
                      </div>

                      <div
                        style={{
                          textAlign: "right",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            color: "rgba(246,255,240,0.64)",
                            fontWeight: 800,
                          }}
                        >
                          Total
                        </div>

                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 28,
                            fontWeight: 950,
                          }}
                        >
                          {dinheiro(venda.total)}
                        </div>
                      </div>
                    </div>

                    <div className="pdv-product-body">
                      <div
                        style={{
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <h3
                          style={{
                            color: "#123b24",
                            fontWeight: 950,
                            fontSize: 16,
                          }}
                        >
                          Itens do pedido
                        </h3>

                        {itens.length === 0 && (
                          <div
                            style={{
                              borderRadius: 14,
                              background: "#f8f6ea",
                              padding: 14,
                              color: "rgba(18,59,36,0.58)",
                              fontWeight: 800,
                            }}
                          >
                            Itens indisponíveis para vendas antigas.
                          </div>
                        )}

                        {itens.map((item: any) => {
                          const nomeProduto = item.products?.name || "Produto";
                          const subtotal =
                            Number(item.qty || 0) * Number(item.price || 0);

                          return (
                            <div
                              key={item.id}
                              style={{
                                borderRadius: 14,
                                background: "#f8f6ea",
                                padding: 14,
                                display: "grid",
                                gridTemplateColumns: "minmax(0, 1fr) auto",
                                gap: 12,
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    color: "#123b24",
                                    fontWeight: 950,
                                  }}
                                >
                                  {item.qty}x {nomeProduto}
                                </div>

                                <div className="pdv-product-stock">
                                  Unitário: {dinheiro(item.price)}
                                </div>
                              </div>

                              <div
                                style={{
                                  color: "#0b7d42",
                                  fontWeight: 950,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {dinheiro(subtotal)}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div
                        style={{
                          marginTop: 16,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 10,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Link
                          href={`/cupom/${venda.id}`}
                          className="pdv-more-link"
                          style={{
                            justifyContent: "center",
                          }}
                        >
                          Ver cupom
                        </Link>

                        <button
                          onClick={() => apagarVenda(venda)}
                          className="pdv-remove-btn"
                          style={{
                            height: "auto",
                            minHeight: 45,
                            borderRadius: 14,
                            paddingLeft: 18,
                            paddingRight: 18,
                          }}
                        >
                          Apagar venda
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}