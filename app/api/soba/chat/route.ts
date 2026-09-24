
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const OLLAMA_URL = 'http://127.0.0.1:11434/api/chat'
const OLLAMA_MODEL = 'qwen2.5:3b'

const SOBA_SYSTEM_PROMPT = `
Tu és o Soba IA, assistente oficial da Wizenda, uma plataforma africana de turismo.

PERSONALIDADE:

* És simpática, natural, acolhedora e útil.
* Responde de forma clara e humana.
* Sê objetiva.
* Não inventes informações.
* Quando não tiveres informação suficiente, diz claramente que não tens essa informação.
* Nunca transformes uma suposição em facto.

IDIOMA:

* Responde no mesmo idioma usado pelo utilizador.
* Podes responder em português, inglês, francês, espanhol, italiano, alemão, árabe, chinês, japonês, coreano e outras línguas.
* Podes tentar compreender línguas nacionais angolanas como Kimbundu, Umbundu, Kikongo, Cokwe e Kwanyama.
* Se não tiveres confiança suficiente numa língua, informa o utilizador e responde em português.

ANGOLA:

* Tens especial interesse pela cultura, história, gastronomia, música, dança, natureza, praias, cidades e turismo de Angola.
* Não generalizes costumes de uma região para todo o país.
* Diferencia factos históricos de tradições e opiniões.
* Não inventes nomes de festivais, pratos, lugares, datas ou tradições.

DADOS DA WIZENDA:

* A Wizenda possui experiências turísticas e lugares para o fim de semana.
* Os dados fornecidos abaixo vêm da base de dados da Wizenda.
* Quando o utilizador pedir recomendações da Wizenda, usa prioritariamente esses dados.
* Nunca inventes experiências, lugares, agências, preços, disponibilidade ou características que não estejam nos dados fornecidos.
* Se não existirem resultados relevantes, informa o utilizador.
* Não digas que consultaste a internet.
* Não inventes resultados para preencher uma resposta.

EXPERIÊNCIAS:

* Uma experiência com status "published" está publicada e pode ser recomendada ao utilizador.
* Experiências com status "draft", "pending_review" ou "rejected" não devem ser recomendadas.
* Quando existirem experiências publicadas nos dados fornecidos, nunca digas que a Wizenda não possui experiências.
* Usa o título, localização, cidade, província e outros dados disponíveis.
* Se houver slug, usa-o apenas como referência interna.
* Nunca mostres o slug ao utilizador.
* Se não houver preço disponível, não inventes preço.
* Quando houver experiências relevantes nos dados fornecidos, apresenta-as ao utilizador de forma natural.
* Os cards das experiências são apresentados automaticamente pela interface da Wizenda.
* Não escrevas HTML, Markdown ou código para criar cards.
* Não inventes uma experiência para completar uma lista.

IMAGENS E URLS:

* Nunca escrevas URLs de imagens na resposta.
* Nunca escrevas URLs do Supabase Storage.
* Nunca escrevas caminhos internos de ficheiros.
* Nunca uses Markdown de imagem, como ![Imagem](URL).
* Nunca escrevas "Imagem:" seguido de uma URL.
* Nunca copies o campo "cover_image" para a resposta.
* As imagens das experiências são apresentadas automaticamente pelos cards da interface da Wizenda.
* Não precisas de descrever ou reproduzir a URL da imagem.
* O utilizador verá automaticamente a imagem correspondente no card.
* Se uma experiência tiver uma imagem, não menciones a URL da imagem.
* Não inventes URLs, imagens ou links.

LUGARES PARA O FIM DE SEMANA:

* São estabelecimentos publicados pela Wizenda.
* Podem incluir restaurantes, hotéis, praias, resorts, espaços de lazer e outros negócios.
* Só recomendes lugares presentes nos dados fornecidos.
* Respeita o estado de publicação e a validade fornecidos pela aplicação.
* Nunca mostres URLs internos ou URLs de imagens.
* Se houver website, Instagram ou telefone nos dados, só menciona esses contactos quando forem relevantes para a pergunta do utilizador.

RESPOSTAS:

* Se o utilizador fizer uma pergunta geral sobre cultura ou história, responde com conhecimento geral.
* Se pedir experiências ou lugares da Wizenda, usa os dados fornecidos.
* Se pedir recomendações e houver resultados relevantes, menciona-os.
* Se houver experiências relevantes, não precisas de listar todos os campos técnicos.
* Não mostres IDs internos.
* Não mostres slugs.
* Não mostres URLs de imagens.
* Não mostres caminhos do Supabase.
* Não repitas a pergunta.
* Evita respostas excessivamente longas.
* Quando existirem cards de experiências, escreve uma introdução curta e deixa os cards da interface apresentarem os detalhes visuais.

CONTEXTO ATUAL DA WIZENDA:
{{WIZENDA_CONTEXT}}
`

type HistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

type ExperienceRow = {
  id: string
  title: string | null
  slug: string | null
  location: string | null
  city: string | null
  province: string | null
  cover_image: string | null
}

type WeekendPlaceRow = {
  id: string
  business_name: string
  slug: string
  category: string
  description: string | null
  province: string | null
  city: string | null
  location: string | null
  cover_image: string | null
  phone: string | null
  website: string | null
  instagram: string | null
  price_from: number | null
  is_featured: boolean
  status: string
  subscription_expires_at: string | null
}

type WizendaContextResult = {
  context: string
  experiences: ExperienceRow[]
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function looksLikeTourismSearch(message: string) {
  const text = normalize(message)

  const keywords = [
    'experiencia',
    'experiencias',
    'turismo',
    'turistico',
    'turistica',
    'lugar',
    'lugares',
    'fim de semana',
    'fim-de-semana',
    'passear',
    'visitar',
    'visita',
    'viajar',
    'viagem',
    'destino',
    'destinos',
    'praia',
    'praias',
    'hotel',
    'hoteis',
    'restaurante',
    'restaurantes',
    'resort',
    'resorts',
    'lazer',
    'passeio',
    'passeios',
    'onde ir',
    'o que fazer',
    'what to do',
    'places to visit',
    'weekend',
    'tourism',
    'experience',
    'experiences',
    'restaurant',
  ]

  return keywords.some((keyword) =>
    text.includes(keyword),
  )
}

function extractLocation(message: string) {
  const text = normalize(message)

  const locations = [
    'luanda',
    'benguela',
    'cabinda',
    'huambo',
    'huila',
    'namibe',
    'malanje',
    'uige',
    'zaire',
    'bengo',
    'cunene',
    'cuando cubango',
    'moxico',
    'bie',
    'bié',
    'cuanza norte',
    'cuanza sul',
    'kwanza norte',
    'kwanza sul',
  ]

  return (
    locations.find((location) =>
      text.includes(normalize(location)),
    ) || null
  )
}

async function getWizendaContext(
  message: string,
): Promise<WizendaContextResult> {
  const supabase = await createClient()

  const location = extractLocation(message)
  const tourismSearch =
    looksLikeTourismSearch(message)

  if (!tourismSearch) {
    return {
      context:
        'Nenhuma consulta específica à base turística da Wizenda foi necessária para esta pergunta.',
      experiences: [],
    }
  }

  const [
    experiencesResult,
    weekendResult,
  ] = await Promise.all([
    supabase
      .from('experiences')
      .select(
        `
        id,
        title,
        slug,
        location,
        city,
        province,
        cover_image
      `,
      )
      .eq('status', 'published')
      .limit(30),

    supabase
      .from('weekend_places')
      .select(
        `
        id,
        business_name,
        slug,
        category,
        description,
        province,
        city,
        location,
        cover_image,
        phone,
        website,
        instagram,
        price_from,
        is_featured,
        status,
        subscription_expires_at
      `,
      )
      .eq('status', 'active')
      .limit(30),
  ])

  if (experiencesResult.error) {
    console.error(
      'Erro ao consultar experiências:',
      experiencesResult.error,
    )
  }

  if (weekendResult.error) {
    console.error(
      'Erro ao consultar lugares:',
      weekendResult.error,
    )
  }

  let experiences =
    (experiencesResult.data ||
      []) as ExperienceRow[]

  let weekendPlaces =
    (weekendResult.data ||
      []) as WeekendPlaceRow[]

  /*
   * Se o utilizador indicar uma localização,
   * damos prioridade aos resultados dessa localização.
   */
  if (location) {
    const normalizedLocation =
      normalize(location)

    const locationExperiences =
      experiences.filter((item) => {
        const values = [
          item.city,
          item.province,
          item.location,
        ]
          .filter(Boolean)
          .map((value) =>
            normalize(String(value)),
          )

        return values.some((value) =>
          value.includes(
            normalizedLocation,
          ),
        )
      })

    const locationWeekendPlaces =
      weekendPlaces.filter((item) => {
        const values = [
          item.city,
          item.province,
          item.location,
        ]
          .filter(Boolean)
          .map((value) =>
            normalize(String(value)),
          )

        return values.some((value) =>
          value.includes(
            normalizedLocation,
          ),
        )
      })

    if (locationExperiences.length > 0) {
      experiences =
        locationExperiences
    }

    if (
      locationWeekendPlaces.length > 0
    ) {
      weekendPlaces =
        locationWeekendPlaces
    }
  }

  const validWeekendPlaces =
    weekendPlaces.filter((item) => {
      if (!item.subscription_expires_at) {
        return true
      }

      return (
        new Date(
          item.subscription_expires_at,
        ).getTime() > Date.now()
      )
    })

  /*
   * IMPORTANTE:
   *
   * O modelo recebe apenas os dados textuais
   * necessários para responder.
   *
   * cover_image NÃO é enviado para o modelo.
   *
   * A imagem continua disponível em
   * wizendaData.experiences e é enviada
   * separadamente ao frontend para criar
   * os cards.
   */
  const experiencesForModel =
    experiences
      .slice(0, 15)
      .filter(
        (item) =>
          Boolean(
            item.id &&
              item.title &&
              item.slug,
          ),
      )
      .map((item) => ({
        id: item.id,
        titulo: item.title,
        slug: item.slug,
        localizacao: item.location,
        cidade: item.city,
        provincia: item.province,
      }))

  const weekendPlacesForModel =
    validWeekendPlaces
      .slice(0, 15)
      .map((item) => ({
        id: item.id,
        nome: item.business_name,
        categoria: item.category,
        descricao: item.description,
        localizacao: item.location,
        cidade: item.city,
        provincia: item.province,
        preco_a_partir_de:
          item.price_from,
        destaque: item.is_featured,
        slug: item.slug,
        telefone: item.phone,
        website: item.website,
        instagram: item.instagram,
      }))

  const context = {
    pesquisa_localizacao:
      location || 'não especificada',

    /*
     * Sem cover_image.
     */
    experiencias_publicadas:
      experiencesForModel,

    lugares_fim_de_semana:
      weekendPlacesForModel,
  }

  return {
    context: JSON.stringify(
      context,
      null,
      2,
    ),

    /*
     * Aqui mantemos cover_image porque
     * esta informação NÃO vai para o Ollama.
     * Vai apenas para o frontend criar o card.
     */
    experiences: experiences
      .slice(0, 15)
      .filter(
        (item) =>
          Boolean(
            item.id &&
              item.title &&
              item.slug,
          ),
      ),
  }
}

function encodeEvent(
  event: unknown,
) {
  return JSON.stringify(event) + '\n'
}

export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      await request.json()

    const message =
      typeof body?.message === 'string'
        ? body.message.trim()
        : ''

    const history = Array.isArray(
      body?.history,
    )
      ? body.history
      : []

    if (!message) {
      return new Response(
        'Mensagem vazia.',
        {
          status: 400,
        },
      )
    }

    const cleanHistory =
      history
        .filter(
          (item: any) =>
            item &&
            (
              item.role === 'user' ||
              item.role === 'assistant'
            ) &&
            typeof item.content ===
              'string',
        )
        .slice(-8)
        .map(
          (
            item: any,
          ): HistoryMessage => ({
            role: item.role,
            content: item.content,
          }),
        )

    let wizendaData:
      WizendaContextResult = {
      context:
        'Não foi possível consultar os dados turísticos neste momento.',
      experiences: [],
    }

    try {
      wizendaData =
        await getWizendaContext(
          message,
        )
    } catch (error) {
      console.error(
        'Erro ao preparar contexto Wizenda:',
        error,
      )
    }

    const systemPrompt =
      SOBA_SYSTEM_PROMPT.replace(
        '{{WIZENDA_CONTEXT}}',
        wizendaData.context,
      )

    const ollamaResponse =
      await fetch(
        OLLAMA_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            model: OLLAMA_MODEL,

            messages: [
              {
                role: 'system',
                content: systemPrompt,
              },

              ...cleanHistory,

              {
                role: 'user',
                content: message,
              },
            ],

            stream: true,

            options: {
              temperature: 0.4,
              num_ctx: 4096,
              num_predict: 500,
            },
          }),
        },
      )

    if (!ollamaResponse.ok) {
      const errorText =
        await ollamaResponse.text()

      return new Response(
        `Erro do Ollama: ${errorText}`,
        {
          status:
            ollamaResponse.status,
        },
      )
    }

    if (!ollamaResponse.body) {
      return new Response(
        'Ollama não devolveu um stream.',
        {
          status: 500,
        },
      )
    }

    const reader =
      ollamaResponse.body.getReader()

    const decoder =
      new TextDecoder()

    const encoder =
      new TextEncoder()

    const stream =
      new ReadableStream({
        async start(controller) {
          let buffer = ''

          try {
            /*
             * Primeiro enviamos os dados das
             * experiências para o frontend.
             *
             * O modelo NÃO recebe as imagens.
             */
            if (
              wizendaData.experiences
                .length > 0
            ) {
              controller.enqueue(
                encoder.encode(
                  encodeEvent({
                    type: 'experiences',
                    experiences:
                      wizendaData.experiences,
                  }),
                ),
              )
            }

            while (true) {
              const {
                value,
                done,
              } =
                await reader.read()

              if (done) {
                break
              }

              buffer +=
                decoder.decode(
                  value,
                  {
                    stream: true,
                  },
                )

              const lines =
                buffer.split('\n')

              buffer =
                lines.pop() || ''

              for (
                const line of lines
              ) {
                const trimmed =
                  line.trim()

                if (!trimmed) {
                  continue
                }

                try {
                  const data =
                    JSON.parse(
                      trimmed,
                    )

                  if (
                    data.message
                      ?.content
                  ) {
                    controller.enqueue(
                      encoder.encode(
                        encodeEvent({
                          type: 'text',
                          content:
                            data.message
                              .content,
                        }),
                      ),
                    )
                  }

                  if (
                    data.done === true
                  ) {
                    controller.close()
                    return
                  }
                } catch {
                  /*
                   * Ignora linhas inválidas.
                   */
                }
              }
            }

            if (buffer.trim()) {
              try {
                const data =
                  JSON.parse(
                    buffer.trim(),
                  )

                if (
                  data.message
                    ?.content
                ) {
                  controller.enqueue(
                    encoder.encode(
                      encodeEvent({
                        type: 'text',
                        content:
                          data.message
                            .content,
                      }),
                    ),
                  )
                }
              } catch {
                /*
                 * Ignora último fragmento inválido.
                 */
              }
            }

            controller.close()
          } catch (error) {
            console.error(
              'Soba stream error:',
              error,
            )

            controller.error(error)
          } finally {
            reader.releaseLock()
          }
        },
      })

    return new Response(stream, {
      headers: {
        'Content-Type':
          'application/x-ndjson; charset=utf-8',
        'Cache-Control':
          'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error(
      'Soba API error:',
      error,
    )

    return new Response(
      'Não foi possível contactar a Soba.',
      {
        status: 500,
      },
    )
  }
}
