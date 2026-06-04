"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Produtos() {

  const [lista,setLista]=useState<any[]>([]);

  const [nome,setNome]=useState("");

  const [preco,setPreco]=useState("");

  const [estoque,setEstoque]=useState("");

  const [minimo,setMinimo]=useState("");

  const [descricao,setDescricao]=useState("");

  const [arquivo,setArquivo]=
  useState<File|null>(null);

  async function carregar(){

    const { data } =
    await supabase
    .from("products")
    .select("*")
    .order(
      "created_at",
      {
        ascending:false
      }
    );

    setLista(
      data || []
    );

  }

  async function salvar(){

    let imageUrl=null;

    if(
      arquivo
    ){

      const nomeArquivo=
      Date.now()
      +
      "-"
      +
      arquivo.name;

      const { error: uploadError } = await supabase
      .storage
      .from(
        "products"
      )
      .upload(
        nomeArquivo,
        arquivo
      );

      if (uploadError) {
        alert("Erro ao enviar imagem: " + uploadError.message);
        return;
      }

      const {
        data
      }=
      supabase
      .storage
      .from(
        "products"
      )
      .getPublicUrl(
        nomeArquivo
      );

      imageUrl=
      data.publicUrl;

    }

    const {
      error
    }=
    await supabase
    .from(
      "products"
    )
    .insert({

      name:nome,

      description:
      descricao,

      image_url:
      imageUrl,

      price:
      Number(
        preco
      ),

      stock:
      Number(
        estoque
      ),

      minimum_stock:
      Number(
        minimo
      )

    });

    if(
      error
    ){

      alert(
        error.message
      );

      return;

    }

    setNome("");
    setPreco("");
    setEstoque("");
    setDescricao("");
    setMinimo("");

    carregar();

  }

  useEffect(
    ()=>{

      carregar();

    },
    []
  );

  return (

    <main
    className="
    min-h-screen
    bg-[#07130d]
    text-white
    p-10
    ">

      <h1
      className="
      text-5xl
      font-bold
      "
      >

        Produtos

      </h1>

      <div
      className="
      mt-10
      grid
      gap-10
      xl:grid-cols
      "
      >

        <div
        className="
        rounded-3xl
        bg-[#103520]
        p-8
        space-y-4
        "
        >

          <input
          type="file"

          onChange={

            (
              e
            )=>

            setArquivo(

              e.target.files?.[0]

              ||

              null

            )

          }

          />

          <input
          placeholder="Nome"

          value={nome}

          onChange={
            (
              e
            )=>

            setNome(
              e.target.value
            )
          }

          className="
          w-full
          rounded-xl
          p-4
          bg-black/20
          "
          />

          <textarea

          placeholder="Descrição"

          value={descricao}

          onChange={
            (
              e
            )=>

            setDescricao(
              e.target.value
            )
          }

          className="
          w-full
          rounded-xl
          p-4
          bg-black/20
          "
          />

          <input

          placeholder="Preço"

          value={preco}

          onChange={
            (
              e
            )=>

            setPreco(
              e.target.value
            )
          }

          className="
          w-full
          rounded-xl
          p-4
          bg-black/20
          "

          />

          <input

          placeholder="Estoque"

          value={estoque}

          onChange={
            (
              e
            )=>

            setEstoque(
              e.target.value
            )
          }

          className="
          w-full
          rounded-xl
          p-4
          bg-black/20
          "

          />

          <input

          placeholder="Estoque mínimo"

          value={minimo}

          onChange={
            (
              e
            )=>

            setMinimo(
              e.target.value
            )
          }

          className="
          w-full
          rounded-xl
          p-4
          bg-black/20
          "

          />

          <button

          onClick={
            salvar
          }

          className="
          w-full
          rounded-xl
          bg-green-600
          py-4
          "

          >

            Salvar Produto

          </button>

        </div>

        <div
        className="
        mt-8
        grid
        gap-5
        md:grid-cols-2
        xl:grid-cols-4
        "
        >

          {

            lista.map(

              (
                item
              )=>(

                <div

                key={
                  item.id
                }

                className="
                rounded-3xl
                bg-[#103520]
                p-5
                "

                >

                  {

                    item.image_url

                    ?

                    <img

                    src={
                      item.image_url
                    }

                    className="
                    h-52
                    w-full
                    rounded-2xl
                    object-cover
                    "

                    />

                    :

                    <div
                    className="
                    text-6xl
                    "
                    >

                      ☕

                    </div>

                  }

                  <h2
                  className="
                  mt-4
                  text-2xl
                  font-bold
                  "
                  >

                    {
                      item.name
                    }

                  </h2>

                  <p>

                    R$

                    {
                      item.price
                    }

                  </p>

                  <p>

                    Estoque:

                    {
                      item.stock
                    }

                  </p>

                </div>

              )

            )

          }

        </div>

      </div>

    </main>

  );

}