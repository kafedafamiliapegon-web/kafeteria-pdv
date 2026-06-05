"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const router = useRouter();

  const [dados, setDados] = useState({
    vendas: 0,
    mesas: 0,
    produtos: 0,
    ticket: 0,
  });

  const [produtos, setProdutos] = useState<any[]>([]);
  const [ultimas, setUltimas] = useState<any[]>([]);

  async function sair() {
    const confirmar = confirm("Deseja sair do sistema?");

    if (!confirmar) return;

    await supabase.auth.signOut();

    router.push("/login");
  }

  async function carregar() {
    const [sales, tables, products] = await Promise.all([
      supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase.from("tables_open").select("*").eq("status", "open"),

      supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true }),
    ]);

    const vendas = sales.data || [];
    const listaProdutos = products.data || [];

    const total = vendas.reduce((a, b) => a + Number(b.total), 0);

    setDados({
      vendas: total,
      mesas: tables.data?.length || 0,
      produtos: listaProdutos.length,
      ticket: vendas.length ? total / vendas.length : 0,
    });

    setUltimas(vendas);
    setProdutos(listaProdutos);
  }

  function dinheiro(valor: any) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  function dataHoje() {
    return new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function horaAgora() {
    return new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  useEffect(() => {
    carregar();
  }, []);

  const menu = [
    ["🏠", "Dashboard", "/"],
    ["🛒", "Venda", "/venda-rapida"],
    ["🪑", "Mesas", "/mesas"],
    ["📦", "Produtos", "/produtos"],
    ["🏷️", "Categorias", "/produtos"],
    ["👥", "Clientes", "/historico"],
    ["💰", "Caixa", "/caixa"],
    ["📊", "Relatórios", "/relatorios"],
    ["🕒", "Histórico", "/historico"],
    ["⚙️", "Configurações", "/configuracoes"],
  ];

  const categorias = [
    "Todos",
    "Cafés",
    "Bebidas",
    "Salgados",
    "Doces",
    "Pães",
    "Combos",
    "Outros",
  ];

  const produtosVitrine = produtos.slice(0, 10);
  const carrinhoVisual = ultimas.slice(0, 4);

  return (
    <main className="pdv-page">
      <div className="pdv-shell">
        <aside className="pdv-sidebar">
          <div className="pdv-brand">
            <div className="pdv-logo">☕</div>

            <div>
              <div className="pdv-brand-title">Kafeteria PDV</div>
              <div className="pdv-brand-subtitle">
                Sistema de gestão para cafeterias
              </div>
            </div>
          </div>

          <nav className="pdv-menu">
            {menu.map(([icone, texto, href], index) => (
              <Link
                key={String(texto)}
                href={String(href)}
                className={`pdv-menu-item ${index === 0 ? "active" : ""}`}
              >
                <span className="pdv-menu-icon">{icone}</span>
                <span>{texto}</span>
              </Link>
            ))}
          </nav>

          <div className="pdv-sidebar-bottom">
            <div className="pdv-user-card">
              <div className="pdv-user-avatar">AD</div>

              <div>
                <div className="pdv-user-name">Administrador</div>
                <div className="pdv-user-email">admin@kafeteria.com</div>
              </div>
            </div>

            <button onClick={sair} className="pdv-logout">
              ↪ Sair do sistema
            </button>
          </div>
        </aside>

        <section className="pdv-main">
          <div className="pdv-grid">
            <div className="pdv-content">
              <header className="pdv-hero">
                <div>
                  <div className="pdv-hero-small">
                    Bom dia, Administrador! ☕
                  </div>

                  <h1 className="pdv-hero-title">
                    Bem-vindo à Kafeteria PDV
                  </h1>

                  <p className="pdv-hero-text">
                    Gerencie vendas, produtos e o seu negócio em um só lugar.
                  </p>
                </div>

                <div className="pdv-hero-info">
                  <div className="pdv-info-card">
                    <div className="pdv-info-label">📅 {dataHoje()}</div>
                    <div className="pdv-info-muted">Hoje · {horaAgora()}</div>
                  </div>

                  <div className="pdv-info-card">
                    <div className="pdv-info-label">🟢 Caixa aberto</div>
                    <div className="pdv-info-muted">Pronto para vender</div>
                  </div>
                </div>
              </header>

              <section className="pdv-stats">
                <div className="pdv-stat-card">
                  <div className="pdv-stat-top">
                    <div>
                      <div className="pdv-stat-label">Vendas hoje</div>
                      <div className="pdv-stat-value">
                        {dinheiro(dados.vendas)}
                      </div>
                      <div className="pdv-stat-note">↑ movimento do dia</div>
                    </div>

                    <div className="pdv-stat-icon">💵</div>
                  </div>
                </div>

                <div className="pdv-stat-card">
                  <div className="pdv-stat-top">
                    <div>
                      <div className="pdv-stat-label">Transações</div>
                      <div className="pdv-stat-value">{ultimas.length}</div>
                      <div className="pdv-stat-note">↑ vendas recentes</div>
                    </div>

                    <div className="pdv-stat-icon">🛍️</div>
                  </div>
                </div>

                <div className="pdv-stat-card">
                  <div className="pdv-stat-top">
                    <div>
                      <div className="pdv-stat-label">Produtos vendidos</div>
                      <div className="pdv-stat-value">{dados.produtos}</div>
                      <div className="pdv-stat-note">produtos ativos</div>
                    </div>

                    <div className="pdv-stat-icon">☕</div>
                  </div>
                </div>
              </section>

              <section className="pdv-panel">
                <div className="pdv-panel-header">
                  <div>
                    <h2 className="pdv-panel-title">Venda rápida</h2>
                    <p className="pdv-panel-subtitle">
                      Selecione os produtos para adicionar ao carrinho.
                    </p>
                  </div>

                  <Link href="/venda-rapida" className="pdv-search">
                    Buscar produto...
                  </Link>
                </div>

                <div className="pdv-tabs">
                  {categorias.map((categoria, index) => (
                    <span
                      key={categoria}
                      className={`pdv-tab ${index === 0 ? "active" : ""}`}
                    >
                      {categoria}
                    </span>
                  ))}
                </div>

                <div className="pdv-products">
                  {produtosVitrine.length === 0 && (
                    <Link href="/produtos" className="pdv-product-card">
                      <div className="pdv-product-empty">☕</div>
                      <div className="pdv-product-body">
                        <div className="pdv-product-name">
                          Cadastre produtos
                        </div>
                        <div className="pdv-product-bottom">
                          <span className="pdv-product-price">Começar</span>
                          <span className="pdv-plus">+</span>
                        </div>
                      </div>
                    </Link>
                  )}

                  {produtosVitrine.map((produto) => (
                    <Link
                      key={produto.id}
                      href="/venda-rapida"
                      className="pdv-product-card"
                    >
                      {produto.image_url ? (
                        <img
                          src={produto.image_url}
                          className="pdv-product-image"
                        />
                      ) : (
                        <div className="pdv-product-empty">☕</div>
                      )}

                      <div className="pdv-product-body">
                        <div className="pdv-product-name">{produto.name}</div>

                        <div className="pdv-product-bottom">
                          <span className="pdv-product-price">
                            {dinheiro(produto.price)}
                          </span>

                          <span className="pdv-plus">+</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="pdv-more">
                  <Link href="/produtos" className="pdv-more-link">
                    Ver mais produtos⌄
                  </Link>
                </div>
              </section>
            </div>

            <aside>
              <section className="pdv-cart">
                <div className="pdv-cart-header">
                  <div className="pdv-cart-title">
                    <span>🛒</span>
                    <span>Carrinho</span>
                  </div>

                  <span className="pdv-pill">{carrinhoVisual.length} itens</span>
                </div>

                <div className="pdv-cart-body">
                  <div className="pdv-cart-items">
                    {carrinhoVisual.length === 0 && (
                      <div className="pdv-cart-muted">
                        Nenhuma venda recente ainda.
                      </div>
                    )}

                    {carrinhoVisual.map((venda, index) => (
                      <div key={venda.id} className="pdv-cart-item">
                        <div className="pdv-cart-left">
                          <div className="pdv-cart-thumb">☕</div>

                          <div>
                            <div className="pdv-cart-name">
                              Venda #{index + 1}
                            </div>

                            <div className="pdv-cart-muted">
                              {venda.payment_method}
                            </div>
                          </div>
                        </div>

                        <div className="pdv-cart-price">
                          {dinheiro(venda.total)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pdv-note">✎ Adicionar observação</div>

                  <div className="pdv-totals">
                    <div className="pdv-total-row">
                      <span>Subtotal</span>
                      <span>{dinheiro(dados.vendas)}</span>
                    </div>

                    <div className="pdv-total-row">
                      <span>Desconto</span>
                      <span>R$ 0.00</span>
                    </div>

                    <div className="pdv-total-final">
                      <strong>Total</strong>
                      <span>{dinheiro(dados.vendas)}</span>
                    </div>
                  </div>

                  <Link href="/venda-rapida" className="pdv-finish">
                    💳 Finalizar venda
                  </Link>

                  <div className="pdv-payment-row">
                    <span className="pdv-payment">PIX</span>
                    <span className="pdv-payment">Cartão</span>
                    <span className="pdv-payment">Dinheiro</span>
                  </div>

                  <div className="pdv-safe">
                    🛡️ Ambiente seguro e criptografado
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}