import { ButtonHTMLAttributes } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      'bg-orange-500 text-white hover:bg-orange-600',
    secondary:
      'bg-gray-100 text-gray-900 hover:bg-gray-200',
    ghost:
      'bg-transparent text-gray-700 hover:bg-gray-100',
  }

  return (
    <button
      className={`rounded-2xl px-5 py-3 font-semibold transition active:scale-[0.98] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}