
'use client'

import { ArrowDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type ChatScrollBottomProps = {
  dependency: unknown
}

export default function ChatScrollBottom({
  dependency,
}: ChatScrollBottomProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const firstRenderRef = useRef(true)
  const wasAtBottomRef = useRef(true)

  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const bottomElement = bottomRef.current

    if (!bottomElement) return

    const element =
      bottomElement.closest('[data-chat-scroll]')

    if (!(element instanceof HTMLElement)) {
      return
    }

    const scrollContainer: HTMLElement = element

    function checkPosition() {
      const distanceFromBottom =
        scrollContainer.scrollHeight -
        scrollContainer.scrollTop -
        scrollContainer.clientHeight

      const isAtBottom = distanceFromBottom < 100

      wasAtBottomRef.current = isAtBottom

      setShowButton(!isAtBottom)
    }

    checkPosition()

    scrollContainer.addEventListener(
      'scroll',
      checkPosition,
      { passive: true },
    )

    if (
      firstRenderRef.current ||
      wasAtBottomRef.current
    ) {
      requestAnimationFrame(() => {
        bottomElement.scrollIntoView({
          behavior: firstRenderRef.current
            ? 'auto'
            : 'smooth',
          block: 'end',
        })
      })
    }

    firstRenderRef.current = false

    return () => {
      scrollContainer.removeEventListener(
        'scroll',
        checkPosition,
      )
    }
  }, [dependency])

  function goToBottom() {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }

  return (
    <>
      <div
        ref={bottomRef}
        aria-hidden="true"
      />

      {showButton && (
        <button
          type="button"
          onClick={goToBottom}
          aria-label="Ir para a última mensagem"
          title="Ir para a última mensagem"
          className="absolute bottom-5 left-1/2 z-30 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition hover:scale-105 hover:bg-gray-50 active:scale-95"
        >
          <ArrowDown
            size={19}
            strokeWidth={2.5}
            className="text-gray-700"
          />
        </button>
      )}
    </>
  )
}
