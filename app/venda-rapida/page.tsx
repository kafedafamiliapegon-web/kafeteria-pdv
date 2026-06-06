"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

type ItemCarrinho = {
  produto: any;
  qty: number;
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

export default function VendaRapida() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<any[]>([]);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [pagamento, setPagamento] = useState("PIX");
  const [busca, setBusca] = useState("");
  const [categoriaAtual, setCategoriaAtual] = useState("Todos");
  const [carregando, setCarregando] = useState(true);
  const [caixaAberto, setCaixaAberto] = useState<any>(null);

  async function carregar() {
    setCarregando(true);

    const [products, cash] = await Promise.all([
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

    if (products.error) {
      alert(products.error.message);
      setCarregando(false);
      return;
    }

    setProdutos(products.data || []);
    setCaixaAberto(cash.data || null);
    setCarregando(false);
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

  function dinheiro(valor: any) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
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

  function limparCarrinho() {
    const confirmar = confirm("Limpar todos os itens do carrinho?");

    if (!confirmar) return;

    setItens([]);
  }

  const total = itens.reduce(
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
      alert("Adicione pelo menos um item");
      return;
    }

    const caixa = await verificarCaixaAberto();

    if (!caixa) {
      alert("O caixa está fechado. Abra o caixa antes de finalizar vendas.");
      router.push("/caixa");
      return;
    }

    const confirmar = confirm(
      `Finalizar venda rápida de ${dinheiro(total)} em ${pagamento}?`
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
        cash_register_id: caixa.id,
      })
      .select()
      .single();

    if (saleError) {
      alert(saleError.message);
      return;
    }

    alert("Venda rápida finalizada com sucesso");

    setItens([]);

    router.push(`/cupom/${sale.id}`);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="pdv-page">
      <section className="pdv-main">
        <Header
          title="Venda rápida"
          subtitle="Venda de balcão sem abrir mesa"
          backTo="/"
          backLabel="Ir para o início"
        />

        <section className="pdv-stats mb-5">
          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Produtos disponíveis</div>
                <div className="pdv-stat-value">{produtos.length}</div>
                <div className="pdv-stat-note">ativos para venda</div>
              </div>

              <div className="pdv-stat-icon">PR</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Itens no carrinho</div>
                <div className="pdv-stat-value">{quantidadeCarrinho}</div>
                <div className="pdv-stat-note">selecionados agora</div>
              </div>

              <div className="pdv-stat-icon">IT</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Caixa</div>
                <div className="pdv-stat-value">
                  {caixaAberto ? "Aberto" : "Fechado"}
                </div>
                <div className="pdv-stat-note">
                  {caixaAberto ? "pronto para vender" : "abra antes de vender"}
                </div>
              </div>

              <div className="pdv-stat-icon">CX</div>
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 420px",
            gap: 18,
            alignItems: "start",
          }}
        >
          <section className="pdv-panel">
            <div className="pdv-panel-header">
              <div>
                <h2 className="pdv-panel-title">Produtos</h2>
                <p className="pdv-panel-subtitle">
                  Clique no produto ou no botão + para adicionar ao carrinho.
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

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto..."
              className="pdv-search"
              style={{
                width: "100%",
                minWidth: 0,
                marginBottom: 16,
              }}
            />

            <div className="pdv-tabs">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaAtual(cat)}
                  className={`pdv-tab ${categoriaAtual === cat ? "active" : ""}`}
                >
                  {cat}
                </button>
              ))}
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
                Carregando produtos...
              </div>
            )}

            {!carregando && produtosFiltrados.length === 0 && (
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
                  PR
                </div>

                <h2 className="pdv-panel-title">Nenhum produto encontrado</h2>

                <p className="pdv-panel-subtitle">
                  Cadastre produtos ou ajuste a busca/categoria.
                </p>
              </div>
            )}

            {!carregando && produtosFiltrados.length > 0 && (
              <div className="pdv-products">
                {produtosFiltrados.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => adicionar(item)}
                    className="pdv-product-card"
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="pdv-product-image"
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
                      <div className="pdv-product-name">{item.name}</div>

                      <div className="pdv-product-stock">
                        {item.category || "Outros"} · Estoque: {item.stock}
                      </div>

                      <div className="pdv-product-bottom">
                        <span className="pdv-product-price">
                          {dinheiro(item.price)}
                        </span>

                        <span className="pdv-plus">+</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside
            className="pdv-cart"
            style={{
              position: "sticky",
              top: 18,
            }}
          >
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
                    <p>Adicione produtos pela lista ao lado.</p>
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

                            <span className="pdv-qty-number">{item.qty}</span>

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

                      <div className="pdv-cart-price">{dinheiro(subtotal)}</div>
                    </div>
                  );
                })}
              </div>

              {itens.length > 0 && (
                <button
                  onClick={limparCarrinho}
                  className="pdv-note"
                  style={{
                    width: "100%",
                    cursor: "pointer",
                    background: "rgba(246, 255, 240, 0.08)",
                  }}
                >
                  Limpar carrinho
                </button>
              )}

              <div className="pdv-totals">
                <div className="pdv-total-row">
                  <span>Subtotal</span>
                  <span>{dinheiro(total)}</span>
                </div>

                <div className="pdv-total-row">
                  <span>Desconto</span>
                  <span>R$ 0.00</span>
                </div>

                <div className="pdv-total-final">
                  <strong>Total</strong>
                  <span>{dinheiro(total)}</span>
                </div>
              </div>

              <div className="pdv-payment-row">
                {["PIX", "Cartão", "Dinheiro"].map((tipo) => (
                  <button
                    key={tipo}
                    onClick={() => setPagamento(tipo)}
                    className={`pdv-payment ${pagamento === tipo ? "active" : ""}`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>

              <button onClick={finalizarVenda} className="pdv-finish">
                Finalizar venda
              </button>

              <div className="pdv-safe">Ambiente seguro e sincronizado</div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}