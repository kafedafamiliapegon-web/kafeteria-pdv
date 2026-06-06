"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

type PeriodoRelatorio = "hoje" | "mes" | "todos";

type ProdutoResumo = {
  nome: string;
  quantidade: number;
  total: number;
};

type ResumoRelatorio = {
  total: number;
  pix: number;
  cartao: number;
  dinheiro: number;
  produtos: Record<string, ProdutoResumo>;
};

export default function Relatorios() {
  const [vendas, setVendas] = useState<any[]>([]);
  const [periodo, setPeriodo] = useState<PeriodoRelatorio>("hoje");
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

    setVendas(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  function dinheiro(valor: any) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  function dentroDoPeriodo(data: string | null) {
    if (periodo === "todos") return true;
    if (!data) return false;

    const dataVenda = new Date(data);
    const agora = new Date();

    if (Number.isNaN(dataVenda.getTime())) return false;

    if (periodo === "hoje") {
      return dataVenda.toDateString() === agora.toDateString();
    }

    return (
      dataVenda.getFullYear() === agora.getFullYear() &&
      dataVenda.getMonth() === agora.getMonth()
    );
  }

  function itensDaVenda(venda: any) {
    if (Array.isArray(venda.orders)) {
      return venda.orders.flatMap((order: any) => order.order_items || []);
    }

    return venda.orders?.order_items || [];
  }

  function nomeProduto(item: any) {
    const produto = Array.isArray(item.products)
      ? item.products[0]
      : item.products;

    return produto?.name || "Produto";
  }

  function formaPagamento(venda: any) {
    const pagamento = String(venda.payment_method || "");

    if (pagamento === "PIX") return "pix";
    if (pagamento.toLowerCase().startsWith("cart")) return "cartao";
    if (pagamento === "Dinheiro") return "dinheiro";

    return "";
  }

  const vendasPeriodo = vendas.filter((venda) =>
    dentroDoPeriodo(venda.created_at)
  );

  const resumo = vendasPeriodo.reduce<ResumoRelatorio>(
    (acc, venda) => {
      const valor = Number(venda.total || 0);
      const pagamento = formaPagamento(venda);

      acc.total += valor;

      if (pagamento === "pix") acc.pix += valor;
      if (pagamento === "cartao") acc.cartao += valor;
      if (pagamento === "dinheiro") acc.dinheiro += valor;

      itensDaVenda(venda).forEach((item: any) => {
        const nome = nomeProduto(item);
        const quantidade = Number(item.qty || 0);
        const subtotal = quantidade * Number(item.price || 0);

        if (!acc.produtos[nome]) {
          acc.produtos[nome] = {
            nome,
            quantidade: 0,
            total: 0,
          };
        }

        acc.produtos[nome].quantidade += quantidade;
        acc.produtos[nome].total += subtotal;
      });

      return acc;
    },
    {
      total: 0,
      pix: 0,
      cartao: 0,
      dinheiro: 0,
      produtos: {} as Record<string, ProdutoResumo>,
    }
  );

  const produtos = Object.values(resumo.produtos).sort(
    (a, b) => b.quantidade - a.quantidade
  );

  const produtoMaisVendido = produtos[0];

  const maiorFormaPagamento = [
    { nome: "PIX", valor: resumo.pix },
    { nome: "Cartão", valor: resumo.cartao },
    { nome: "Dinheiro", valor: resumo.dinheiro },
  ].sort((a, b) => b.valor - a.valor)[0];

  const periodoLabel =
    periodo === "hoje"
      ? "Hoje"
      : periodo === "mes"
        ? "Este mês"
        : "Todos";

  const filtros: Array<{
    label: string;
    value: PeriodoRelatorio;
  }> = [
    {
      label: "Hoje",
      value: "hoje",
    },
    {
      label: "Este mês",
      value: "mes",
    },
    {
      label: "Todos",
      value: "todos",
    },
  ];

  return (
    <main className="pdv-page">
      <section className="pdv-main">
        <Header
          title="Relatórios"
          subtitle="Resumo financeiro e desempenho de produtos"
          backTo="/"
          backLabel="Ir para o início"
        />

        <section className="pdv-panel mb-5">
          <div className="pdv-panel-header">
            <div>
              <h2 className="pdv-panel-title">Período do relatório</h2>
              <p className="pdv-panel-subtitle">
                Selecione o intervalo usado nos totais, pagamentos e produtos.
              </p>
            </div>

            <div className="pdv-filter-row">
              {filtros.map((filtro) => (
                <button
                  key={filtro.value}
                  onClick={() => setPeriodo(filtro.value)}
                  className={`pdv-tab ${
                    periodo === filtro.value ? "active" : ""
                  }`}
                >
                  {filtro.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="pdv-stats mb-5">
          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Total vendido</div>
                <div className="pdv-stat-value">{dinheiro(resumo.total)}</div>
                <div className="pdv-stat-note">valor em {periodoLabel}</div>
              </div>

              <div className="pdv-stat-icon">R$</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Vendas</div>
                <div className="pdv-stat-value">{vendasPeriodo.length}</div>
                <div className="pdv-stat-note">
                  transações em {periodoLabel}
                </div>
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
                    : "sem vendas no período"}
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
                Valores agrupados por forma de pagamento em {periodoLabel}.
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
                  {dinheiro(resumo.pix)}
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
                  {dinheiro(resumo.cartao)}
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
                  {dinheiro(resumo.dinheiro)}
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
                Ranking por quantidade vendida e faturamento em {periodoLabel}.
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
                Nenhum produto vendido neste período.
              </div>
            )}

            {produtos.map((produto, index) => (
              <article
                key={produto.nome}
                className="pdv-product-card pdv-ranking-row"
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
