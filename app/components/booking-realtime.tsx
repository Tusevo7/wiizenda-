'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BookingRealtime({
  userId,
}: {
  userId: string
}) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`bookings-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          window.location.reload()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return null
}