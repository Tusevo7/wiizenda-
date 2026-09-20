
'use client'

import Link from 'next/link'
import {
  Bell,
  CheckCircle2,
  XCircle,
  CalendarCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  booking_id: string | null
  conversation_id: string | null
  read: boolean
  created_at: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function loadNotifications() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select(
          'id, type, title, message, booking_id, conversation_id, read, created_at',
        )
        .eq('user_id', user.id)
        .neq('type', 'new_message')
        .order('created_at', {
          ascending: false,
        })
        .limit(20)

      if (error) {
        console.error(
          'Erro ao carregar notificações:',
          error,
        )
        return
      }

      setNotifications(data || [])
    }

    loadNotifications()

    let channel:
      ReturnType<typeof supabase.channel> | null = null

    async function subscribe() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const notification =
              payload.new as Notification

            if (
              notification.type === 'new_message'
            ) {
              return
            }

            setNotifications((current) => [
              notification,
              ...current,
            ])
          },
        )
        .subscribe()
    }

    subscribe()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length

  async function markAsRead(id: string) {
    const supabase = createClient()

    await supabase
      .from('notifications')
      .update({
        read: true,
      })
      .eq('id', id)

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    )
  }

  async function markAllAsRead() {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase
      .from('notifications')
      .update({
        read: true,
      })
      .eq('user_id', user.id)
      .eq('read', false)
      .neq('type', 'new_message')

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      })),
    )
  }

  function getNotificationHref(
    notification: Notification,
  ) {
    if (notification.type === 'booking_new') {
      return '/agency/bookings'
    }

    if (
      notification.type === 'booking_confirmed' ||
      notification.type === 'booking_cancelled'
    ) {
      if (notification.booking_id) {
        return `/bookings?booking=${notification.booking_id}`
      }
    }

    if (notification.booking_id) {
      return `/bookings?booking=${notification.booking_id}`
    }

    return '#'
  }

  function getNotificationAction(
    notification: Notification,
  ) {
    if (notification.booking_id) {
      return 'Ver reserva'
    }

    return null
  }

  function getNotificationIcon(
    notification: Notification,
  ) {
    if (
      notification.type === 'booking_confirmed'
    ) {
      return (
        <CheckCircle2
          size={19}
          className="text-green-600"
        />
      )
    }

    if (
      notification.type === 'booking_cancelled'
    ) {
      return (
        <XCircle
          size={19}
          className="text-red-500"
        />
      )
    }

    if (
      notification.type === 'booking_new'
    ) {
      return (
        <CalendarCheck
          size={19}
          className="text-orange-500"
        />
      )
    }

    if (notification.booking_id) {
      return (
        <CalendarCheck
          size={19}
          className="text-orange-500"
        />
      )
    }

    return <Bell size={18} />
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Notificações"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50"
      >
        <Bell size={19} />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Fechar notificações"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute right-0 top-14 z-50 w-[min(92vw,380px)] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

              <div>
                <h2 className="font-black">
                  Notificações
                </h2>

                {unreadCount > 0 && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {unreadCount}{' '}
                    {unreadCount === 1
                      ? 'nova notificação'
                      : 'novas notificações'}
                  </p>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-orange-500 hover:text-orange-600"
                >
                  Marcar todas
                </button>
              )}

            </div>

            <div className="max-h-[420px] overflow-y-auto">

              {notifications.length > 0 ? (
                notifications.map((notification) => {

                  const action =
                    getNotificationAction(
                      notification,
                    )

                  return (
                    <div
                      key={notification.id}
                      className={`border-b border-gray-50 transition hover:bg-gray-50 ${
                        !notification.read
                          ? 'bg-orange-50/40'
                          : 'bg-white'
                      }`}
                    >

                      <Link
                        href={getNotificationHref(
                          notification,
                        )}
                        onClick={() =>
                          markAsRead(
                            notification.id,
                          )
                        }
                        className="group block px-5 py-4"
                      >

                        <div className="flex gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50">
                            {getNotificationIcon(
                              notification,
                            )}
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="flex items-start justify-between gap-2">

                              <p className="text-sm font-bold text-gray-900">
                                {notification.title}
                              </p>

                              {!notification.read && (
                                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                              )}

                            </div>

                            <p className="mt-1 text-sm leading-5 text-gray-500">
                              {notification.message}
                            </p>

                            <div className="mt-3 flex items-center justify-between gap-3">

                              <p className="text-[11px] text-gray-400">
                                {new Date(
                                  notification.created_at,
                                ).toLocaleString(
                                  'pt-AO',
                                )}
                              </p>

                              {action && (
                                <span className="shrink-0 text-xs font-bold text-orange-500 transition group-hover:text-orange-600">
                                  {action} →
                                </span>
                              )}

                            </div>

                          </div>

                        </div>

                      </Link>

                    </div>
                  )
                })
              ) : (
                <div className="px-5 py-12 text-center">

                  <Bell
                    size={28}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 text-sm font-bold text-gray-700">
                    Nenhuma notificação
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Quando acontecer algo importante,
                    aparecerá aqui.
                  </p>

                </div>
              )}

            </div>
          </div>
        </>
      )}
    </div>
  )
}
