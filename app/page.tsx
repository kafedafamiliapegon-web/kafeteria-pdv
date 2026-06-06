"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type ItemCarrinho = {
  produto: any;
  qty: number;
};

function LogoKafeteria({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Logo Kafeteria"
      className={className}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}

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
  const [caixaAberto, setCaixaAberto] = useState<any>(null);
  const [agora, setAgora] = useState<Date | null>(null);

  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [pagamento, setPagamento] = useState("PIX");
  const [busca, setBusca] = useState("");
  const [categoriaAtual, setCategoriaAtual] = useState("Todos");
  const [modalProdutosAberto, setModalProdutosAberto] = useState(false);
  const [buscaModalProdutos, setBuscaModalProdutos] = useState("");
  const [categoriaModalProdutos, setCategoriaModalProdutos] = useState("Todos");

  async function sair() {
    const confirmar = confirm("Deseja sair do sistema?");

    if (!confirmar) return;

    await supabase.auth.signOut();

    router.push("/login");
  }

  async function carregar() {
    const { data: userData } = await supabase.auth.getUser();

    setUsuario(userData.user);

    const [sales, tables, products, cash] = await Promise.all([
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

      supabase
        .from("cash_registers")
        .select("*")
        .eq("status", "open")
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
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
    setCaixaAberto(cash.data || null);
  }

  function dinheiro(valor: any) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  function dataHoje() {
    if (!agora) return "Carregando data...";

    return agora.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function horaAgora() {
    if (!agora) return "Carregando hora...";

    return agora.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function horaBR(data: string) {
    return new Date(data).toLocaleTimeString("pt-BR", {
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

    const caixa = await verificarCaixaAberto();

    if (!caixa) {
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
        cash_register_id: caixa.id,
      })
      .select()
      .single();

    if (saleError) {
      alert(saleError.message);
      return;
    }

    alert("Venda finalizada com sucesso");

    setItens([]);

    router.push(`/cupom/${sale.id}`);
  }

  useEffect(() => {
    setAgora(new Date());
    carregar();

    const timer = setInterval(() => {
      setAgora(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const menu = [
  ["IN", "Início", "/"],
  ["MS", "Mesas", "/mesas"],
  ["PR", "Produtos", "/produtos"],
  ["CX", "Caixa", "/caixa"],
  ["RL", "Relatórios", "/relatorios"],
  ["HI", "Histórico", "/historico"],
  ["CF", "Configurações", "/configuracoes"],
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

  const produtosModalFiltrados = produtos
    .filter((produto) =>
      produto.name.toLowerCase().includes(buscaModalProdutos.toLowerCase())
    )
    .filter((produto) => {
      if (categoriaModalProdutos === "Todos") return true;

      return (produto.category || "Outros") === categoriaModalProdutos;
    });

  const nomeUsuario =
    usuario?.user_metadata?.name ||
    usuario?.email?.split("@")[0] ||
    "Administrador";

  const emailUsuario = usuario?.email || "admin@kafeteria.com";

  return (
    <main className="pdv-page">
      <div className="pdv-shell">
        <aside className="pdv-sidebar">
          <div
            className="pdv-brand"
            style={{
              justifyContent: "center",
              paddingTop: "4px",
              paddingBottom: "10px",
            }}
          >
            <div
              className="pdv-logo"
              style={{
                width: "172px",
                height: "172px",
                borderRadius: "38px",
                padding: "12px",
              }}
            >
              <LogoKafeteria />
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
              Sair do sistema
            </button>
          </div>
        </aside>

        <section className="pdv-main">
          <div className="pdv-grid">
            <div className="pdv-content">
              <header className="pdv-hero">
                <div>
                  <div className="pdv-hero-small">Bom dia, {nomeUsuario}!</div>

                  <h1 className="pdv-hero-title">
                    Bem-vindo à Kafeteria PDV
                  </h1>

                  <p className="pdv-hero-text">
                    Gerencie vendas, produtos e o seu negócio em um só lugar.
                  </p>
                </div>

                <div className="pdv-hero-info">
                  <div className="pdv-info-card">
                    <div className="pdv-info-label">{dataHoje()}</div>
                    <div className="pdv-info-muted">Agora · {horaAgora()}</div>
                  </div>

                  <div className="pdv-info-card">
                    <div className="pdv-info-label">
                      <span
                        style={{
                          display: "inline-block",
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: caixaAberto ? "#65f58e" : "#ef4444",
                          marginRight: 8,
                        }}
                      />
                      {caixaAberto ? "Caixa aberto" : "Caixa fechado"}
                    </div>

                    <div className="pdv-info-muted">
                      {caixaAberto?.opened_at
                        ? `Desde ${horaBR(caixaAberto.opened_at)}`
                        : "Abra o caixa para vender"}
                    </div>
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
                      <div className="pdv-stat-note">movimento do dia</div>
                    </div>

                    <div className="pdv-stat-icon">R$</div>
                  </div>
                </div>

                <div className="pdv-stat-card">
                  <div className="pdv-stat-top">
                    <div>
                      <div className="pdv-stat-label">Transações</div>
                      <div className="pdv-stat-value">{ultimas.length}</div>
                      <div className="pdv-stat-note">vendas recentes</div>
                    </div>

                    <div className="pdv-stat-icon">V</div>
                  </div>
                </div>

                <div className="pdv-stat-card">
                  <div className="pdv-stat-top">
                    <div>
                      <div className="pdv-stat-label">Produtos ativos</div>
                      <div className="pdv-stat-value">{dados.produtos}</div>
                      <div className="pdv-stat-note">
                        cadastrados no sistema
                      </div>
                    </div>

                    <div className="pdv-stat-icon">P</div>
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
                    <button
                      onClick={() => setModalProdutosAberto(true)}
                      className="pdv-product-card"
                    >
                      <div className="pdv-product-empty">
                        <div
                          style={{
                            width: 58,
                            height: 58,
                            opacity: 0.85,
                          }}
                        >
                          <LogoKafeteria />
                        </div>
                      </div>

                      <div className="pdv-product-body">
                        <div className="pdv-product-name">
                          Nenhum produto encontrado
                        </div>

                        <div className="pdv-product-bottom">
                          <span className="pdv-product-price">Produtos</span>
                          <span className="pdv-plus">+</span>
                        </div>
                      </div>
                    </button>
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
                          alt={produto.name}
                        />
                      ) : (
                        <div className="pdv-product-empty">
                          <div
                            style={{
                              width: 58,
                              height: 58,
                              opacity: 0.85,
                            }}
                          >
                            <LogoKafeteria />
                          </div>
                        </div>
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
                  <button
                    onClick={() => setModalProdutosAberto(true)}
                    className="pdv-more-link"
                    style={{
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Ver mais produtos
                  </button>
                </div>
              </section>
            </div>

            <aside>
              <section className="pdv-cart">
                <div className="pdv-cart-header">
                  <div className="pdv-cart-title">
                    <span>Carrinho</span>
                  </div>

                  <span className="pdv-pill">{quantidadeCarrinho} itens</span>
                </div>

                <div className="pdv-cart-body">
                  <div className="pdv-cart-items">
                    {itens.length === 0 && (
                      <div className="pdv-cart-empty">
                        <div
                          className="pdv-cart-empty-icon"
                          style={{
                            width: 72,
                            height: 72,
                            margin: "0 auto 10px",
                            opacity: 0.8,
                          }}
                        >
                          <LogoKafeteria />
                        </div>

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
                                  alt={item.produto.name}
                                />
                              ) : (
                                <LogoKafeteria />
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

                  <div className="pdv-note">Adicionar observação</div>

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
                    Finalizar venda
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
                    Ambiente seguro e criptografado
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>

      {modalProdutosAberto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-produtos-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setModalProdutosAberto(false)}
        >
          <section
            className="max-h-[88vh] w-full max-w-6xl overflow-hidden rounded-[28px] border border-[#dcebd8]/18 bg-[linear-gradient(135deg,#062518,#0b5a34_55%,#123b24)] text-[#fffdf2] shadow-2xl shadow-black/35"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#dcebd8]/62">
                  Venda rápida
                </p>

                <h2
                  id="modal-produtos-title"
                  className="mt-2 text-3xl font-black leading-tight"
                >
                  Todos os produtos
                </h2>
              </div>

              <button
                onClick={() => setModalProdutosAberto(false)}
                className="rounded-2xl border border-white/12 bg-white/10 px-5 py-3 text-sm font-black text-[#fffdf2] transition hover:bg-white/16"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 border-b border-white/10 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <input
                value={buscaModalProdutos}
                onChange={(event) => setBuscaModalProdutos(event.target.value)}
                placeholder="Buscar produto..."
                className="w-full rounded-2xl border border-white/12 bg-black/18 px-5 py-4 text-sm font-bold text-[#fffdf2] outline-none transition placeholder:text-[#dcebd8]/45 focus:border-[#65f58e]/45 focus:ring-4 focus:ring-[#65f58e]/10"
              />

              <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                {categorias.map((categoria) => (
                  <button
                    key={categoria}
                    onClick={() => setCategoriaModalProdutos(categoria)}
                    className={`shrink-0 rounded-full px-4 py-3 text-sm font-black transition ${
                      categoriaModalProdutos === categoria
                        ? "bg-[#0bff70] text-[#062518]"
                        : "bg-white/10 text-[#fffdf2] hover:bg-white/16"
                    }`}
                  >
                    {categoria}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[58vh] overflow-y-auto p-5 sm:p-6">
              {produtosModalFiltrados.length === 0 && (
                <div className="rounded-[24px] border border-white/10 bg-white/10 p-10 text-center">
                  <div
                    className="mx-auto mb-4 h-20 w-20 opacity-80"
                    aria-hidden="true"
                  >
                    <LogoKafeteria />
                  </div>

                  <h3 className="text-xl font-black">
                    Nenhum produto encontrado
                  </h3>

                  <p className="mt-2 text-sm font-bold text-[#dcebd8]/62">
                    Ajuste a busca ou escolha outra categoria.
                  </p>
                </div>
              )}

              {produtosModalFiltrados.length > 0 && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {produtosModalFiltrados.map((produto) => (
                    <article
                      key={produto.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => adicionar(produto)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          adicionar(produto);
                        }
                      }}
                      className="group overflow-hidden rounded-[22px] border border-white/10 bg-[#fffdf2] text-left text-[#123b24] shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/20"
                    >
                      {produto.image_url ? (
                        <img
                          src={produto.image_url}
                          className="pdv-product-image"
                          alt={produto.name}
                        />
                      ) : (
                        <div className="pdv-product-empty">
                          <div
                            style={{
                              width: 58,
                              height: 58,
                              opacity: 0.85,
                            }}
                          >
                            <LogoKafeteria />
                          </div>
                        </div>
                      )}

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-black leading-tight">
                              {produto.name}
                            </h3>

                            <p className="mt-2 text-sm font-black text-[#123b24]/55">
                              Estoque: {produto.stock}
                            </p>
                          </div>

                          <button
                            type="button"
                            aria-label={`Adicionar ${produto.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              adicionar(produto);
                            }}
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0b7d42] text-2xl font-black text-[#fffdf2] transition group-hover:bg-[#0b5a34]"
                          >
                            +
                          </button>
                        </div>

                        <div className="mt-4 text-xl font-black text-[#0b7d42]">
                          {dinheiro(produto.price)}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
