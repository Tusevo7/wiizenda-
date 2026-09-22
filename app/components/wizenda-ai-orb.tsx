
'use client'

import { motion } from 'framer-motion'

export default function WizendaAiOrb() {
  return (
    <motion.div
      className="relative h-full w-full overflow-hidden rounded-full"
      animate={{
        scale: [1, 1.04, 1],
      }}
      transition={{
        duration: 3.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        background: `
          radial-gradient(
            circle at 50% 50%,
            #35ff8a 0%,
            #12d96d 18%,
            #1268ff 38%,
            #7628ff 55%,
            #ff3b18 72%,
            #ff7900 86%,
            #140805 100%
          )
        `,
        boxShadow: `
          0 0 18px rgba(255, 70, 20, 0.8),
          0 0 35px rgba(110, 40, 255, 0.65),
          0 0 55px rgba(20, 230, 130, 0.35)
        `,
      }}
    >

      {/* FLUIDO */}
      <motion.div
        className="absolute -inset-[25%] rounded-full"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.15, 0.98, 1],
        }}
        transition={{
          rotate: {
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
          },
          scale: {
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
        style={{
          background: `
            conic-gradient(
              from 0deg,
              #ff2d00,
              #ff7a00,
              #39ff88,
              #008cff,
              #7b2cff,
              #ff285f,
              #ff2d00
            )
          `,
          filter: 'blur(10px)',
          opacity: 0.9,
        }}
      />

      {/* NÚCLEO VERDE */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[55%] w-[55%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={{
          scale: [1, 1.12, 1],
        }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background:
            'radial-gradient(circle, #8affbd 0%, #21ed78 35%, #00a957 65%, transparent 100%)',
          filter: 'blur(2px)',
          boxShadow: '0 0 25px rgba(50,255,140,0.55)',
        }}
      />

      {/* REFLEXO */}
      <div
        className="absolute left-[15%] top-[10%] h-[35%] w-[55%] rounded-full blur-xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.55), transparent 70%)',
        }}
      />

      {/* OLHOS */}
      <motion.div
        className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
        animate={{
          x: [-4, 5, -5, 4, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >

        {/* OLHO ESQUERDO */}
        <motion.span
          className="h-[28%] w-[9%] min-h-[13px] min-w-[5px] rounded-full bg-white"
          style={{
            boxShadow: '0 0 10px rgba(255,255,255,0.95)',
          }}
          animate={{
            scaleY: [1, 1, 0.15, 1, 1],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            times: [0, 0.72, 0.78, 0.84, 1],
          }}
        />

        {/* OLHO DIREITO */}
        <motion.span
          className="h-[28%] w-[9%] min-h-[13px] min-w-[5px] rounded-full bg-white"
          style={{
            boxShadow: '0 0 10px rgba(255,255,255,0.95)',
          }}
          animate={{
            scaleY: [1, 1, 0.15, 1, 1],
          }}
          transition={{
            duration: 4.5,
            delay: 0.06,
            repeat: Infinity,
            times: [0, 0.72, 0.78, 0.84, 1],
          }}
        />

      </motion.div>

      {/* BRILHO FINAL */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.22), transparent 35%)',
        }}
      />

    </motion.div>
  )
}
