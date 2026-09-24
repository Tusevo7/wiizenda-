"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Provincia = {
  id: string;
  nome: string;
  slug: string;
  imagem_capa: string | null;
};

export default function ProvinciasPage() {
  const supabase = createClient();

  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [selecionada, setSelecionada] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarProvincias() {
      const { data, error } = await supabase
        .from("provincias")
        .select(`
          id,
          nome,
          slug,
          imagem_capa
        `)
        .eq("publicada", true)
        .order("nome", {
          ascending: true,
        });

      if (error) {
        console.error("ERRO PROVINCIAS:", error);
        setCarregando(false);
        return;
      }

      setProvincias(data || []);
      setCarregando(false);
    }

    carregarProvincias();
  }, [supabase]);

  if (carregando) {
    return (
      <main className="min-h-screen bg-white px-5 py-8 text-black md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 h-5 w-24 animate-pulse rounded bg-black/10" />

          <div className="mb-7">
            <div className="h-4 w-40 animate-pulse rounded bg-black/10" />
            <div className="mt-4 h-14 w-72 animate-pulse rounded bg-black/10" />
          </div>

          <div className="h-[68vh] min-h-[500px] w-full animate-pulse rounded-3xl bg-black/5" />
        </div>
      </main>
    );
  }

  if (provincias.length === 0) {
    return (
      <main className="min-h-screen bg-white px-5 py-8 text-black md:px-10">
        <div className="mx-auto max-w-7xl">
          <button
            onClick={() => window.history.back()}
            className="mb-8 flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-[#FF5A1F]"
          >
            ← Voltar
          </button>

          <div className="py-20 text-center">
            <p className="text-sm uppercase tracking-[0.25em] text-black/40">
              Descubra Angola
            </p>

            <h1 className="mt-3 text-4xl font-semibold">
              Províncias
            </h1>

            <p className="mt-4 text-black/50">
              Ainda não existem províncias publicadas.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const provincia = provincias[selecionada];

  function explorarProvincia() {
    window.location.href = `/provincias/${provincia.slug}`;
  }

  return (
    <main className="min-h-screen bg-white px-5 py-8 text-black md:px-10">
      <div className="mx-auto max-w-7xl">

        {/* Botão voltar */}
        <button
          onClick={() => window.history.back()}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-[#FF5A1F]"
        >
          ← Voltar
        </button>

        {/* Título */}
        <div className="mb-7">
          <p className="mb-2 text-sm uppercase tracking-[0.25em] text-black/40">
            Descubra Angola
          </p>

          <h1 className="text-4xl font-semibold md:text-6xl">
            Províncias
          </h1>
        </div>

        {/* Card principal */}
        <div className="overflow-hidden rounded-3xl bg-white">

          {/* Imagem de capa */}
          <div className="relative h-[55vh] min-h-[400px] w-full overflow-hidden rounded-3xl">

            {provincia.imagem_capa ? (
              <img
                src={provincia.imagem_capa}
                alt={provincia.nome}
                className="absolute inset-0 h-full w-full object-cover transition-all duration-700"
              />
            ) : (
              <div className="absolute inset-0 bg-black/10" />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

            {/* Nome sobre a imagem */}
            <div className="absolute bottom-0 left-0 right-0 p-7 md:p-12">

              <p className="mb-3 text-sm uppercase tracking-[0.2em] text-white/70">
                Província
              </p>

              <h2 className="text-5xl font-bold text-white md:text-7xl">
                {provincia.nome}
              </h2>

            </div>
          </div>

          {/* Botão explorar */}
          <div className="px-2 py-7 md:px-4 md:py-9">
            <button
              onClick={explorarProvincia}
              className="rounded-full bg-[#FF5A1F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e94d16]"
            >
              Explorar província →
            </button>
          </div>
        </div>

        {/* Navegação das províncias */}
        <div className="mt-6 flex gap-3 overflow-x-auto pb-3">
          {provincias.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelecionada(index)}
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition ${
                selecionada === index
                  ? "bg-[#FF5A1F] text-white"
                  : "bg-black/5 text-black/60 hover:bg-black/10"
              }`}
            >
              {item.nome}
            </button>
          ))}
        </div>

      </div>
    </main>
  );
}