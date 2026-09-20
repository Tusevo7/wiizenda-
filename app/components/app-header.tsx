
'use client'

import Link from 'next/link'
import {
  Bell,
  CalendarDays,
  CircleHelp,
  Heart,
  Hotel,
  MapPin,
  Menu,
  MessageCircle,
  Map,
  Settings,
  Star,
  Ticket,
  Utensils,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

import NotificationBell from './notification-bell'
import MessageBadge from './message-badge'

export default function AppHeader() {
  const [homeHref, setHomeHref] = useState('/')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setHomeHref('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.role === 'agency') {
        setHomeHref('/agency')
        return
      }

      setHomeHref('/')
    }

    loadRole()
  }, [])

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">

          {/* LOGO */}
          <Link
            href={homeHref}
            className="flex items-center"
            aria-label="Wizenda"
          >
            <span className="text-2xl font-black tracking-tight text-gray-950">
              wizenda
            </span>

            <span className="ml-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
          </Link>

          {/* LOCALIZAÇÃO */}
          <div className="hidden items-center gap-2 rounded-full bg-gray-50 px-4 py-2 sm:flex">
            <MapPin
              size={16}
              className="text-orange-500"
            />

            <span className="text-sm font-medium text-gray-700">
              Angola
            </span>
          </div>

          {/* AÇÕES */}
          <div className="flex items-center gap-1">

            {/* MENSAGENS */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100">
              <MessageBadge />
            </div>

            {/* NOTIFICAÇÕES */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100">
              <NotificationBell />
            </div>

            {/* MENU */}
            <button
              type="button"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
            >
              <Menu
                size={21}
                className="text-gray-700"
              />
            </button>

          </div>
        </div>
      </header>

      {/* OVERLAY */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={closeMenu}
          className="fixed inset-0 z-50 bg-black/30"
        />
      )}

      {/* MENU LATERAL */}
      <aside
        className={`fixed right-0 top-0 z-[60] h-full w-[min(88vw,380px)] bg-white shadow-2xl transition-transform duration-300 ${
          menuOpen
            ? 'translate-x-0'
            : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">

          {/* CABEÇALHO DO MENU */}
          <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
            <div className="flex items-center">
              <span className="text-xl font-black tracking-tight text-gray-950">
                wizenda
              </span>

              <span className="ml-1 h-2 w-2 rounded-full bg-orange-500" />
            </div>

            <button
              type="button"
              onClick={closeMenu}
              aria-label="Fechar menu"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X
                size={21}
                className="text-gray-700"
              />
            </button>
          </div>

          {/* NAVEGAÇÃO */}
          <nav className="flex-1 overflow-y-auto px-4 py-5">

            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Descobrir
            </p>

            <div className="space-y-1">

              <Link
                href="/hotels"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Hotel size={19} className="text-gray-500" />
                Hotéis
              </Link>

              <Link
                href="/resorts"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Map size={19} className="text-gray-500" />
                Resorts
              </Link>

              <Link
                href="/restaurants"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Utensils size={19} className="text-gray-500" />
                Restaurantes
              </Link>

              <Link
                href="/destinations"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <MapPin size={19} className="text-gray-500" />
                Destinos
              </Link>

              <Link
                href="/provinces"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Map size={19} className="text-gray-500" />
                Províncias
              </Link>

              <Link
                href="/experiences"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Star size={19} className="text-gray-500" />
                Experiências
              </Link>

              <Link
                href="/events"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <CalendarDays size={19} className="text-gray-500" />
                Eventos
              </Link>

              <Link
                href="/transport"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Ticket size={19} className="text-gray-500" />
                Transporte
              </Link>

            </div>

            <div className="my-5 border-t border-gray-100" />

            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Comunidade
            </p>

            <div className="space-y-1">

              {/* REVIEW */}
              <Link
                href="/review"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-semibold text-gray-900 hover:bg-orange-50"
              >
                <Star
                  size={19}
                  className="text-orange-500"
                />
                Review
              </Link>

              <Link
                href="/favorites"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Heart size={19} className="text-gray-500" />
                Favoritos
              </Link>

              <Link
                href="/messages"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <MessageCircle size={19} className="text-gray-500" />
                Mensagens
              </Link>

              <Link
                href="/notifications"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Bell size={19} className="text-gray-500" />
                Notificações
              </Link>

            </div>

            <div className="my-5 border-t border-gray-100" />

            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              A minha conta
            </p>

            <div className="space-y-1">

              <Link
                href="/bookings"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Ticket size={19} className="text-gray-500" />
                Minhas reservas
              </Link>

              <Link
                href="/profile"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Heart size={19} className="text-gray-500" />
                Meu perfil
              </Link>

              <Link
                href="/settings"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Settings size={19} className="text-gray-500" />
                Definições
              </Link>

              <Link
                href="/help"
                onClick={closeMenu}
                className="flex items-center gap-3 rounded-[4px] px-3 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <CircleHelp size={19} className="text-gray-500" />
                Ajuda
              </Link>

            </div>

          </nav>

          {/* RODAPÉ */}
          <div className="border-t border-gray-100 px-5 py-4">
            <p className="text-center text-xs text-gray-400">
              Wizenda · Descobre Angola
            </p>
          </div>

        </div>
      </aside>
    </>
  )
}
