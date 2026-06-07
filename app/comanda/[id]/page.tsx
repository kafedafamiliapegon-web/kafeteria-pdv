"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../../components/Header";
import { supabase } from "../../../lib/supabase";

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

export default function Comanda() {
  const { id } = useParams();
  const router = useRouter();
  const mesaId = Array.isArray(id) ? id[0] : id;

  const [mesa, setMesa] = useState<any>(null);
  const [pedidoAberto, setPedidoAberto] = useState<any>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [pagamento, setPagamento] = useState("PIX");
  const [busca, setBusca] = useState("");
  const [categoriaAtual, setCategoriaAtual] = useState("Todos");
  const [carregando, setCarregando] = useState(true);
  const [caixaAberto, setCaixaAberto] = useState<any>(null);

  async function carregar() {
    setCarregando(true);

    const [mesaResponse, productsResponse, cashResponse, orderResponse] =
      await Promise.all([
        supabase.from("tables_open").select("*").eq("id", mesaId).single(),

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

        supabase
          .from("orders")
          .select(
            `
            *,
            order_items (
              id,
              product_id,
              qty,
              price,
              products (
                *
              )
            )
          `
          )
          .eq("table_id", mesaId)
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (mesaResponse.error) {
      alert("Erro ao carregar mesa: " + mesaResponse.error.message);
      setCarregando(false);
      return;
    }

    if (productsResponse.error) {
      alert("Erro ao carregar produtos: " + productsResponse.error.message);
      setCarregando(false);
      return;
    }

    if (orderResponse.error) {
      alert("Erro ao carregar comanda: " + orderResponse.error.message);
      setCarregando(false);
      return;
    }

    setMesa(mesaResponse.data);
    setProdutos(productsResponse.data || []);
    setCaixaAberto(cashResponse.data || null);
    setPedidoAberto(orderResponse.data || null);
    setItens(itensDoPedido(orderResponse.data));
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

  function horaBR(data: string | null) {
    if (!data) return "—";

    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function itensDoPedido(pedido: any): ItemCarrinho[] {
    const itensPedido = pedido?.order_items || [];

    return itensPedido
      .filter((item: any) => item.products)
      .map((item: any) => ({
        produto: {
          ...item.products,
          id: item.product_id || item.products.id,
          price: Number(item.price ?? item.products.price ?? 0),
        },
        qty: Number(item.qty || 0),
      }))
      .filter((item: ItemCarrinho) => item.qty > 0);
  }

  function totalDosItens(lista: ItemCarrinho[]) {
    return lista.reduce(
      (soma, item) => soma + Number(item.produto.price || 0) * item.qty,
      0
    );
  }

  async function atualizarResumoPedido(orderId: string, lista: ItemCarrinho[]) {
    const totalPedido = totalDosItens(lista);

    const { error } = await supabase
      .from("orders")
      .update({
        subtotal: totalPedido,
        discount: 0,
        total: totalPedido,
      })
      .eq("id", orderId);

    if (error) {
      alert("Erro ao atualizar total da comanda: " + error.message);
      return false;
    }

    return true;
  }

  async function buscarPedidoAberto() {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          id,
          product_id,
          qty,
          price,
          products (
            *
          )
        )
      `
      )
      .eq("table_id", mesaId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      alert("Erro ao buscar comanda aberta: " + error.message);
      return null;
    }

    return data || null;
  }

  async function obterOuCriarPedidoAberto() {
    if (pedidoAberto) return pedidoAberto;

    const existente = await buscarPedidoAberto();

    if (existente) {
      setPedidoAberto(existente);
      setItens(itensDoPedido(existente));
      return existente;
    }

    const { data, error } = await supabase
      .from("orders")
      .insert({
        table_id: mesaId,
        status: "open",
        subtotal: 0,
        discount: 0,
        total: 0,
      })
      .select()
      .single();

    if (error) {
      alert("Erro ao criar comanda no banco: " + error.message);
      return null;
    }

    setPedidoAberto(data);
    return data;
  }

  async function adicionar(produto: any) {
    if (Number(produto.stock) <= 0) {
      alert("Produto sem estoque");
      return;
    }

    const pedido = await obterOuCriarPedidoAberto();

    if (!pedido) return;

    const existente = itens.find((item) => item.produto.id === produto.id);

    if (existente && existente.qty >= Number(produto.stock)) {
      alert("Estoque insuficiente");
      return;
    }

    const novaQuantidade = existente ? existente.qty + 1 : 1;

    if (existente) {
      const { error } = await supabase
        .from("order_items")
        .update({
          qty: novaQuantidade,
          price: Number(produto.price),
        })
        .eq("order_id", pedido.id)
        .eq("product_id", produto.id);

      if (error) {
        alert("Erro ao atualizar item da comanda: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("order_items").insert({
        order_id: pedido.id,
        product_id: produto.id,
        qty: novaQuantidade,
        price: Number(produto.price),
      });

      if (error) {
        alert("Erro ao salvar item na comanda: " + error.message);
        return;
      }
    }

    const proximosItens = existente
      ? itens.map((item) =>
          item.produto.id === produto.id
            ? {
                ...item,
                qty: novaQuantidade,
              }
            : item
        )
      : [
          ...itens,
          {
            produto,
            qty: novaQuantidade,
          },
        ];

    const resumoOk = await atualizarResumoPedido(pedido.id, proximosItens);

    if (!resumoOk) return;

    setItens(proximosItens);
  }

  async function diminuir(produtoId: string) {
    const itemAtual = itens.find((item) => item.produto.id === produtoId);

    if (!itemAtual || !pedidoAberto) return;

    const novaQuantidade = itemAtual.qty - 1;

    if (novaQuantidade <= 0) {
      await remover(produtoId);
      return;
    }

    const { error } = await supabase
      .from("order_items")
      .update({
        qty: novaQuantidade,
        price: Number(itemAtual.produto.price),
      })
      .eq("order_id", pedidoAberto.id)
      .eq("product_id", produtoId);

    if (error) {
      alert("Erro ao diminuir item da comanda: " + error.message);
      return;
    }

    const proximosItens = itens.map((item) =>
      item.produto.id === produtoId
        ? {
            ...item,
            qty: novaQuantidade,
          }
        : item
    );

    const resumoOk = await atualizarResumoPedido(pedidoAberto.id, proximosItens);

    if (!resumoOk) return;

    setItens(proximosItens);
  }

  async function remover(produtoId: string) {
    if (!pedidoAberto) return;

    const { error } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", pedidoAberto.id)
      .eq("product_id", produtoId);

    if (error) {
      alert("Erro ao remover item da comanda: " + error.message);
      return;
    }

    const proximosItens = itens.filter((item) => item.produto.id !== produtoId);
    const resumoOk = await atualizarResumoPedido(pedidoAberto.id, proximosItens);

    if (!resumoOk) return;

    setItens(proximosItens);
  }

  async function limparPedido() {
    const confirmar = confirm("Limpar todos os itens desta comanda?");

    if (!confirmar) return;

    if (!pedidoAberto) {
      setItens([]);
      return;
    }

    const { error } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", pedidoAberto.id);

    if (error) {
      alert("Erro ao limpar comanda: " + error.message);
      return;
    }

    const resumoOk = await atualizarResumoPedido(pedidoAberto.id, []);

    if (!resumoOk) return;

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
    const pedido = await buscarPedidoAberto();
    const itensVenda = itensDoPedido(pedido);
    const totalVenda = totalDosItens(itensVenda);

    if (!pedido || itensVenda.length === 0) {
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
      `Finalizar venda de ${dinheiro(totalVenda)} em ${pagamento}?`
    );

    if (!confirmar) return;

    for (const item of itensVenda) {
      if (item.qty > Number(item.produto.stock || 0)) {
        alert(`Estoque insuficiente para ${item.produto.name}`);
        return;
      }
    }

    for (const item of itensVenda) {
      const novoEstoque = Number(item.produto.stock) - item.qty;

      const { error: stockError } = await supabase
        .from("products")
        .update({
          stock: novoEstoque,
        })
        .eq("id", item.produto.id);

      if (stockError) {
        alert("Erro ao baixar estoque: " + stockError.message);
        return;
      }
    }

    const { error: orderError } = await supabase
      .from("orders")
      .update({
        status: "closed",
        subtotal: totalVenda,
        discount: 0,
        total: totalVenda,
      })
      .eq("id", pedido.id);

    if (orderError) {
      alert("Erro ao fechar comanda: " + orderError.message);
      return;
    }

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        payment_method: pagamento,
        total: totalVenda,
        order_id: pedido.id,
        cash_register_id: caixa.id,
      })
      .select()
      .single();

    if (saleError) {
      alert("Erro ao registrar venda: " + saleError.message);
      return;
    }

    const { error: tableError } = await supabase
      .from("tables_open")
      .update({
        status: "closed",
      })
      .eq("id", mesaId);

    if (tableError) {
      alert("Erro ao fechar mesa: " + tableError.message);
      return;
    }

    alert("Venda finalizada com sucesso");

    setItens([]);
    setPedidoAberto(null);

    router.push(`/cupom/${sale.id}`);
  }

  useEffect(() => {
    if (mesaId) carregar();
  }, [mesaId]);

  return (
    <main className="pdv-page">
      <section className="pdv-main">
        <Header
          title={mesa?.name || "Comanda"}
          subtitle="Atendimento por mesa"
          backTo="/mesas"
          backLabel="Voltar para mesas"
        />

        <section className="pdv-stats mb-5">
          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Mesa</div>
                <div
                  className="pdv-stat-value"
                  style={{
                    fontSize: 28,
                    lineHeight: 1.05,
                    textTransform: "capitalize",
                  }}
                >
                  {mesa?.name || "Carregando"}
                </div>
                <div className="pdv-stat-note">
                  {mesa?.opened_at
                    ? `aberta às ${horaBR(mesa.opened_at)}`
                    : "comanda em aberto"}
                </div>
              </div>

              <div className="pdv-stat-icon">MS</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Itens no pedido</div>
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
                  Busque ou filtre por categoria para adicionar ao pedido.
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
                <span>Pedido</span>
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

                    <strong>Pedido vazio</strong>
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
                  onClick={limparPedido}
                  className="pdv-note"
                  style={{
                    width: "100%",
                    cursor: "pointer",
                    background: "rgba(246, 255, 240, 0.08)",
                  }}
                >
                  Limpar pedido
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

              <div className="pdv-safe">Mesa sincronizada com o caixa</div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}