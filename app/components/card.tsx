import { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
}

export default function Card({
  children,
  className = '',
}: CardProps) {
  return (
    <div
      className={`rounded-3xl border border-gray-100 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}