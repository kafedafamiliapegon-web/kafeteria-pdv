"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

export default function Produtos() {
  const [lista, setLista] = useState<any[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [minimo, setMinimo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  async function carregar() {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    setLista(data || []);
  }

  function precoNumero(valor: string) {
    return Number(valor.replace(",", "."));
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setPreco("");
    setEstoque("");
    setDescricao("");
    setMinimo("");
    setArquivo(null);
  }

  function editarProduto(item: any) {
    setEditandoId(item.id);
    setNome(item.name || "");
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
      const nomeArquivo = Date.now() + "-" + arquivo.name;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(nomeArquivo, arquivo);

      if (uploadError) {
        alert("Erro ao enviar imagem: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("products")
        .getPublicUrl(nomeArquivo);

      imageUrl = data.publicUrl;
    }

    const dadosProduto: any = {
      name: nome,
      description: descricao,
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
        alert(error.message);
        return;
      }

      alert("Produto atualizado ☕");
    } else {
      const { error } = await supabase.from("products").insert({
        ...dadosProduto,
        image_url: imageUrl,
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("Produto salvo ☕");
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

  return (
    <main className="min-h-screen bg-[#07130d] p-8 text-white lg:p-10">
      <Header title="📦 Produtos" />

      <div className="grid gap-10 xl:grid-cols-[420px_1fr]">
        <section className="h-fit rounded-3xl bg-[#103520] p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {editandoId ? "Editar produto" : "Novo produto"}
            </h2>

            {editandoId && (
              <button
                onClick={limparFormulario}
                className="rounded-xl bg-black/20 px-4 py-2 text-sm hover:bg-black/30"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="space-y-4">
            <label className="block cursor-pointer rounded-2xl border border-dashed border-green-500/40 p-6 text-center hover:bg-black/10">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              />

              <div className="text-4xl">📷</div>

              <p className="mt-3 font-bold">
                {arquivo ? arquivo.name : "Escolher foto"}
              </p>

              <p className="mt-1 text-sm text-green-100/60">
                {editandoId
                  ? "Envie uma nova foto apenas se quiser trocar"
                  : "Foto do produto"}
              </p>
            </label>

            <input
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-xl bg-black/20 p-4 outline-none"
            />

            <textarea
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="min-h-24 w-full rounded-xl bg-black/20 p-4 outline-none"
            />

            <input
              placeholder="Preço. Ex: 8,00"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              className="w-full rounded-xl bg-black/20 p-4 outline-none"
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Estoque"
                value={estoque}
                onChange={(e) => setEstoque(e.target.value)}
                className="w-full rounded-xl bg-black/20 p-4 outline-none"
              />

              <input
                placeholder="Mínimo"
                value={minimo}
                onChange={(e) => setMinimo(e.target.value)}
                className="w-full rounded-xl bg-black/20 p-4 outline-none"
              />
            </div>

            <button
              onClick={salvar}
              className="w-full rounded-xl bg-green-600 py-4 font-bold hover:bg-green-500"
            >
              {editandoId ? "Salvar Alterações" : "Salvar Produto"}
            </button>
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Produtos cadastrados</h2>

            <span className="rounded-full bg-[#103520] px-4 py-2 text-sm text-green-100/70">
              {lista.length} produto(s)
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {lista.map((item) => (
              <div key={item.id} className="rounded-3xl bg-[#103520] p-5">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    className="h-56 w-full rounded-2xl object-cover object-center"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-2xl bg-black/10 text-6xl">
                    ☕
                  </div>
                )}

                <h2 className="mt-4 text-2xl font-bold">{item.name}</h2>

                {item.description && (
                  <p className="mt-1 text-sm text-green-100/60">
                    {item.description}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xl font-bold text-green-300">
                    R$ {Number(item.price).toFixed(2)}
                  </p>

                  <p className="rounded-full bg-black/20 px-3 py-1 text-sm">
                    Estoque: {item.stock}
                  </p>
                </div>

                {Number(item.stock) <= Number(item.minimum_stock || 0) && (
                  <p className="mt-3 rounded-xl bg-yellow-500/20 p-3 text-sm text-yellow-200">
                    ⚠️ Estoque baixo
                  </p>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => editarProduto(item)}
                    className="rounded-xl bg-green-700 py-3 font-bold hover:bg-green-600"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => desativarProduto(item.id, item.name)}
                    className="rounded-xl bg-red-600/80 py-3 font-bold hover:bg-red-500"
                  >
                    Desativar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}