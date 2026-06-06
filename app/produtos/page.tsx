"use client";

import { type ChangeEvent, useEffect, useState } from "react";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;
const TIPOS_IMAGEM_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];

function gerarNomeSeguroArquivo(file: File) {
  const extensao = file.name.split(".").pop()?.toLowerCase() || "png";

  const nomeBase = file.name
    .replace(/\.[^/.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `produto-${Date.now()}-${nomeBase || "imagem"}.${extensao}`;
}

function validarImagem(file: File) {
  if (!TIPOS_IMAGEM_PERMITIDOS.includes(file.type)) {
    return "Imagem invalida. Envie apenas arquivos PNG, JPG/JPEG ou WebP.";
  }

  if (file.size > TAMANHO_MAXIMO_IMAGEM) {
    return "Imagem muito grande. Envie uma imagem de ate 5MB.";
  }

  return "";
}

const categorias = ["Cafés", "Bebidas", "Salgados", "Doces", "Outros"];

export default function Produtos() {
  const [lista, setLista] = useState<any[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Outros");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [minimo, setMinimo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  async function carregar() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setCarregando(false);
      return;
    }

    setLista(data || []);
    setCarregando(false);
  }

  function precoNumero(valor: string) {
    return Number(valor.replace(",", "."));
  }

  function dinheiro(valor: any) {
    return `R$ ${Number(valor || 0).toFixed(2)}`;
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setCategoria("Outros");
    setPreco("");
    setEstoque("");
    setDescricao("");
    setMinimo("");
    setArquivo(null);
  }

  function editarProduto(item: any) {
    setEditandoId(item.id);
    setNome(item.name || "");
    setCategoria(item.category || "Outros");
    setDescricao(item.description || "");
    setPreco(String(item.price || ""));
    setEstoque(String(item.stock || ""));
    setMinimo(String(item.minimum_stock || ""));
    setArquivo(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function selecionarImagem(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setArquivo(null);
      return;
    }

    const erroImagem = validarImagem(file);

    if (erroImagem) {
      alert(erroImagem);
      setArquivo(null);
      event.currentTarget.value = "";
      return;
    }

    setArquivo(file);
  }

  async function salvar() {
    if (!nome.trim()) {
      alert("Digite o nome do produto");
      return;
    }

    if (!preco.trim()) {
      alert("Digite o preço");
      return;
    }

    if (!estoque.trim()) {
      alert("Digite o estoque");
      return;
    }

    let imageUrl = null;

    if (arquivo) {
      const erroImagem = validarImagem(arquivo);

      if (erroImagem) {
        alert(erroImagem);
        return;
      }

      const nomeArquivo = gerarNomeSeguroArquivo(arquivo);

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(nomeArquivo, arquivo);

      if (uploadError) {
        alert(
          "Erro ao enviar imagem para o Supabase Storage: " +
            uploadError.message
        );
        return;
      }

      const { data } = supabase.storage
        .from("products")
        .getPublicUrl(nomeArquivo);

      imageUrl = data.publicUrl;
    }

    const dadosProduto: any = {
      name: nome.trim(),
      category: categoria,
      description: descricao.trim(),
      price: precoNumero(preco),
      stock: Number(estoque),
      minimum_stock: Number(minimo || 0),
      active: true,
    };

    if (imageUrl) {
      dadosProduto.image_url = imageUrl;
    }

    if (editandoId) {
      const { error } = await supabase
        .from("products")
        .update(dadosProduto)
        .eq("id", editandoId);

      if (error) {
        alert("Erro ao salvar produto no banco: " + error.message);
        return;
      }

      alert("Produto atualizado");
    } else {
      const { error } = await supabase.from("products").insert({
        ...dadosProduto,
        image_url: imageUrl,
      });

      if (error) {
        alert("Erro ao salvar produto no banco: " + error.message);
        return;
      }

      alert("Produto salvo");
    }

    limparFormulario();
    carregar();
  }

  async function desativarProduto(id: string, nomeProduto: string) {
    const confirmar = confirm(
      `Tem certeza que deseja desativar "${nomeProduto}"?\n\nEle não aparecerá mais nas vendas, mas o histórico continuará salvo.`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("products")
      .update({ active: false })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Produto desativado");

    if (editandoId === id) {
      limparFormulario();
    }

    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  const estoqueBaixo = lista.filter(
    (item) => Number(item.stock) <= Number(item.minimum_stock || 0)
  );

  return (
    <main className="pdv-page">
      <section className="pdv-main">
        <Header
          title="Produtos"
          subtitle="Cadastro e controle de estoque"
          backTo="/"
          backLabel="Ir para o início"
        />

        <section className="pdv-stats mb-5">
          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Produtos ativos</div>
                <div className="pdv-stat-value">{lista.length}</div>
                <div className="pdv-stat-note">cadastrados no sistema</div>
              </div>

              <div className="pdv-stat-icon">PR</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Estoque baixo</div>
                <div className="pdv-stat-value">{estoqueBaixo.length}</div>
                <div className="pdv-stat-note">
                  {estoqueBaixo.length > 0
                    ? "precisa de atenção"
                    : "tudo em ordem"}
                </div>
              </div>

              <div className="pdv-stat-icon">ES</div>
            </div>
          </div>

          <div className="pdv-stat-card">
            <div className="pdv-stat-top">
              <div>
                <div className="pdv-stat-label">Modo</div>
                <div className="pdv-stat-value">
                  {editandoId ? "Edição" : "Novo"}
                </div>
                <div className="pdv-stat-note">
                  {editandoId ? "alterando produto" : "cadastro rápido"}
                </div>
              </div>

              <div className="pdv-stat-icon">{editandoId ? "ED" : "+"}</div>
            </div>
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "420px minmax(0, 1fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <section className="pdv-panel">
            <div className="pdv-panel-header">
              <div>
                <h2 className="pdv-panel-title">
                  {editandoId ? "Editar produto" : "Novo produto"}
                </h2>

                <p className="pdv-panel-subtitle">
                  Use imagens quadradas, de preferência 800x800, com o produto
                  centralizado.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <label
                style={{
                  cursor: "pointer",
                  border: "1px dashed rgba(15, 64, 38, 0.22)",
                  borderRadius: 18,
                  padding: 22,
                  textAlign: "center",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.72), rgba(220,235,216,0.58))",
                  color: "#123b24",
                }}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={selecionarImagem}
                />

                <div
                  style={{
                    width: 72,
                    height: 72,
                    margin: "0 auto 12px",
                    borderRadius: 24,
                    background:
                      "linear-gradient(135deg, #0b5a34, #123b24)",
                    color: "#fffdf2",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 950,
                    fontSize: 18,
                  }}
                >
                  IMG
                </div>

                <p style={{ fontWeight: 950 }}>
                  {arquivo ? arquivo.name : "Escolher foto"}
                </p>

                <p
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    color: "rgba(18,59,36,0.62)",
                    fontWeight: 700,
                  }}
                >
                  {editandoId
                    ? "Envie uma nova foto apenas se quiser trocar"
                    : "Foto do produto"}
                </p>
              </label>

              <input
                placeholder="Nome do produto"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="pdv-search"
                style={{ width: "100%", minWidth: 0 }}
              />

              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="pdv-search"
                style={{ width: "100%", minWidth: 0 }}
              >
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="Descrição"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="pdv-search"
                style={{
                  width: "100%",
                  minWidth: 0,
                  minHeight: 96,
                  resize: "vertical",
                }}
              />

              <input
                placeholder="Preço. Ex: 8,00"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="pdv-search"
                style={{ width: "100%", minWidth: 0 }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <input
                  placeholder="Estoque"
                  value={estoque}
                  onChange={(e) => setEstoque(e.target.value)}
                  className="pdv-search"
                  style={{ width: "100%", minWidth: 0 }}
                />

                <input
                  placeholder="Mínimo"
                  value={minimo}
                  onChange={(e) => setMinimo(e.target.value)}
                  className="pdv-search"
                  style={{ width: "100%", minWidth: 0 }}
                />
              </div>

              <button onClick={salvar} className="pdv-finish">
                {editandoId ? "Salvar alterações" : "Salvar produto"}
              </button>

              {editandoId && (
                <button
                  onClick={limparFormulario}
                  className="pdv-payment active"
                  style={{
                    color: "#123b24",
                    width: "100%",
                  }}
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </section>

          <section className="pdv-panel">
            <div className="pdv-panel-header">
              <div>
                <h2 className="pdv-panel-title">Produtos cadastrados</h2>
                <p className="pdv-panel-subtitle">
                  Gerencie preços, fotos, estoque e itens visíveis no PDV.
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
                {lista.length} produto(s)
              </span>
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

            {!carregando && lista.length === 0 && (
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

                <h2 className="pdv-panel-title">Nenhum produto cadastrado</h2>

                <p className="pdv-panel-subtitle">
                  Cadastre seu primeiro produto para aparecer na venda rápida.
                </p>
              </div>
            )}

            {!carregando && lista.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 14,
                }}
              >
                {lista.map((item) => (
                  <article key={item.id} className="pdv-product-card">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="pdv-product-image"
                        style={{
                          height: 160,
                          padding: 12,
                        }}
                      />
                    ) : (
                      <div
                        className="pdv-product-empty"
                        style={{
                          height: 160,
                        }}
                      >
                        PR
                      </div>
                    )}

                    <div className="pdv-product-body">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "start",
                          justifyContent: "space-between",
                          gap: 10,
                        }}
                      >
                        <div>
                          <h2
                            className="pdv-product-name"
                            style={{
                              fontSize: 17,
                              lineHeight: 1.15,
                            }}
                          >
                            {item.name}
                          </h2>

                          <div className="pdv-product-stock">
                            {item.category || "Outros"}
                          </div>
                        </div>

                        <span
                          style={{
                            borderRadius: 999,
                            background: "rgba(11,90,52,0.08)",
                            padding: "6px 9px",
                            fontSize: 11,
                            fontWeight: 950,
                            color: "#123b24",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Ativo
                        </span>
                      </div>

                      {item.description && (
                        <p
                          style={{
                            marginTop: 8,
                            minHeight: 34,
                            color: "rgba(18,59,36,0.58)",
                            fontSize: 13,
                            fontWeight: 700,
                            lineHeight: 1.3,
                          }}
                        >
                          {item.description}
                        </p>
                      )}

                      <div className="pdv-product-bottom">
                        <span className="pdv-product-price">
                          {dinheiro(item.price)}
                        </span>

                        <span
                          style={{
                            color: "rgba(18,59,36,0.62)",
                            fontWeight: 900,
                            fontSize: 13,
                          }}
                        >
                          Estoque: {item.stock}
                        </span>
                      </div>

                      {Number(item.stock) <= Number(item.minimum_stock || 0) && (
                        <div
                          style={{
                            marginTop: 12,
                            borderRadius: 12,
                            background: "rgba(180, 120, 20, 0.12)",
                            color: "#7a4b08",
                            padding: 10,
                            fontSize: 13,
                            fontWeight: 900,
                          }}
                        >
                          Estoque baixo
                        </div>
                      )}

                      <div
                        style={{
                          marginTop: 14,
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 10,
                        }}
                      >
                        <button
                          onClick={() => editarProduto(item)}
                          className="pdv-more-link"
                          style={{
                            justifyContent: "center",
                            border: "none",
                            cursor: "pointer",
                            padding: "11px 12px",
                          }}
                        >
                          Editar
                        </button>

                        <button
                          onClick={() => desativarProduto(item.id, item.name)}
                          className="pdv-remove-btn"
                          style={{
                            height: "auto",
                            minHeight: 43,
                            borderRadius: 14,
                          }}
                        >
                          Desativar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
