
'use client'

import { useEffect } from 'react'

export default function AgencyScannerPage() {
  useEffect(() => {
    const script = document.createElement('script')

    script.src =
      'https://unpkg.com/html5-qrcode'

    script.async = true

    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  function abrirCamera() {
    const Html5Qrcode = (
      window as any
    ).Html5Qrcode

    if (!Html5Qrcode) {
      alert('Scanner ainda está a carregar. Tenta novamente.')
      return
    }

    const scanner = new Html5Qrcode(
      'reader'
    )

    scanner.start(
      {
        facingMode: 'environment',
      },
      {
        fps: 10,
        qrbox: 250,
      },
      (decodedText: string) => {
        alert(
          'QR Code encontrado:\n\n' +
            decodedText
        )

        scanner.stop()
      },
      () => {}
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f7f7f7',
        padding: '30px 20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '500px',
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: '24px',
          padding: '25px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '26px',
            fontWeight: 800,
          }}
        >
          Scanner de bilhetes
        </h1>

        <p
          style={{
            color: '#666',
            fontSize: '14px',
          }}
        >
          Aponte a câmera para o QR Code
          do bilhete.
        </p>

        <div
          id="reader"
          style={{
            width: '100%',
            marginTop: '25px',
          }}
        />

        <button
          type="button"
          onClick={abrirCamera}
          style={{
            width: '100%',
            marginTop: '20px',
            padding: '18px',
            border: 'none',
            borderRadius: '16px',
            background: '#ff5a1f',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 700,
          }}
        >
          ABRIR CÂMERA
        </button>

        <a
          href="/agency"
          style={{
            display: 'block',
            marginTop: '12px',
            padding: '18px',
            borderRadius: '16px',
            background: '#111',
            color: '#fff',
            textAlign: 'center',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          VOLTAR PARA AGÊNCIA
        </a>
      </div>
    </div>
  )
}
