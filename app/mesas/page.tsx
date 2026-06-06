"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

export default function Mesas() {
  const [nome, setNome] = useState("");
  const [mesas, setMesas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("tables_open")
      .select("*")
      .eq("status", "open")
      .order("opened_at", {
        ascending: false,
      });

    if (error) {
      alert(error.message);
      setCarregando(false);
      return;
    }

    setMesas(data || []);
    setCarregando(false);
  }

  async function criar() {
    if (!nome.trim()) {
      alert("Digite um nome para a mesa");
      return;
    }

    const { error } = await supabase.from("tables_open").insert({
      name: nome.trim(),
      status: "open",
    });

    if (error) {
      alert(error.message);
      return;
    }

    setNome("");
    carregar();
  }

  async function cancelarMesa(id: string, nomeMesa: string) {
    const confirmar = confirm(
      `Cancelar ${nomeMesa}?\n\nEssa mesa será fechada sem registrar venda.`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("tables_open")
      .update({
        status: "cancelled",
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Mesa cancelada");
    carregar();
  }

  function hora(data: string) {
    return new Date(data).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function dataMesa(data: string) {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="pdv-page">
      <section className="pdv-main">
        <Header
          title="Mesas"
          subtitle="Controle de comandas abertas"
          backTo="/"
          backLabel="Ir para o início"
        />

        <section className="pdv-panel mb-5">
          <div className="pdv-panel-header">
            <div>
              <h2 className="pdv-panel-title">Abrir nova mesa</h2>
              <p className="pdv-panel-subtitle">
                Crie uma mesa ou comanda para iniciar o atendimento.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                width: "100%",
                maxWidth: 520,
              }}
            >
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Mesa 1"
                className="pdv-search"
                style={{
                  minWidth: 0,
                  flex: 1,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") criar();
                }}
              />

              <button
                onClick={criar}
                className="pdv-finish"
                style={{
                  width: "auto",
                  marginTop: 0,
                  paddingLeft: 26,
                  paddingRight: 26,
                  whiteSpace: "nowrap",
                }}
              >
                Criar
              </button>
            </div>
          </div>
        </section>

        <section className="pdv-stats mb-5">
          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Mesas abertas</div>
                <div className="pdv-stat-value">{mesas.length}</div>
                <div className="pdv-stat-note">em atendimento agora</div>
              </div>

              <div className="pdv-stat-icon">MS</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Status</div>
                <div className="pdv-stat-value">
                  {mesas.length > 0 ? "Ativo" : "Livre"}
                </div>
                <div className="pdv-stat-note">
                  {mesas.length > 0
                    ? "há comandas abertas"
                    : "nenhuma comanda aberta"}
                </div>
              </div>

              <div className="pdv-stat-icon">OK</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Ação rápida</div>
                <div className="pdv-stat-value">PDV</div>
                <div className="pdv-stat-note">toque para abrir comanda</div>
              </div>

              <div className="pdv-stat-icon">+</div>
            </div>
          </div>
        </section>

        {carregando && (
          <section className="pdv-panel">
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#123b24",
                fontWeight: 900,
              }}
            >
              Carregando mesas...
            </div>
          </section>
        )}

        {!carregando && mesas.length === 0 && (
          <section className="pdv-panel">
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
                  fontSize: 34,
                  fontWeight: 950,
                }}
              >
                MS
              </div>

              <h2 className="pdv-panel-title">Nenhuma mesa aberta</h2>

              <p className="pdv-panel-subtitle">
                Crie uma mesa ou comanda para começar o atendimento.
              </p>
            </div>
          </section>
        )}

        {!carregando && mesas.length > 0 && (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {mesas.map((mesa) => (
              <article key={mesa.id} className="pdv-product-card">
                <div
                  style={{
                    padding: 18,
                    background:
                      "linear-gradient(135deg, #0b5a34, #123b24)",
                    color: "#fffdf2",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 58,
                        height: 58,
                        borderRadius: 18,
                        background: "rgba(255,255,255,0.12)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 950,
                        fontSize: 20,
                      }}
                    >
                      MS
                    </div>

                    <div
                      style={{
                        borderRadius: 999,
                        background: "rgba(247,244,233,0.16)",
                        color: "#f7f4e9",
                        padding: "8px 12px",
                        fontSize: 12,
                        fontWeight: 950,
                      }}
                    >
                      Aberta
                    </div>
                  </div>

                  <h2
                    style={{
                      marginTop: 20,
                      fontSize: 28,
                      lineHeight: 1,
                      fontWeight: 950,
                      textTransform: "capitalize",
                    }}
                  >
                    {mesa.name}
                  </h2>

                  <p
                    style={{
                      marginTop: 8,
                      color: "rgba(246,255,240,0.68)",
                      fontWeight: 700,
                    }}
                  >
                    Comanda aberta
                  </p>
                </div>

                <div className="pdv-product-body">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        borderRadius: 14,
                        background: "#f8f6ea",
                        padding: 12,
                      }}
                    >
                      <div className="pdv-product-stock">Horário</div>
                      <div
                        style={{
                          marginTop: 4,
                          color: "#123b24",
                          fontWeight: 950,
                        }}
                      >
                        {hora(mesa.opened_at)}
                      </div>
                    </div>

                    <div
                      style={{
                        borderRadius: 14,
                        background: "#f8f6ea",
                        padding: 12,
                      }}
                    >
                      <div className="pdv-product-stock">Data</div>
                      <div
                        style={{
                          marginTop: 4,
                          color: "#123b24",
                          fontWeight: 950,
                          textTransform: "capitalize",
                        }}
                      >
                        {dataMesa(mesa.opened_at)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <Link
                      href={`/comanda/${mesa.id}`}
                      className="pdv-more-link"
                      style={{
                        justifyContent: "center",
                      }}
                    >
                      Abrir comanda
                    </Link>

                    <button
                      onClick={() => cancelarMesa(mesa.id, mesa.name)}
                      className="pdv-remove-btn"
                      style={{
                        width: "100%",
                        height: 44,
                        borderRadius: 14,
                      }}
                    >
                      Cancelar mesa
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}