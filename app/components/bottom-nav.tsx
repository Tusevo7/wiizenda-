
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Search,
  PlaySquare,
  Heart,
  CalendarDays,
} from 'lucide-react'

const items = [
  {
    label: 'Início',
    href: '/',
    icon: Home,
  },
  {
    label: 'Explorar',
    href: '/explore',
    icon: Search,
  },
  {
    label: 'Review',
    href: '/review',
    icon: PlaySquare,
    featured: true,
  },
  {
    label: 'Favoritos',
    href: '/favorites',
    icon: Heart,
  },
  {
    label: 'Reservas',
    href: '/bookings',
    icon: CalendarDays,
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex h-[70px] max-w-md items-center justify-around px-2">

        {items.map((item) => {
          const Icon = item.icon

          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          /* REVIEW CENTRAL */
          if (item.featured) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex min-w-16 flex-col items-center justify-center"
              >
                <div
                  className={`absolute -top-8 flex h-[58px] w-[58px] items-center justify-center rounded-full border-[5px] border-white bg-orange-500 shadow-lg transition-transform ${
                    active ? 'scale-105' : ''
                  }`}
                >
                  <Icon
                    size={25}
                    strokeWidth={2.3}
                    className="text-white"
                  />
                </div>

                <span
                  className={`mt-7 text-[10px] font-semibold ${
                    active
                      ? 'text-gray-950'
                      : 'text-gray-500'
                  }`}
                >
                  Review
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-16 flex-col items-center justify-center gap-1 py-2"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  active
                    ? 'bg-orange-50 text-orange-500'
                    : 'text-gray-500'
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>

              <span
                className={`text-[10px] font-medium ${
                  active
                    ? 'text-gray-950'
                    : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

      </div>
    </nav>
  )
}
