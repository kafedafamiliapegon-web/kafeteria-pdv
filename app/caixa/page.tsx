"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

export default function Caixa() {
  const [caixa, setCaixa] = useState<any>(null);
  const [valorInicial, setValorInicial] = useState("");
  const [vendas, setVendas] = useState<any[]>([]);
  const [historicoCaixas, setHistoricoCaixas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [resumo, setResumo] = useState({
    pix: 0,
    cartao: 0,
    dinheiro: 0,
    vendas: 0,
    total: 0,
    totalComInicial: 0,
  });

  function numero(valor: string) {
    return Number(valor.replace(",", "."));
  }

  function dinheiro(valor: any) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  function dataBR(data: string | null) {
    if (!data) return "—";

    return new Date(data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function horaBR(data: string | null) {
    if (!data) return "—";

    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function carregarHistoricoCaixas() {
    const { data } = await supabase
      .from("cash_registers")
      .select("*")
      .order("opened_at", { ascending: false })
      .limit(10);

    setHistoricoCaixas(data || []);
  }

  async function carregar() {
    setCarregando(true);

    const { data: caixaAberto, error: caixaError } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("status", "open")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (caixaError) {
      alert(caixaError.message);
      setCarregando(false);
      return;
    }

    setCaixa(caixaAberto);

    await carregarHistoricoCaixas();

    if (!caixaAberto) {
      setVendas([]);
      setResumo({
        pix: 0,
        cartao: 0,
        dinheiro: 0,
        vendas: 0,
        total: 0,
        totalComInicial: 0,
      });

      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("cash_register_id", caixaAberto.id)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setCarregando(false);
      return;
    }

    const lista = data || [];

    setVendas(lista);

    let pix = 0;
    let cartao = 0;
    let dinheiroTotal = 0;

    lista.forEach((venda) => {
      const valor = Number(venda.total || 0);

      if (venda.payment_method === "PIX") pix += valor;
      if (venda.payment_method === "Cartão") cartao += valor;
      if (venda.payment_method === "Dinheiro") dinheiroTotal += valor;
    });

    const total = pix + cartao + dinheiroTotal;
    const inicial = Number(caixaAberto.opening_amount || 0);

    setResumo({
      pix,
      cartao,
      dinheiro: dinheiroTotal,
      vendas: lista.length,
      total,
      totalComInicial: total + inicial,
    });

    setCarregando(false);
  }

  async function abrirCaixa() {
    if (!valorInicial.trim()) {
      alert("Digite o valor inicial do caixa");
      return;
    }

    const { error } = await supabase.from("cash_registers").insert({
      opening_amount: numero(valorInicial),
      status: "open",
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Caixa aberto com sucesso");

    setValorInicial("");
    carregar();
  }

  async function fecharCaixa() {
    if (!caixa) return;

    const confirmar = confirm(
      `Fechar caixa?\n\nVendas: ${dinheiro(
        resumo.total
      )}\nTotal com valor inicial: ${dinheiro(resumo.totalComInicial)}`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("cash_registers")
      .update({
        status: "closed",
        closing_amount: resumo.totalComInicial,
        closed_at: new Date().toISOString(),
      })
      .eq("id", caixa.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Caixa fechado com sucesso");

    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="pdv-page">
      <section className="pdv-main">
        <Header
          title="Caixa"
          subtitle="Abertura, fechamento e controle financeiro"
          backTo="/"
          backLabel="Ir para o início"
        />

        <section className="pdv-stats mb-5">
          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Status do caixa</div>
                <div className="pdv-stat-value">
                  {caixa ? "Aberto" : "Fechado"}
                </div>
                <div className="pdv-stat-note">
                  {caixa
                    ? `desde ${horaBR(caixa.opened_at)}`
                    : "abra o caixa para vender"}
                </div>
              </div>

              <div className="pdv-stat-icon">CX</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Vendas no caixa</div>
                <div className="pdv-stat-value">{resumo.vendas}</div>
                <div className="pdv-stat-note">transações registradas</div>
              </div>

              <div className="pdv-stat-icon">VD</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Total atual</div>
                <div className="pdv-stat-value">{dinheiro(resumo.total)}</div>
                <div className="pdv-stat-note">somente vendas</div>
              </div>

              <div className="pdv-stat-icon">R$</div>
            </div>
          </div>
        </section>

        <section className="pdv-panel mb-5">
          <div className="pdv-panel-header">
            <div>
              <h2 className="pdv-panel-title">
                {caixa ? "Caixa em operação" : "Abrir caixa"}
              </h2>

              <p className="pdv-panel-subtitle">
                {caixa
                  ? "Acompanhe as vendas do caixa atual e finalize o fechamento quando necessário."
                  : "Informe o valor inicial em dinheiro para começar o atendimento."}
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

          {!caixa && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 12,
                alignItems: "center",
              }}
            >
              <input
                value={valorInicial}
                onChange={(e) => setValorInicial(e.target.value)}
                placeholder="Valor inicial. Ex: 100,00"
                className="pdv-search"
                style={{
                  width: "100%",
                  minWidth: 0,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") abrirCaixa();
                }}
              />

              <button
                onClick={abrirCaixa}
                className="pdv-finish"
                style={{
                  width: "auto",
                  marginTop: 0,
                  paddingLeft: 30,
                  paddingRight: 30,
                  whiteSpace: "nowrap",
                }}
              >
                Abrir caixa
              </button>
            </div>
          )}

          {caixa && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 16,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  borderRadius: 18,
                  background:
                    "linear-gradient(135deg, rgba(11,90,52,0.12), rgba(255,255,255,0.62))",
                  padding: 18,
                  color: "#123b24",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    color: "rgba(18,59,36,0.62)",
                  }}
                >
                  Caixa aberto
                </div>

                <div
                  style={{
                    marginTop: 6,
                    fontSize: 28,
                    fontWeight: 950,
                  }}
                >
                  Total com inicial: {dinheiro(resumo.totalComInicial)}
                </div>

                <div
                  style={{
                    marginTop: 6,
                    color: "rgba(18,59,36,0.62)",
                    fontWeight: 750,
                  }}
                >
                  Aberto em {dataBR(caixa.opened_at)}
                </div>
              </div>

              <button
                onClick={fecharCaixa}
                className="pdv-remove-btn"
                style={{
                  height: 56,
                  borderRadius: 16,
                  paddingLeft: 28,
                  paddingRight: 28,
                  fontSize: 15,
                }}
              >
                Fechar caixa
              </button>
            </div>
          )}
        </section>

        {carregando && (
          <section className="pdv-panel">
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#123b24",
                fontWeight: 950,
              }}
            >
              Carregando caixa...
            </div>
          </section>
        )}

        {!carregando && caixa && (
          <>
            <section className="pdv-stats mb-5">
              <div className="pdv-stat-card">
                <div className="pdv-stat-top">
                  <div>
                    <div className="pdv-stat-label">Valor inicial</div>
                    <div className="pdv-stat-value">
                      {dinheiro(caixa.opening_amount)}
                    </div>
                    <div className="pdv-stat-note">troco inicial</div>
                  </div>

                  <div className="pdv-stat-icon">IN</div>
                </div>
              </div>

              <div className="pdv-stat-card">
                <div className="pdv-stat-top">
                  <div>
                    <div className="pdv-stat-label">Total vendas</div>
                    <div className="pdv-stat-value">
                      {dinheiro(resumo.total)}
                    </div>
                    <div className="pdv-stat-note">PIX + cartão + dinheiro</div>
                  </div>

                  <div className="pdv-stat-icon">TV</div>
                </div>
              </div>

              <div className="pdv-stat-card">
                <div className="pdv-stat-top">
                  <div>
                    <div className="pdv-stat-label">Total final</div>
                    <div className="pdv-stat-value">
                      {dinheiro(resumo.totalComInicial)}
                    </div>
                    <div className="pdv-stat-note">vendas + valor inicial</div>
                  </div>

                  <div className="pdv-stat-icon">TF</div>
                </div>
              </div>
            </section>

            <section className="pdv-stats mb-5">
              <div className="pdv-stat-card">
                <div className="pdv-stat-top">
                  <div>
                    <div className="pdv-stat-label">PIX</div>
                    <div className="pdv-stat-value">{dinheiro(resumo.pix)}</div>
                    <div className="pdv-stat-note">recebido via PIX</div>
                  </div>

                  <div className="pdv-stat-icon">PX</div>
                </div>
              </div>

              <div className="pdv-stat-card">
                <div className="pdv-stat-top">
                  <div>
                    <div className="pdv-stat-label">Cartão</div>
                    <div className="pdv-stat-value">
                      {dinheiro(resumo.cartao)}
                    </div>
                    <div className="pdv-stat-note">crédito ou débito</div>
                  </div>

                  <div className="pdv-stat-icon">CT</div>
                </div>
              </div>

              <div className="pdv-stat-card">
                <div className="pdv-stat-top">
                  <div>
                    <div className="pdv-stat-label">Dinheiro</div>
                    <div className="pdv-stat-value">
                      {dinheiro(resumo.dinheiro)}
                    </div>
                    <div className="pdv-stat-note">pagamentos em espécie</div>
                  </div>

                  <div className="pdv-stat-icon">DN</div>
                </div>
              </div>
            </section>

            <section className="pdv-panel mb-5">
              <div className="pdv-panel-header">
                <div>
                  <h2 className="pdv-panel-title">Vendas do caixa</h2>
                  <p className="pdv-panel-subtitle">
                    Lista de vendas registradas no caixa aberto.
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
                  {vendas.length} venda(s)
                </span>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {vendas.length === 0 && (
                  <div
                    style={{
                      padding: 36,
                      textAlign: "center",
                      color: "rgba(18,59,36,0.62)",
                      fontWeight: 850,
                    }}
                  >
                    Nenhuma venda neste caixa ainda.
                  </div>
                )}

                {vendas.map((venda) => (
                  <article
                    key={venda.id}
                    className="pdv-product-card"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) auto",
                      gap: 14,
                      alignItems: "center",
                      padding: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: "#123b24",
                          fontWeight: 950,
                          fontSize: 17,
                        }}
                      >
                        {venda.payment_method}
                      </div>

                      <div className="pdv-product-stock">
                        {dataBR(venda.created_at)}
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
                      {dinheiro(venda.total)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        <section className="pdv-panel">
          <div className="pdv-panel-header">
            <div>
              <h2 className="pdv-panel-title">Histórico de caixas</h2>
              <p className="pdv-panel-subtitle">
                Últimos caixas abertos ou fechados no sistema.
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
              {historicoCaixas.length} registro(s)
            </span>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {historicoCaixas.length === 0 && (
              <div
                style={{
                  padding: 36,
                  textAlign: "center",
                  color: "rgba(18,59,36,0.62)",
                  fontWeight: 850,
                }}
              >
                Nenhum caixa registrado ainda.
              </div>
            )}

            {historicoCaixas.map((item) => (
              <article
                key={item.id}
                className="pdv-product-card"
                style={{
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    gap: 14,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        borderRadius: 999,
                        background:
                          item.status === "open"
                            ? "rgba(11, 125, 66, 0.1)"
                            : "rgba(18, 59, 36, 0.08)",
                        color: "#123b24",
                        padding: "8px 12px",
                        fontWeight: 950,
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: 999,
                          background:
                            item.status === "open" ? "#0b7d42" : "#9ca3af",
                        }}
                      />

                      {item.status === "open" ? "Caixa aberto" : "Caixa fechado"}
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        display: "grid",
                        gap: 4,
                      }}
                    >
                      <div className="pdv-product-stock">
                        Aberto: {dataBR(item.opened_at)}
                      </div>

                      <div className="pdv-product-stock">
                        Fechado: {dataBR(item.closed_at)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      color: "#123b24",
                      fontWeight: 850,
                    }}
                  >
                    <div>Inicial: {dinheiro(item.opening_amount)}</div>

                    <div
                      style={{
                        marginTop: 4,
                        color: "#0b7d42",
                        fontWeight: 950,
                      }}
                    >
                      Final:{" "}
                      {item.closing_amount ? dinheiro(item.closing_amount) : "—"}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}