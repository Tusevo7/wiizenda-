
"use client";

import { useState } from "react";

const provincias = [
  {
    nome: "Luanda",
    imagem:
      "https://images.unsplash.com/photo-1587474260584-136574528ed5",
  },
  {
    nome: "Benguela",
    imagem:
      "https://images.unsplash.com/photo-1500534623283-312aade485b7",
  },
  {
    nome: "Huíla",
    imagem:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
  },
  {
    nome: "Namibe",
    imagem:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  },
  {
    nome: "Cabinda",
    imagem:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
  },
];

export default function ProvinciasPage() {
  const [selecionada, setSelecionada] = useState(0);

  const provincia = provincias[selecionada];

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
        <div className="relative h-[68vh] min-h-[500px] w-full overflow-hidden rounded-3xl">

          {/* Imagem */}
          <img
            src={provincia.imagem}
            alt={provincia.nome}
            className="absolute inset-0 h-full w-full object-cover transition-all duration-700"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          {/* Conteúdo */}
          <div className="absolute bottom-0 left-0 right-0 p-7 md:p-12">

            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-white/70">
              Província
            </p>

            <h2 className="text-5xl font-bold text-white md:text-7xl">
              {provincia.nome}
            </h2>

            {/* Botão laranja */}
            <button
              className="mt-6 rounded-full bg-[#FF5A1F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e94d16]"
            >
              Explorar província →
            </button>
          </div>
        </div>

        {/* Navegação das províncias */}
        <div className="mt-6 flex gap-3 overflow-x-auto pb-3">
          {provincias.map((item, index) => (
            <button
              key={item.nome}
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
