'use client'

import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import PhoneInput from 'react-phone-number-input/input'
import {
  getCountries,
  getCountryCallingCode,
} from 'react-phone-number-input'

import type {
  Country,
  Value,
} from 'react-phone-number-input'

type RegisterMode =
  | 'traveler'
  | 'agency'

export default function RegisterPage() {
  const [mode, setMode] =
    useState<RegisterMode>('traveler')

  // ============================================================
  // CLIENTE
  // ============================================================

  const [fullName, setFullName] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [phone, setPhone] =
    useState<Value>('')

  const [city, setCity] =
    useState('')

  const [travelerType, setTravelerType] =
    useState('')

  // ============================================================
  // AGÊNCIA
  // ============================================================

  const [commercialName, setCommercialName] =
    useState('')

  const [legalName, setLegalName] =
    useState('')

  const [nif, setNif] =
    useState('')

  const [responsibleName, setResponsibleName] =
    useState('')

  const [agencyPhone, setAgencyPhone] =
    useState<Value>('')

  const [agencyEmail, setAgencyEmail] =
    useState('')

  const [province, setProvince] =
    useState('')

  const [agencyCity, setAgencyCity] =
    useState('')

  const [address, setAddress] =
    useState('')

  // ============================================================
  // DOCUMENTOS
  // ============================================================

  const [responsibleDocument, setResponsibleDocument] =
    useState<File | null>(null)

  const [companyDocument, setCompanyDocument] =
    useState<File | null>(null)

  const [nifDocument, setNifDocument] =
    useState<File | null>(null)

  const [licenseDocument, setLicenseDocument] =
    useState<File | null>(null)

  const [proofOfAddress, setProofOfAddress] =
    useState<File | null>(null)

  // ============================================================
  // SEGURANÇA
  // ============================================================

  const [password, setPassword] =
    useState('')

  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState<'error' | 'success'>('error')

  // ============================================================
  // ALTERAR TIPO
  // ============================================================

  function selectMode(
    selectedMode: RegisterMode,
  ) {
    setMode(selectedMode)
    setMessage('')
  }

  // ============================================================
  // VALIDAR PASSWORD
  // ============================================================

  function validatePassword() {
    if (password.length < 6) {
      return 'A palavra-passe deve ter pelo menos 6 caracteres.'
    }

    if (password !== confirmPassword) {
      return 'As palavras-passe não coincidem.'
    }

    return null
  }

  // ============================================================
  // REGISTAR
  // ============================================================

  async function handleRegister(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setMessage('')

    const passwordError =
      validatePassword()

    if (passwordError) {
      setMessageType('error')
      setMessage(passwordError)
      return
    }

    if (mode === 'agency') {
      if (
        !responsibleDocument ||
        !companyDocument ||
        !nifDocument ||
        !licenseDocument ||
        !proofOfAddress
      ) {
        setMessageType('error')

        setMessage(
          'Para registar uma agência, é necessário anexar todos os documentos obrigatórios.',
        )

        return
      }
    }

    if (
      mode === 'traveler' &&
      !phone
    ) {
      setMessageType('error')

      setMessage(
        'Introduz o teu número de telefone.',
      )

      return
    }

    if (
      mode === 'agency' &&
      !agencyPhone
    ) {
      setMessageType('error')

      setMessage(
        'Introduz o telefone da agência.',
      )

      return
    }

    setLoading(true)

    try {
      const supabase =
        createClient()

      const registrationEmail =
        mode === 'agency'
          ? agencyEmail.trim()
          : email.trim()

      const registrationName =
        mode === 'agency'
          ? responsibleName.trim()
          : fullName.trim()

      const registrationPhone =
        mode === 'agency'
          ? agencyPhone || ''
          : phone || ''

      const {
        data,
        error,
      } =
        await supabase.auth.signUp({
          email:
            registrationEmail,

          password,

          options: {
            emailRedirectTo:
              `${window.location.origin}/auth/callback`,

            data: {
              registration_type:
                mode,

              full_name:
                registrationName,

              phone:
                registrationPhone,

              city:
                mode === 'agency'
                  ? agencyCity.trim()
                  : city.trim(),

              traveler_type:
                mode === 'traveler'
                  ? travelerType
                  : null,

              commercial_name:
                mode === 'agency'
                  ? commercialName.trim()
                  : null,

              legal_name:
                mode === 'agency'
                  ? legalName.trim()
                  : null,

              nif:
                mode === 'agency'
                  ? nif.trim()
                  : null,

              responsible_name:
                mode === 'agency'
                  ? responsibleName.trim()
                  : null,

              province:
                mode === 'agency'
                  ? province.trim()
                  : null,

              address:
                mode === 'agency'
                  ? address.trim()
                  : null,
            },
          },
        })

      if (error) {
        console.error(
          'Erro no registo:',
          error,
        )

        setMessageType('error')

        setMessage(
          'Não foi possível criar a conta. Verifica os dados e tenta novamente.',
        )

        setLoading(false)

        return
      }

      if (!data.user) {
        setMessageType('error')

        setMessage(
          'A conta não pôde ser criada.',
        )

        setLoading(false)

        return
      }

      // ========================================================
      // CONFIRMAÇÃO DESATIVADA
      // ========================================================

      if (data.session) {
        if (mode === 'traveler') {
          await supabase
            .from('profiles')
            .update({
              full_name:
                fullName.trim(),

              phone:
                phone || '',

              city:
                city.trim(),

              traveler_type:
                travelerType || null,

              role:
                'traveler',
            })
            .eq(
              'id',
              data.user.id,
            )

          setMessageType(
            'success',
          )

          setMessage(
            'Conta criada com sucesso! Já podes entrar na Wizenda.',
          )
        } else {
          const {
            error:
              profileError,
          } =
            await supabase
              .from('profiles')
              .update({
                full_name:
                  responsibleName.trim(),

                phone:
                  agencyPhone || '',

                city:
                  agencyCity.trim(),

                role:
                  'agency',
              })
              .eq(
                'id',
                data.user.id,
              )

          if (profileError) {
            console.error(
              'Erro no perfil:',
              profileError,
            )

            setMessageType(
              'error',
            )

            setMessage(
              'A conta foi criada, mas não foi possível concluir o perfil da agência.',
            )

            setLoading(false)

            return
          }

          const slugBase =
            commercialName
              .trim()
              .toLowerCase()
              .normalize('NFD')
              .replace(
                /[\u0300-\u036f]/g,
                '',
              )
              .replace(
                /[^a-z0-9]+/g,
                '-',
              )
              .replace(
                /^-+|-+$/g,
                '',
              )

          const slug =
            `${slugBase}-${Date.now()}`

          const {
            error:
              agencyError,
          } =
            await supabase
              .from('agencies')
              .insert({
                owner_id:
                  data.user.id,

                name:
                  commercialName.trim(),

                slug,

                legal_name:
                  legalName.trim(),

                nif:
                  nif.trim(),

                responsible_name:
                  responsibleName.trim(),

                phone:
                  agencyPhone || '',

                email:
                  agencyEmail.trim(),

                province:
                  province.trim(),

                city:
                  agencyCity.trim(),

                address:
                  address.trim(),

                status:
                  'pending',

                verification_status:
                  'pending',

                is_verified:
                  false,
              })

          if (agencyError) {
            console.error(
              'Erro ao criar agência:',
              agencyError,
            )

            setMessageType(
              'error',
            )

            setMessage(
              'A conta foi criada, mas não foi possível criar o registo da agência.',
            )

            setLoading(false)

            return
          }

          setMessageType(
            'success',
          )

          setMessage(
            'Conta criada. A tua agência ficará em análise antes de ser verificada.',
          )
        }

        setLoading(false)

        return
      }

      // ========================================================
      // CONFIRMAÇÃO DE EMAIL ATIVA
      // ========================================================

      setMessageType(
        'success',
      )

      if (mode === 'agency') {
        setMessage(
          'Registo recebido! Verifica o teu email para confirmar a conta. Depois, a agência ficará em análise pela equipa Wizenda.',
        )
      } else {
        setMessage(
          'Conta criada! Verifica o teu email para confirmar a conta e depois entra na Wizenda.',
        )
      }
    } catch (error) {
      console.error(
        'Erro inesperado:',
        error,
      )

      setMessageType(
        'error',
      )

      setMessage(
        'Ocorreu um erro inesperado. Tenta novamente.',
      )
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-white">

      <div
        className="
          lg:grid
          lg:min-h-screen
          lg:grid-cols-[0.9fr_1.1fr]
        "
      >

        {/* =====================================================
            HERO
        ====================================================== */}

        <section
          className="
            relative
            h-[390px]
            min-h-[390px]
            overflow-hidden
            lg:sticky
            lg:top-0
            lg:h-screen
            lg:min-h-screen
          "
        >

          <div
            className="
              absolute
              inset-0
              bg-cover
              bg-center
            "
            style={{
              backgroundImage:
                "url('/image2.jpg')",
            }}
          />

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-b
              from-[#063B46]/90
              via-[#063B46]/75
              to-[#062F38]/95
            "
          />

          <div
            className="
              relative
              z-10
              flex
              h-full
              flex-col
              px-6
              pb-16
              pt-7
              sm:px-8
              lg:p-12
            "
          >

            <Link
              href="/"
              className="
                flex
                w-fit
                items-center
              "
            >
              <span
                className="
                  text-2xl
                  font-black
                  tracking-tight
                  text-white
                  sm:text-3xl
                "
              >
                wizenda
              </span>

              <span
                className="
                  ml-1
                  h-2.5
                  w-2.5
                  rounded-full
                  bg-orange-500
                  sm:h-3
                  sm:w-3
                "
              />
            </Link>

            <div
              className="
                mt-auto
                max-w-xl
              "
            >

              <div
                className="
                  mb-4
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-white/15
                  bg-white/10
                  px-3.5
                  py-2
                  text-[11px]
                  font-bold
                  text-white
                  backdrop-blur-md
                "
              >
                <Sparkles
                  size={14}
                  className="text-orange-400"
                />

                Descobre Angola 🇦🇴
              </div>

              <h1
                className="
                  text-4xl
                  font-black
                  leading-[1.02]
                  tracking-tight
                  text-white
                  sm:text-5xl
                  xl:text-6xl
                "
              >
                Descubra
                <br />
                Angola
              </h1>

              <p
                className="
                  mt-4
                  max-w-md
                  text-sm
                  leading-6
                  text-white/80
                  sm:text-base
                "
              >
                Registe-se e descubra o melhor de Angola.
              </p>

              <div
                className="
                  mt-7
                  hidden
                  space-y-3
                  sm:block
                "
              >

                <HeroFeature
                  icon={
                    <MapPin size={16} />
                  }
                  text="Descubra novos destinos"
                />

                <HeroFeature
                  icon={
                    <ShieldCheck size={16} />
                  }
                  text="Agências verificadas"
                />

                <HeroFeature
                  icon={
                    <CheckCircle2 size={16} />
                  }
                  text="Reservas simples e seguras"
                />

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            FORMULÁRIO
        ====================================================== */}

        <section
          className="
            relative
            z-20
            -mt-8
            min-h-screen
            rounded-t-[32px]
            bg-white
            px-5
            pb-10
            pt-7
            sm:-mt-10
            sm:px-8
            sm:pt-9
            lg:mt-0
            lg:rounded-none
            lg:px-12
            lg:py-12
            xl:px-20
          "
        >

          <div
            className="
              mx-auto
              w-full
              max-w-2xl
            "
          >

            {/* LOGO MOBILE */}

            <Link
              href="/"
              className="
                mb-6
                flex
                w-fit
                items-center
                lg:hidden
              "
            >
              <span
                className="
                  text-2xl
                  font-black
                  tracking-tight
                  text-gray-950
                "
              >
                wizenda
              </span>

              <span
                className="
                  ml-1
                  h-2.5
                  w-2.5
                  rounded-full
                  bg-orange-500
                "
              />
            </Link>

            {/* TÍTULO */}

            <div>

              <p
                className="
                  text-sm
                  font-bold
                  text-orange-500
                "
              >
                Registo
              </p>

              <h2
                className="
                  mt-1
                  text-2xl
                  font-black
                  tracking-tight
                  text-orange-500
                  sm:text-4xl
                "
              >
                Crie a sua Conta
              </h2>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-gray-500
                "
              >
                Preencha os seus dados para começar a explorar Angola.
              </p>

            </div>

            {/* TIPO DE CONTA */}

            <div
              className="
                mt-6
                grid
                grid-cols-2
                rounded-2xl
                bg-gray-100
                p-1
              "
            >

              <button
                type="button"
                onClick={() =>
                  selectMode('traveler')
                }
                className={`
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  px-3
                  py-3
                  text-sm
                  font-bold
                  transition

                  ${
                    mode === 'traveler'
                      ? 'bg-white text-gray-950 shadow-sm'
                      : 'text-gray-500'
                  }
                `}
              >
                <UserRound size={17} />

                Cliente
              </button>

              <button
                type="button"
                onClick={() =>
                  selectMode('agency')
                }
                className={`
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  px-3
                  py-3
                  text-sm
                  font-bold
                  transition

                  ${
                    mode === 'agency'
                      ? 'bg-white text-gray-950 shadow-sm'
                      : 'text-gray-500'
                  }
                `}
              >
                <Building2 size={17} />

                Agência
              </button>

            </div>

            {/* =================================================
                CLIENTE
            ================================================== */}

            {mode === 'traveler' && (

              <form
                onSubmit={handleRegister}
                className="
                  mt-5
                  space-y-4
                  sm:mt-7
                  sm:space-y-5
                "
              >

                <div
                  className="
                    rounded-3xl
                    border
                    border-gray-100
                    bg-white
                    p-5
                    shadow-[0_8px_30px_rgba(0,0,0,0.035)]
                    sm:p-6
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-orange-50
                        text-orange-500
                      "
                    >
                      <UserRound size={19} />
                    </div>

                    <div>

                      <p
                        className="
                          text-sm
                          font-black
                          text-gray-950
                        "
                      >
                        Dados pessoais
                      </p>

                      <p
                        className="
                          mt-0.5
                          text-xs
                          text-gray-500
                        "
                      >
                        Conte-nos um pouco sobre si.
                      </p>

                    </div>

                  </div>

                  <div
                    className="
                      mt-5
                      space-y-4
                    "
                  >

                    <Input
                      label="Nome completo"
                      placeholder="O seu nome completo"
                      value={fullName}
                      onChange={setFullName}
                      required
                    />

                    <Input
                      label="E-mail"
                      type="email"
                      placeholder="nome@exemplo.com"
                      value={email}
                      onChange={setEmail}
                      required
                    />

                    <PhoneField
                      label="Número de telefone"
                      value={phone}
                      onChange={setPhone}
                    />

                    <Input
                      label="Cidade"
                      placeholder="Ex.: Luanda"
                      value={city}
                      onChange={setCity}
                      required
                    />

                    <div>

                      <label
                        className="
                          mb-2
                          block
                          text-sm
                          font-bold
                          text-gray-800
                        "
                      >
                        Que tipo de viajante é?
                      </label>

                      <select
                        value={travelerType}
                        onChange={(e) =>
                          setTravelerType(
                            e.target.value,
                          )
                        }
                        required
                        className="
                          h-12
                          w-full
                          rounded-xl
                          border
                          border-gray-200
                          bg-white
                          px-4
                          text-sm
                          text-gray-700
                          outline-none
                          transition
                          focus:border-orange-500
                          focus:ring-4
                          focus:ring-orange-50
                        "
                      >

                        <option value="">
                          Selecione uma opção
                        </option>

                        <option value="turista">
                          Turista
                        </option>

                        <option value="aventureiro">
                          Aventureiro
                        </option>

                        <option value="familia">
                          Viagem em família
                        </option>

                        <option value="negocios">
                          Viagem de negócios
                        </option>

                        <option value="casal">
                          Viagem a dois
                        </option>

                      </select>

                    </div>

                  </div>

                </div>

                <PasswordFields
                  password={password}
                  confirmPassword={confirmPassword}
                  showPassword={showPassword}
                  showConfirmPassword={
                    showConfirmPassword
                  }
                  setPassword={setPassword}
                  setConfirmPassword={
                    setConfirmPassword
                  }
                  setShowPassword={
                    setShowPassword
                  }
                  setShowConfirmPassword={
                    setShowConfirmPassword
                  }
                />

                {message && (
                  <MessageBox
                    type={messageType}
                    message={message}
                  />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    group
                    flex
                    h-13
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-orange-500
                    px-5
                    text-sm
                    font-black
                    text-white
                    shadow-lg
                    shadow-orange-500/20
                    transition
                    hover:bg-orange-600
                    active:scale-[0.99]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >

                  {loading
                    ? 'A criar conta...'
                    : 'Criar conta'}

                  {!loading && (
                    <ArrowRight size={17} />
                  )}

                </button>

              </form>
            )}

            {/* =================================================
                AGÊNCIA
            ================================================== */}

            {mode === 'agency' && (

              <form
                onSubmit={handleRegister}
                className="
                  mt-5
                  space-y-4
                  sm:mt-7
                  sm:space-y-5
                "
              >

                <div
                  className="
                    rounded-2xl
                    border
                    border-orange-100
                    bg-orange-50
                    p-4
                  "
                >

                  <div
                    className="
                      flex
                      gap-3
                    "
                  >

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-orange-500
                        text-white
                      "
                    >
                      <Building2 size={19} />
                    </div>

                    <div>

                      <p
                        className="
                          text-sm
                          font-black
                          text-gray-950
                        "
                      >
                        Registo de agência
                      </p>

                      <p
                        className="
                          mt-1
                          text-xs
                          leading-5
                          text-gray-600
                        "
                      >
                        A agência será analisada pela equipa Wizenda antes da verificação.
                      </p>

                    </div>

                  </div>

                </div>

                {/* DADOS DA EMPRESA */}

                <div
                  className="
                    rounded-3xl
                    border
                    border-gray-100
                    bg-white
                    p-5
                    shadow-[0_8px_30px_rgba(0,0,0,0.035)]
                    sm:p-6
                  "
                >

                  <h3
                    className="
                      text-base
                      font-black
                      text-gray-950
                    "
                  >
                    Dados da empresa
                  </h3>

                  <div
                    className="
                      mt-5
                      grid
                      gap-4
                      sm:grid-cols-2
                    "
                  >

                    <Input
                      label="Nome comercial"
                      placeholder="Nome da agência"
                      value={commercialName}
                      onChange={setCommercialName}
                      required
                    />

                    <Input
                      label="Razão social"
                      placeholder="Nome legal da empresa"
                      value={legalName}
                      onChange={setLegalName}
                      required
                    />

                    <Input
                      label="NIF"
                      placeholder="Número de identificação fiscal"
                      value={nif}
                      onChange={setNif}
                      required
                    />

                    <Input
                      label="Pessoa responsável"
                      placeholder="Nome do responsável"
                      value={responsibleName}
                      onChange={setResponsibleName}
                      required
                    />

                    <PhoneField
                      label="Telefone da agência"
                      value={agencyPhone}
                      onChange={setAgencyPhone}
                    />

                    <Input
                      label="E-mail empresarial"
                      type="email"
                      placeholder="empresa@exemplo.com"
                      value={agencyEmail}
                      onChange={setAgencyEmail}
                      required
                    />

                  </div>

                </div>

                {/* LOCALIZAÇÃO */}

                <div
                  className="
                    rounded-3xl
                    border
                    border-gray-100
                    bg-white
                    p-5
                    shadow-[0_8px_30px_rgba(0,0,0,0.035)]
                    sm:p-6
                  "
                >

                  <h3
                    className="
                      text-base
                      font-black
                      text-gray-950
                    "
                  >
                    Localização
                  </h3>

                  <div
                    className="
                      mt-5
                      grid
                      gap-4
                      sm:grid-cols-2
                    "
                  >

                    <Input
                      label="Província"
                      placeholder="Ex.: Luanda"
                      value={province}
                      onChange={setProvince}
                      required
                    />

                    <Input
                      label="Cidade"
                      placeholder="Cidade"
                      value={agencyCity}
                      onChange={setAgencyCity}
                      required
                    />

                  </div>

                  <div className="mt-4">

                    <Input
                      label="Morada"
                      placeholder="Morada da empresa"
                      value={address}
                      onChange={setAddress}
                      required
                    />

                  </div>

                </div>

                {/* DOCUMENTOS */}

                <div
                  className="
                    rounded-3xl
                    border
                    border-gray-100
                    bg-white
                    p-5
                    shadow-[0_8px_30px_rgba(0,0,0,0.035)]
                    sm:p-6
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-orange-50
                        text-orange-500
                      "
                    >
                      <FileText size={19} />
                    </div>

                    <div>

                      <h3
                        className="
                          text-base
                          font-black
                          text-gray-950
                        "
                      >
                        Documentos de verificação
                      </h3>

                      <p
                        className="
                          mt-1
                          text-xs
                          text-gray-500
                        "
                      >
                        Documentos necessários para análise.
                      </p>

                    </div>

                  </div>

                  <div
                    className="
                      mt-5
                      space-y-4
                    "
                  >

                    <DocumentInput
                      label="BI / documento do responsável"
                      file={responsibleDocument}
                      onChange={
                        setResponsibleDocument
                      }
                    />

                    <DocumentInput
                      label="Documento da empresa"
                      file={companyDocument}
                      onChange={
                        setCompanyDocument
                      }
                    />

                    <DocumentInput
                      label="Documento do NIF"
                      file={nifDocument}
                      onChange={
                        setNifDocument
                      }
                    />

                    <DocumentInput
                      label="Alvará / licença"
                      file={licenseDocument}
                      onChange={
                        setLicenseDocument
                      }
                    />

                    <DocumentInput
                      label="Comprovativo de morada"
                      file={proofOfAddress}
                      onChange={
                        setProofOfAddress
                      }
                    />

                  </div>

                </div>

                <PasswordFields
                  password={password}
                  confirmPassword={confirmPassword}
                  showPassword={showPassword}
                  showConfirmPassword={
                    showConfirmPassword
                  }
                  setPassword={setPassword}
                  setConfirmPassword={
                    setConfirmPassword
                  }
                  setShowPassword={
                    setShowPassword
                  }
                  setShowConfirmPassword={
                    setShowConfirmPassword
                  }
                />

                <div
                  className="
                    rounded-xl
                    border
                    border-gray-100
                    bg-gray-50
                    p-4
                  "
                >

                  <div
                    className="
                      flex
                      gap-3
                    "
                  >

                    <ShieldCheck
                      size={18}
                      className="
                        mt-0.5
                        shrink-0
                        text-orange-500
                      "
                    />

                    <p
                      className="
                        text-xs
                        leading-5
                        text-gray-500
                      "
                    >
                      A criação da conta não significa que a agência foi verificada. A equipa Wizenda analisará os documentos antes de aprovar a agência.
                    </p>

                  </div>

                </div>

                {message && (
                  <MessageBox
                    type={messageType}
                    message={message}
                  />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    group
                    flex
                    h-13
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-orange-500
                    px-5
                    text-sm
                    font-black
                    text-white
                    shadow-lg
                    shadow-orange-500/20
                    transition
                    hover:bg-orange-600
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                >

                  {loading
                    ? 'A criar conta...'
                    : 'Enviar registo da agência'}

                  {!loading && (
                    <ArrowRight size={17} />
                  )}

                </button>

              </form>
            )}

            {/* LOGIN */}

            <div
              className="
                mt-7
                pb-8
                text-center
              "
            >

              <p
                className="
                  text-sm
                  text-gray-500
                "
              >
                Já tem uma conta?
              </p>

              <Link
                href="/login"
                className="
                  mt-2
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-black
                  text-blue-600
                  transition
                  hover:text-blue-700
                "
              >
                Entrar na minha conta

                <ArrowRight size={15} />
              </Link>

            </div>

          </div>

        </section>

      </div>

    </main>
  )
}

/* ============================================================
   HERO FEATURE
============================================================ */

function HeroFeature({
  icon,
  text,
}: {
  icon: React.ReactNode
  text: string
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        text-sm
        font-semibold
        text-white/85
      "
    >

      <div
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          bg-white/10
          text-orange-400
          backdrop-blur
        "
      >
        {icon}
      </div>

      {text}

    </div>
  )
}

/* ============================================================
   PHONE INPUT
============================================================ */

function PhoneField({
  label,
  value,
  onChange,
}: {
  label: string
  value: Value
  onChange: (value: Value) => void
}) {
  const [country, setCountry] =
    useState<Country>('AO')

  function handleCountryChange(
    newCountry: Country,
  ) {
    setCountry(newCountry)

    // Limpa o número porque o formato
    // muda de acordo com o país.
    onChange('')
  }

  return (
    <div>

      <label
        className="
          mb-2
          block
          text-sm
          font-bold
          text-gray-800
        "
      >
        {label}
      </label>

      <div className="flex w-full gap-2">

        {/* ==================================================
            CÓDIGO DO PAÍS
        =================================================== */}

        <div
          className="
            relative
            h-12
            w-[105px]
            shrink-0
          "
        >

          <select
            value={country}
            onChange={(event) =>
              handleCountryChange(
                event.target.value as Country,
              )
            }
            aria-label="Código do país"
            className="
              h-full
              w-full
              appearance-none
              rounded-xl
              border
              border-gray-200
              bg-white
              pl-3
              pr-8
              text-sm
              font-bold
              text-gray-800
              outline-none
              transition
              focus:border-orange-500
              focus:ring-4
              focus:ring-orange-50
            "
          >

            {getCountries().map(
              (countryCode) => (
                <option
                  key={countryCode}
                  value={countryCode}
                >
                  +{getCountryCallingCode(
                    countryCode,
                  )}
                </option>
              ),
            )}

          </select>

          <ChevronDown
            size={16}
            className="
              pointer-events-none
              absolute
              right-3
              top-1/2
              -translate-y-1/2
              text-gray-400
            "
          />

        </div>

        {/* ==================================================
            NÚMERO
        =================================================== */}

        <div
          className="
            flex
            h-12
            min-w-0
            flex-1
            items-center
            rounded-xl
            border
            border-gray-200
            bg-white
            px-4
            transition
            focus-within:border-orange-500
            focus-within:ring-4
            focus-within:ring-orange-50
          "
        >

          <PhoneInput
            country={country}
            value={value}
            onChange={onChange}
            placeholder="923 456 789"
            className="wizenda-phone-number"
          />

        </div>

      </div>

      <p
        className="
          mt-1.5
          text-[11px]
          text-gray-400
        "
      >
        Escolha o código do país e introduza o número.
      </p>

    </div>
  )
}

/* ============================================================
   INPUT
============================================================ */

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  required?: boolean
}) {
  return (
    <div>

      <label
        className="
          mb-2
          block
          text-sm
          font-bold
          text-gray-800
        "
      >
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value,
          )
        }
        required={required}
        className="
          h-12
          w-full
          rounded-xl
          border
          border-gray-200
          bg-white
          px-4
          text-sm
          text-gray-950
          outline-none
          transition
          placeholder:text-gray-400
          focus:border-orange-500
          focus:ring-4
          focus:ring-orange-50
        "
      />

    </div>
  )
}

/* ============================================================
   PASSWORD
============================================================ */

function PasswordFields({
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  setPassword,
  setConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
}: {
  password: string
  confirmPassword: string
  showPassword: boolean
  showConfirmPassword: boolean
  setPassword: (value: string) => void
  setConfirmPassword: (value: string) => void
  setShowPassword: (value: boolean) => void
  setShowConfirmPassword: (value: boolean) => void
}) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-gray-100
        bg-white
        p-5
        shadow-[0_8px_30px_rgba(0,0,0,0.035)]
        sm:p-6
      "
    >

      <h3
        className="
          text-base
          font-black
          text-gray-950
        "
      >
        Segurança da conta
      </h3>

      <div
        className="
          mt-5
          grid
          gap-4
          sm:grid-cols-2
          sm:gap-5
        "
      >

        <PasswordInput
          label="Palavra-passe"
          placeholder="Mínimo 6 caracteres"
          value={password}
          show={showPassword}
          setValue={setPassword}
          setShow={setShowPassword}
        />

        <PasswordInput
          label="Confirmar palavra-passe"
          placeholder="Repita a palavra-passe"
          value={confirmPassword}
          show={showConfirmPassword}
          setValue={setConfirmPassword}
          setShow={setShowConfirmPassword}
        />

      </div>

    </div>
  )
}

function PasswordInput({
  label,
  placeholder,
  value,
  show,
  setValue,
  setShow,
}: {
  label: string
  placeholder: string
  value: string
  show: boolean
  setValue: (value: string) => void
  setShow: (value: boolean) => void
}) {
  return (
    <div>

      <label
        className="
          mb-2
          block
          text-sm
          font-bold
          text-gray-800
        "
      >
        {label}
      </label>

      <div className="relative">

        <input
          type={
            show
              ? 'text'
              : 'password'
          }
          placeholder={placeholder}
          value={value}
          onChange={(e) =>
            setValue(
              e.target.value,
            )
          }
          required
          minLength={6}
          className="
            h-12
            w-full
            rounded-xl
            border
            border-gray-200
            bg-white
            px-4
            pr-12
            text-sm
            outline-none
            transition
            focus:border-orange-500
            focus:ring-4
            focus:ring-orange-50
          "
        />

        <button
          type="button"
          onClick={() =>
            setShow(!show)
          }
          className="
            absolute
            right-2
            top-1/2
            flex
            h-8
            w-8
            -translate-y-1/2
            items-center
            justify-center
            rounded-lg
            text-gray-400
            transition
            hover:bg-gray-100
          "
        >
          {show ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>

      </div>

    </div>
  )
}

/* ============================================================
   DOCUMENT
============================================================ */

function DocumentInput({
  label,
  file,
  onChange,
}: {
  label: string
  file: File | null
  onChange: (file: File | null) => void
}) {
  return (
    <div>

      <label
        className="
          mb-2
          block
          text-sm
          font-bold
          text-gray-800
        "
      >
        {label}
      </label>

      <label
        className="
          flex
          min-h-14
          cursor-pointer
          items-center
          gap-3
          rounded-xl
          border
          border-dashed
          border-gray-300
          bg-gray-50
          px-4
          transition
          hover:border-orange-400
          hover:bg-orange-50/40
        "
      >

        <div
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-lg
            bg-white
            text-gray-500
            shadow-sm
          "
        >
          <FileText size={17} />
        </div>

        <div
          className="
            min-w-0
            flex-1
          "
        >

          <p
            className="
              truncate
              text-sm
              font-medium
              text-gray-700
            "
          >
            {file
              ? file.name
              : 'Selecionar documento'}
          </p>

          <p
            className="
              text-xs
              text-gray-400
            "
          >
            PDF, JPG ou PNG
          </p>

        </div>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) =>
            onChange(
              e.target.files?.[0] ||
                null,
            )
          }
        />

      </label>

    </div>
  )
}

/* ============================================================
   MESSAGE
============================================================ */

function MessageBox({
  type,
  message,
}: {
  type: 'error' | 'success'
  message: string
}) {
  return (
    <div
      className={`
        rounded-xl
        border
        p-4
        text-sm

        ${
          type === 'success'
            ? 'border-green-100 bg-green-50 text-green-700'
            : 'border-red-100 bg-red-50 text-red-700'
        }
      `}
    >
      {message}
    </div>
  )
}