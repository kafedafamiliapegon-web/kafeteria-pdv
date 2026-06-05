"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type ItemCarrinho = {
  produto: any;
  qty: number;
};

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
  const [usuario, setUsuario] = useState<any>(null);

  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [pagamento, setPagamento] = useState("PIX");
  const [busca, setBusca] = useState("");
  const [categoriaAtual, setCategoriaAtual] = useState("Todos");

  async function sair() {
    const confirmar = confirm("Deseja sair do sistema?");

    if (!confirmar) return;

    await supabase.auth.signOut();

    router.push("/login");
  }

  async function carregar() {
    const { data: userData } = await supabase.auth.getUser();

    setUsuario(userData.user);

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

  function adicionar(produto: any) {
    if (Number(produto.stock) <= 0) {
      alert("Produto sem estoque");
      return;
    }

    setItens((atual) => {
      const existente = atual.find((item) => item.produto.id === produto.id);

      if (existente) {
        if (existente.qty >= Number(produto.stock)) {
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

  const totalCarrinho = itens.reduce(
    (soma, item) => soma + Number(item.produto.price) * item.qty,
    0
  );

  const quantidadeCarrinho = itens.reduce((soma, item) => soma + item.qty, 0);

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
      alert("Adicione pelo menos um item no carrinho");
      return;
    }

    const caixaAberto = await verificarCaixaAberto();

    if (!caixaAberto) {
      alert("O caixa está fechado. Abra o caixa antes de finalizar vendas.");
      router.push("/caixa");
      return;
    }

    const confirmar = confirm(
      `Finalizar venda de ${dinheiro(totalCarrinho)} em ${pagamento}?`
    );

    if (!confirmar) return;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        table_id: null,
        status: "closed",
        subtotal: totalCarrinho,
        discount: 0,
        total: totalCarrinho,
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
        total: totalCarrinho,
        order_id: order.id,
        cash_register_id: caixaAberto.id,
      })
      .select()
      .single();

    if (saleError) {
      alert(saleError.message);
      return;
    }

    alert("Venda finalizada com sucesso ☕");

    setItens([]);

    router.push(`/cupom/${sale.id}`);
  }

  useEffect(() => {
    carregar();
  }, []);

  const menu = [
    ["🏠", "Dashboard", "/"],
    ["🛒", "Venda", "/venda-rapida"],
    ["🪑", "Mesas", "/mesas"],
    ["📦", "Produtos", "/produtos"],
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

  const produtosFiltrados = produtos
    .filter((produto) =>
      produto.name.toLowerCase().includes(busca.toLowerCase())
    )
    .filter((produto) => {
      if (categoriaAtual === "Todos") return true;

      return (produto.category || "Outros") === categoriaAtual;
    })
    .slice(0, 10);

  const nomeUsuario =
    usuario?.user_metadata?.name ||
    usuario?.email?.split("@")[0] ||
    "Administrador";

  const emailUsuario = usuario?.email || "admin@kafeteria.com";

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
              <div className="pdv-user-avatar">
                {String(nomeUsuario).slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="pdv-user-name">{nomeUsuario}</div>
                <div className="pdv-user-email">{emailUsuario}</div>
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
                    Bom dia, {nomeUsuario}! ☕
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
                      Clique no produto ou no botão + para adicionar ao carrinho.
                    </p>
                  </div>

                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar produto..."
                    className="pdv-search"
                  />
                </div>

                <div className="pdv-tabs">
                  {categorias.map((categoria) => (
                    <button
                      key={categoria}
                      onClick={() => setCategoriaAtual(categoria)}
                      className={`pdv-tab ${
                        categoriaAtual === categoria ? "active" : ""
                      }`}
                    >
                      {categoria}
                    </button>
                  ))}
                </div>

                <div className="pdv-products">
                  {produtosFiltrados.length === 0 && (
                    <Link href="/produtos" className="pdv-product-card">
                      <div className="pdv-product-empty">☕</div>

                      <div className="pdv-product-body">
                        <div className="pdv-product-name">
                          Nenhum produto encontrado
                        </div>

                        <div className="pdv-product-bottom">
                          <span className="pdv-product-price">Produtos</span>
                          <span className="pdv-plus">+</span>
                        </div>
                      </div>
                    </Link>
                  )}

                  {produtosFiltrados.map((produto) => (
                    <button
                      key={produto.id}
                      onClick={() => adicionar(produto)}
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

                        <div className="pdv-product-stock">
                          Estoque: {produto.stock}
                        </div>

                        <div className="pdv-product-bottom">
                          <span className="pdv-product-price">
                            {dinheiro(produto.price)}
                          </span>

                          <span className="pdv-plus">+</span>
                        </div>
                      </div>
                    </button>
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

                  <span className="pdv-pill">{quantidadeCarrinho} itens</span>
                </div>

                <div className="pdv-cart-body">
                  <div className="pdv-cart-items">
                    {itens.length === 0 && (
                      <div className="pdv-cart-empty">
                        <div className="pdv-cart-empty-icon">🛒</div>
                        <strong>Carrinho vazio</strong>
                        <p>Adicione produtos pela venda rápida.</p>
                      </div>
                    )}

                    {itens.map((item) => {
                      const subtotal = Number(item.produto.price) * item.qty;

                      return (
                        <div key={item.produto.id} className="pdv-cart-item">
                          <div className="pdv-cart-left">
                            <div className="pdv-cart-thumb">
                              {item.produto.image_url ? (
                                <img
                                  src={item.produto.image_url}
                                  className="pdv-cart-image"
                                />
                              ) : (
                                "☕"
                              )}
                            </div>

                            <div className="pdv-cart-info">
                              <div className="pdv-cart-name">
                                {item.produto.name}
                              </div>

                              <div className="pdv-cart-muted">
                                {item.qty}x {dinheiro(item.produto.price)}
                              </div>

                              <div className="pdv-cart-actions">
                                <button
                                  onClick={() => diminuir(item.produto.id)}
                                  className="pdv-qty-btn"
                                >
                                  −
                                </button>

                                <span className="pdv-qty-number">
                                  {item.qty}
                                </span>

                                <button
                                  onClick={() => adicionar(item.produto)}
                                  className="pdv-qty-btn active"
                                >
                                  +
                                </button>

                                <button
                                  onClick={() => remover(item.produto.id)}
                                  className="pdv-remove-btn"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="pdv-cart-price">
                            {dinheiro(subtotal)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pdv-note">✎ Adicionar observação</div>

                  <div className="pdv-totals">
                    <div className="pdv-total-row">
                      <span>Subtotal</span>
                      <span>{dinheiro(totalCarrinho)}</span>
                    </div>

                    <div className="pdv-total-row">
                      <span>Desconto</span>
                      <span>R$ 0.00</span>
                    </div>

                    <div className="pdv-total-final">
                      <strong>Total</strong>
                      <span>{dinheiro(totalCarrinho)}</span>
                    </div>
                  </div>

                  <button onClick={finalizarVenda} className="pdv-finish">
                    💳 Finalizar venda
                  </button>

                  <div className="pdv-payment-row">
                    {["PIX", "Cartão", "Dinheiro"].map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setPagamento(tipo)}
                        className={`pdv-payment ${
                          pagamento === tipo ? "active" : ""
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
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