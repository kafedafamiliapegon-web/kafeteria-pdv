"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

export default function Configuracoes() {
  const [id, setId] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState("Kafeteria");
  const [telefone, setTelefone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [endereco, setEndereco] = useState("");
  const [rodape, setRodape] = useState("Obrigado pela preferência ☕");

  async function carregar() {
    const { data } = await supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .single();

    if (data) {
      setId(data.id);
      setEmpresa(data.company_name || "Kafeteria");
      setTelefone(data.phone || "");
      setInstagram(data.instagram || "");
      setEndereco(data.address || "");
    }
  }

  async function salvar() {
    const dados = {
      company_name: empresa,
      phone: telefone,
      instagram,
      address: endereco,
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

    alert("Configurações salvas ☕");
    carregar();
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <main className="min-h-screen bg-[#07130d] p-8 text-white lg:p-10">
      <Header title="⚙️ Configurações" />

      <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
        <section className="rounded-3xl bg-[#103520] p-8">
          <h2 className="mb-6 text-2xl font-bold">Dados da empresa</h2>

          <div className="space-y-4">
            <input
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Nome da empresa"
              className="w-full rounded-xl bg-black/20 p-4 outline-none"
            />

            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Telefone"
              className="w-full rounded-xl bg-black/20 p-4 outline-none"
            />

            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="Instagram"
              className="w-full rounded-xl bg-black/20 p-4 outline-none"
            />

            <textarea
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Endereço"
              className="min-h-24 w-full rounded-xl bg-black/20 p-4 outline-none"
            />

            <textarea
              value={rodape}
              onChange={(e) => setRodape(e.target.value)}
              placeholder="Rodapé do comprovante"
              className="min-h-24 w-full rounded-xl bg-black/20 p-4 outline-none"
            />

            <button
              onClick={salvar}
              className="w-full rounded-xl bg-green-600 py-4 font-bold hover:bg-green-500"
            >
              Salvar Configurações
            </button>
          </div>
        </section>

        <aside className="rounded-3xl bg-[#103520] p-8">
          <h2 className="text-2xl font-bold">Prévia</h2>

          <div className="mt-6 rounded-3xl bg-white p-6 text-center text-black">
            <div className="text-5xl">☕</div>

            <h3 className="mt-4 text-2xl font-bold">{empresa}</h3>

            {telefone && <p className="mt-2">{telefone}</p>}

            {instagram && <p>{instagram}</p>}

            {endereco && <p className="mt-2 text-sm">{endereco}</p>}

            <div className="my-5 border-t border-dashed border-black/30" />

            <p className="text-sm">{rodape}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}