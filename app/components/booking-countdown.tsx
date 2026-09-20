
'use client'

import { useEffect, useState } from 'react'

type BookingCountdownProps = {
  expiresAt: string
}

function getRemainingTime(expiresAt: string) {
  const difference =
    new Date(expiresAt).getTime() - Date.now()

  if (difference <= 0) {
    return null
  }

  const totalSeconds = Math.floor(
    difference / 1000,
  )

  const days = Math.floor(
    totalSeconds / 86400,
  )

  const hours = Math.floor(
    (totalSeconds % 86400) / 3600,
  )

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60,
  )

  const seconds =
    totalSeconds % 60

  return {
    days,
    hours,
    minutes,
    seconds,
  }
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export default function BookingCountdown({
  expiresAt,
}: BookingCountdownProps) {
  const [remaining, setRemaining] =
    useState(() =>
      getRemainingTime(expiresAt),
    )

  useEffect(() => {
    function update() {
      setRemaining(
        getRemainingTime(expiresAt),
      )
    }

    update()

    const interval = setInterval(
      update,
      1000,
    )

    return () => {
      clearInterval(interval)
    }
  }, [expiresAt])

  if (!remaining) {
    return (
      <span className="font-black text-red-600">
        Prazo expirado
      </span>
    )
  }

  const {
    days,
    hours,
    minutes,
    seconds,
  } = remaining

  return (
    <span className="font-black text-orange-600">
      {days > 0 && `${days}d `}
      {pad(hours)}:{pad(minutes)}:{pad(seconds)}
    </span>
  )
}
