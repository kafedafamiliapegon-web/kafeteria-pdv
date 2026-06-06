"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

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

export default function Configuracoes() {
  const [id, setId] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState("Kafeteria");
  const [telefone, setTelefone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [endereco, setEndereco] = useState("");
  const [rodape, setRodape] = useState("Obrigado pela preferência");
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      alert(error.message);
      setCarregando(false);
      return;
    }

    if (data) {
      setId(data.id);
      setEmpresa(data.company_name || "Kafeteria");
      setTelefone(data.phone || "");
      setInstagram(data.instagram || "");
      setEndereco(data.address || "");

      if (data.receipt_footer) {
        setRodape(data.receipt_footer);
      }
    }

    setCarregando(false);
  }

  async function salvar() {
    const dados: any = {
      company_name: empresa.trim(),
      phone: telefone.trim(),
      instagram: instagram.trim(),
      address: endereco.trim(),
      receipt_footer: rodape.trim(),
    };

    if (id) {
      const { error } = await supabase
        .from("company_settings")
        .update(dados)
        .eq("id", id);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("company_settings").insert(dados);

      if (error) {
        alert(error.message);
        return;
      }
    }

    alert("Configurações salvas com sucesso");
    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="pdv-page">
      <section className="pdv-main">
        <Header
          title="Configurações"
          subtitle="Dados da empresa e comprovante"
          backTo="/"
          backLabel="Ir para o início"
        />

        <section className="pdv-stats mb-5">
          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Empresa</div>
                <div
                  className="pdv-stat-value"
                  style={{
                    fontSize: 25,
                    lineHeight: 1.05,
                  }}
                >
                  {empresa || "Kafeteria"}
                </div>
                <div className="pdv-stat-note">nome no comprovante</div>
              </div>

              <div className="pdv-stat-icon">CF</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Contato</div>
                <div
                  className="pdv-stat-value"
                  style={{
                    fontSize: telefone ? 24 : 29,
                  }}
                >
                  {telefone || "Vazio"}
                </div>
                <div className="pdv-stat-note">telefone da cafeteria</div>
              </div>

              <div className="pdv-stat-icon">CT</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Instagram</div>
                <div
                  className="pdv-stat-value"
                  style={{
                    fontSize: instagram ? 24 : 29,
                    lineHeight: 1.05,
                  }}
                >
                  {instagram || "Vazio"}
                </div>
                <div className="pdv-stat-note">rede social no cupom</div>
              </div>

              <div className="pdv-stat-icon">IG</div>
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
                <h2 className="pdv-panel-title">Dados da empresa</h2>
                <p className="pdv-panel-subtitle">
                  Essas informações aparecem no sistema e podem ser usadas no
                  comprovante.
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
                Carregando configurações...
              </div>
            )}

            {!carregando && (
              <div style={{ display: "grid", gap: 14 }}>
                <input
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Nome da empresa"
                  className="pdv-search"
                  style={{ width: "100%", minWidth: 0 }}
                />

                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Telefone"
                  className="pdv-search"
                  style={{ width: "100%", minWidth: 0 }}
                />

                <input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="Instagram"
                  className="pdv-search"
                  style={{ width: "100%", minWidth: 0 }}
                />

                <textarea
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Endereço"
                  className="pdv-search"
                  style={{
                    width: "100%",
                    minWidth: 0,
                    minHeight: 96,
                    resize: "vertical",
                  }}
                />

                <textarea
                  value={rodape}
                  onChange={(e) => setRodape(e.target.value)}
                  placeholder="Rodapé do comprovante"
                  className="pdv-search"
                  style={{
                    width: "100%",
                    minWidth: 0,
                    minHeight: 96,
                    resize: "vertical",
                  }}
                />

                <button onClick={salvar} className="pdv-finish">
                  Salvar configurações
                </button>
              </div>
            )}
          </section>

          <aside className="pdv-panel">
            <div className="pdv-panel-header">
              <div>
                <h2 className="pdv-panel-title">Prévia</h2>
                <p className="pdv-panel-subtitle">
                  Simulação visual do comprovante.
                </p>
              </div>
            </div>

            <div
              style={{
                borderRadius: 24,
                background: "#ffffff",
                color: "#123b24",
                padding: 24,
                textAlign: "center",
                boxShadow: "0 18px 36px rgba(38, 65, 39, 0.12)",
              }}
            >
              <div
                style={{
                  width: 112,
                  height: 112,
                  margin: "0 auto",
                  borderRadius: 28,
                  background:
                    "linear-gradient(135deg, rgba(11,90,52,0.08), rgba(220,235,216,0.72))",
                  padding: 10,
                }}
              >
                <LogoKafeteria />
              </div>

              <h3
                style={{
                  marginTop: 16,
                  fontSize: 26,
                  fontWeight: 950,
                  lineHeight: 1,
                }}
              >
                {empresa || "Kafeteria"}
              </h3>

              {telefone && (
                <p
                  style={{
                    marginTop: 10,
                    fontWeight: 800,
                    color: "rgba(18,59,36,0.72)",
                  }}
                >
                  {telefone}
                </p>
              )}

              {instagram && (
                <p
                  style={{
                    marginTop: 4,
                    fontWeight: 800,
                    color: "rgba(18,59,36,0.72)",
                  }}
                >
                  {instagram}
                </p>
              )}

              {endereco && (
                <p
                  style={{
                    marginTop: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    color: "rgba(18,59,36,0.58)",
                    lineHeight: 1.35,
                  }}
                >
                  {endereco}
                </p>
              )}

              <div
                style={{
                  margin: "22px 0",
                  borderTop: "1px dashed rgba(18,59,36,0.28)",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  textAlign: "left",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Subtotal</span>
                  <span>R$ 0.00</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Pagamento</span>
                  <span>PIX</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 17,
                    fontWeight: 950,
                    color: "#0b7d42",
                  }}
                >
                  <span>Total</span>
                  <span>R$ 0.00</span>
                </div>
              </div>

              <div
                style={{
                  margin: "22px 0",
                  borderTop: "1px dashed rgba(18,59,36,0.28)",
                }}
              />

              <p
                style={{
                  fontSize: 13,
                  color: "rgba(18,59,36,0.68)",
                  fontWeight: 800,
                }}
              >
                {rodape || "Obrigado pela preferência"}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}