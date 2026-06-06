"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

export default function Relatorios() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pix, setPix] = useState(0);
  const [cartao, setCartao] = useState(0);
  const [dinheiroTotal, setDinheiroTotal] = useState(0);
  const [produtos, setProdutos] = useState<any[]>([]);
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

    if (error) {
      alert(error.message);
      setCarregando(false);
      return;
    }

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
    setDinheiroTotal(somaDinheiro);

    setProdutos(
      Object.values(mapaProdutos).sort(
        (a: any, b: any) => b.quantidade - a.quantidade
      )
    );

    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function dinheiro(valor: any) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  const produtoMaisVendido = produtos[0];
  const maiorFormaPagamento = [
    { nome: "PIX", valor: pix },
    { nome: "Cartão", valor: cartao },
    { nome: "Dinheiro", valor: dinheiroTotal },
  ].sort((a, b) => b.valor - a.valor)[0];

  return (
    <main className="pdv-page">
      <section className="pdv-main">
        <Header
          title="Relatórios"
          subtitle="Resumo financeiro e desempenho de produtos"
          backTo="/"
          backLabel="Ir para o início"
        />

        <section className="pdv-stats mb-5">
          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Total vendido</div>
                <div className="pdv-stat-value">{dinheiro(total)}</div>
                <div className="pdv-stat-note">valor geral vendido</div>
              </div>

              <div className="pdv-stat-icon">R$</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Vendas</div>
                <div className="pdv-stat-value">{vendas.length}</div>
                <div className="pdv-stat-note">transações no histórico</div>
              </div>

              <div className="pdv-stat-icon">VD</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Mais vendido</div>
                <div
                  className="pdv-stat-value"
                  style={{
                    fontSize: produtoMaisVendido ? 23 : 29,
                    lineHeight: 1.05,
                  }}
                >
                  {produtoMaisVendido?.nome || "Nenhum"}
                </div>
                <div className="pdv-stat-note">
                  {produtoMaisVendido
                    ? `${produtoMaisVendido.quantidade} unidade(s)`
                    : "sem vendas ainda"}
                </div>
              </div>

              <div className="pdv-stat-icon">PR</div>
            </div>
          </div>
        </section>

        <section className="pdv-panel mb-5">
          <div className="pdv-panel-header">
            <div>
              <h2 className="pdv-panel-title">Resumo de pagamentos</h2>
              <p className="pdv-panel-subtitle">
                Valores agrupados por forma de pagamento.
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
              Carregando relatórios...
            </div>
          )}

          {!carregando && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              <article className="pdv-product-card" style={{ padding: 18 }}>
                <div className="pdv-product-stock">Forma de pagamento</div>
                <h2
                  style={{
                    marginTop: 8,
                    color: "#123b24",
                    fontSize: 28,
                    fontWeight: 950,
                  }}
                >
                  PIX
                </h2>
                <div
                  style={{
                    marginTop: 12,
                    color: "#0b7d42",
                    fontSize: 28,
                    fontWeight: 950,
                  }}
                >
                  {dinheiro(pix)}
                </div>
              </article>

              <article className="pdv-product-card" style={{ padding: 18 }}>
                <div className="pdv-product-stock">Forma de pagamento</div>
                <h2
                  style={{
                    marginTop: 8,
                    color: "#123b24",
                    fontSize: 28,
                    fontWeight: 950,
                  }}
                >
                  Cartão
                </h2>
                <div
                  style={{
                    marginTop: 12,
                    color: "#0b7d42",
                    fontSize: 28,
                    fontWeight: 950,
                  }}
                >
                  {dinheiro(cartao)}
                </div>
              </article>

              <article className="pdv-product-card" style={{ padding: 18 }}>
                <div className="pdv-product-stock">Forma de pagamento</div>
                <h2
                  style={{
                    marginTop: 8,
                    color: "#123b24",
                    fontSize: 28,
                    fontWeight: 950,
                  }}
                >
                  Dinheiro
                </h2>
                <div
                  style={{
                    marginTop: 12,
                    color: "#0b7d42",
                    fontSize: 28,
                    fontWeight: 950,
                  }}
                >
                  {dinheiro(dinheiroTotal)}
                </div>
              </article>

              <article
                className="pdv-product-card"
                style={{
                  padding: 18,
                  background:
                    "linear-gradient(135deg, #0b5a34, #123b24)",
                  color: "#fffdf2",
                }}
              >
                <div
                  style={{
                    color: "rgba(246,255,240,0.68)",
                    fontSize: 12,
                    fontWeight: 900,
                    textTransform: "uppercase",
                  }}
                >
                  Principal forma
                </div>

                <h2
                  style={{
                    marginTop: 8,
                    fontSize: 28,
                    fontWeight: 950,
                  }}
                >
                  {maiorFormaPagamento?.valor > 0
                    ? maiorFormaPagamento.nome
                    : "Nenhuma"}
                </h2>

                <div
                  style={{
                    marginTop: 12,
                    color: "#f7f4e9",
                    fontSize: 28,
                    fontWeight: 950,
                  }}
                >
                  {dinheiro(maiorFormaPagamento?.valor || 0)}
                </div>
              </article>
            </div>
          )}
        </section>

        <section className="pdv-panel">
          <div className="pdv-panel-header">
            <div>
              <h2 className="pdv-panel-title">Produtos mais vendidos</h2>
              <p className="pdv-panel-subtitle">
                Ranking por quantidade vendida e faturamento por produto.
              </p>
            </div>

            <span
              style={{
                borderRadius: 999,
                background: "rgba(11, 90, 52, 0.1)",
                color: "#123b24",
                padding: "10px 14px",
                fontWeight: 950,
                whiteSpace: "nowrap",
              }}
            >
              {produtos.length} produto(s)
            </span>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {!carregando && produtos.length === 0 && (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: "rgba(18,59,36,0.62)",
                  fontWeight: 850,
                }}
              >
                Nenhum produto vendido ainda.
              </div>
            )}

            {produtos.map((produto, index) => (
              <article
                key={produto.nome}
                className="pdv-product-card"
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr) auto",
                  gap: 14,
                  alignItems: "center",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 16,
                    background:
                      index === 0
                        ? "linear-gradient(135deg, #0b5a34, #123b24)"
                        : "rgba(11, 90, 52, 0.1)",
                    color: index === 0 ? "#fffdf2" : "#123b24",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 950,
                  }}
                >
                  #{index + 1}
                </div>

                <div>
                  <div
                    style={{
                      color: "#123b24",
                      fontWeight: 950,
                      fontSize: 17,
                    }}
                  >
                    {produto.nome}
                  </div>

                  <div className="pdv-product-stock">
                    {produto.quantidade} unidade(s) vendida(s)
                  </div>
                </div>

                <div
                  style={{
                    color: "#0b7d42",
                    fontWeight: 950,
                    fontSize: 18,
                    whiteSpace: "nowrap",
                  }}
                >
                  {dinheiro(produto.total)}
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}