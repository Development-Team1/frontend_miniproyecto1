import { useEffect, useState } from 'react'

// Devuelve true si una espera supera `ms`: sirve para explicar por qué tarda el servidor.
export function useAvisoLento(esperando, ms = 4000) {
  const [lento, setLento] = useState(false)
  useEffect(() => {
    if (!esperando) {
      setLento(false)
      return
    }
    const t = setTimeout(() => setLento(true), ms)
    return () => clearTimeout(t)
  }, [esperando, ms])
  return lento
}

export const MENSAJE_SERVIDOR_LENTO =
  'El servidor estaba en reposo y se está despertando. La primera vez puede tardar hasta un minuto.'
