import Link from 'next/link'
import { ArrowLeft, BadgeCheck } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import ProvinceGallery from '@/app/components/province-gallery'

type Provincia = {
  id: string
  nome: string
  slug: string
  descricao: string | null
  imagem_capa: string | null
  imagem: string | null
}

type Agency = {
  id: string
  name: string
  logo_url: string | null
  province: string | null
  city: string | null
  address: string | null
  status: string
  is_verified: boolean
  verification_status: string
}

type ProvinciaImagem = {
  id: string
  imagem: string
  ordem: number
}

export default async function ProvinciaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()

  // =========================================================
  // PROVÍNCIA
  // =========================================================

  const { data: provincia, error: provinciaError } =
    await supabase
      .from('provincias')
      .select(`
        id,
        nome,
        slug,
        descricao,
        imagem_capa,
        imagem
      `)
      .eq('slug', slug)
      .eq('publicada', true)
      .single()

  if (provinciaError || !provincia) {
    return (
      <main className="min-h-screen bg-white px-5 py-16 text-black">
        <div className="mx-auto max-w-5xl text-center">

          <p className="text-sm uppercase tracking-[0.25em] text-black/40">
            Wizenda
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Província não encontrada
          </h1>

          <p className="mt-3 text-black/50">
            Esta província não existe ou ainda não está publicada.
          </p>

          <Link
            href="/provincias"
            className="mt-7 inline-flex rounded-full bg-[#FF5A1F] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e94f1b]"
          >
            Voltar para províncias
          </Link>

        </div>
      </main>
    )
  }

  // =========================================================
  // AGÊNCIAS
  // =========================================================

  const { data: todasAgencias, error: agenciasError } =
    await supabase
      .from('agencies')
      .select(`
        id,
        name,
        logo_url,
        province,
        city,
        address,
        status,
        is_verified,
        verification_status
      `)
      .order('name', {
        ascending: true,
      })

  if (agenciasError) {
    console.error('ERRO AGÊNCIAS:', agenciasError)
  }

  // =========================================================
  // NORMALIZAR TEXTO
  // =========================================================

  const normalizarTexto = (texto: string) => {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
  }

  const nomeProvinciaNormalizado =
    normalizarTexto(provincia.nome)

  const agencias =
    (todasAgencias || []).filter((agencia) => {
      if (!agencia.province) {
        return false
      }

      return (
        normalizarTexto(agencia.province) ===
        nomeProvinciaNormalizado
      )
    })

  // =========================================================
  // GALERIA DA PROVÍNCIA
  // =========================================================

  const { data: imagensGaleria, error: galeriaError } =
    await supabase
      .from('provincia_imagens')
      .select(`
        id,
        imagem,
        ordem
      `)
      .eq('provincia_id', provincia.id)
      .order('ordem', {
        ascending: true,
      })

  if (galeriaError) {
    console.error('ERRO GALERIA:', galeriaError)
  }

  // =========================================================
  // IMAGENS
  //
  // A imagem "imagem" antiga continua a funcionar
  // caso ainda não existam imagens na nova galeria.
  // =========================================================

  const imagens: {
    url: string
    alt: string
  }[] = []

  if (imagensGaleria && imagensGaleria.length > 0) {
    imagens.push(
      ...imagensGaleria.map((item: ProvinciaImagem) => ({
        url: item.imagem,
        alt: `Imagem da província de ${provincia.nome}`,
      }))
    )
  } else if (provincia.imagem) {
    imagens.push({
      url: provincia.imagem,
      alt: `Imagem da província de ${provincia.nome}`,
    })
  }

  console.log('PROVÍNCIA ATUAL:', provincia.nome)
  console.log('IMAGENS GALERIA:', imagens)
  console.log('AGÊNCIAS ENCONTRADAS:', agencias)

  // =========================================================
  // PÁGINA
  // =========================================================

  return (
    <main className="min-h-screen bg-white text-black">

      <section className="mx-auto max-w-7xl px-5 pb-24 pt-8 md:px-10">

        {/* =====================================================
            VOLTAR
        ===================================================== */}

        <Link
          href="/provincias"
          className="inline-flex items-center gap-2 text-sm font-medium text-black/60 transition hover:text-[#FF5A1F]"
        >
          <ArrowLeft size={17} />
          Voltar para províncias
        </Link>

        {/* =====================================================
            CAPA DA PROVÍNCIA
            imagem_capa = CAPA
            NÃO entra no carrossel
        ===================================================== */}

        <section className="mt-8">

          <div className="relative h-[55vh] min-h-[420px] w-full overflow-hidden rounded-[2rem]">

            {provincia.imagem_capa ? (
              <img
                src={provincia.imagem_capa}
                alt={`Capa da província de ${provincia.nome}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-black/[0.04]" />
            )}

            {/* GRADIENTE DA CAPA */}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* TEXTO DA CAPA */}

            <div className="absolute bottom-0 left-0 right-0 p-7 md:p-12">

              <p className="text-sm font-medium uppercase tracking-[0.25em] text-white/70">
                Descubra Angola
              </p>

              <h1 className="mt-3 text-5xl font-bold tracking-tight text-white md:text-7xl">
                {provincia.nome}
              </h1>

            </div>

          </div>

        </section>

        {/* =====================================================
            DESCRIÇÃO
        ===================================================== */}

        {provincia.descricao && (
          <section className="mt-14 max-w-4xl">

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF5A1F]">
              Sobre a província
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Conheça {provincia.nome}
            </h2>

            <div className="mt-6 max-w-3xl">

              <p className="whitespace-pre-line text-base leading-8 text-black/65 md:text-lg md:leading-9">
                {provincia.descricao}
              </p>

            </div>

          </section>
        )}

        {/* =====================================================
            CARROSSEL
            NÃO USA A CAPA
        ===================================================== */}

        {imagens.length > 0 && (
          <section className="mt-16">

            <div className="mb-6">

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF5A1F]">
                Galeria
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Descubra {provincia.nome}
              </h2>

              <p className="mt-3 max-w-2xl text-base leading-7 text-black/50">
                Explore algumas das paisagens e lugares que tornam esta
                província especial.
              </p>

            </div>

            <ProvinceGallery
              images={imagens}
            />

          </section>
        )}

        {/* =====================================================
            AGÊNCIAS
        ===================================================== */}

        <section className="mt-24">

          <div className="max-w-3xl">

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FF5A1F]">
              Turismo local
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Agências em {provincia.nome}
            </h2>

            <p className="mt-4 text-base leading-7 text-black/50">
              Conheça as agências de turismo presentes nesta província.
            </p>

          </div>

          {/* ===================================================
              SEM AGÊNCIAS
          =================================================== */}

          {agencias.length === 0 ? (

            <div className="mt-8 rounded-3xl border border-black/10 bg-black/[0.02] px-6 py-12 text-center">

              <p className="text-sm text-black/50">
                Ainda não existem agências registadas nesta província.
              </p>

            </div>

          ) : (

            <div className="mt-8 flex flex-wrap gap-3">

              {agencias.map((agencia) => (

                <div
                  key={agencia.id}
                  className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >

                  {/* LOGO */}

                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-black/5">

                    {agencia.logo_url ? (

                      <img
                        src={agencia.logo_url}
                        alt={agencia.name}
                        className="h-full w-full object-cover"
                      />

                    ) : (

                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-black/40">
                        {agencia.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                    )}

                  </div>

                  {/* NOME */}

                  <div className="flex items-center gap-1.5">

                    <span className="max-w-[180px] truncate text-sm font-semibold">
                      {agencia.name}
                    </span>

                    {agencia.is_verified && (
                      <BadgeCheck
                        size={15}
                        className="shrink-0 text-[#FF5A1F]"
                      />
                    )}

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </section>

    </main>
  )
}