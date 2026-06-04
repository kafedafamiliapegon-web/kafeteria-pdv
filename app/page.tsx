"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [categories, setCategories] = useState<any[]>([]);

  async function loadCategories() {
    const { data } = await supabase
      .from("categories")
      .select("*");

    if (data) {
      setCategories(data);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <main className="min-h-screen bg-[#07130d] p-8 text-white">

      <h1 className="mb-2 text-5xl font-bold">
        ☕ Kafeteria PDV
      </h1>

      <p className="mb-10 text-green-200">
        Sistema conectado ao banco.
      </p>

      <div className="mb-6">
        <h2 className="mb-4 text-2xl">
          Categorias
        </h2>

        <div className="flex gap-3 flex-wrap">

          {categories.map((cat) => (

            <div
              key={cat.id}
              className="
              rounded-2xl
              bg-[#103520]
              px-6
              py-4
              text-lg
              "
            >
              {cat.icon} {cat.name}
            </div>

          ))}

        </div>
      </div>

    </main>
  );
}