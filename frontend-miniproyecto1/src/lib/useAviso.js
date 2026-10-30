import { useCallback, useEffect, useState } from 'react'

/*
 * Aviso temporal (toast) que puede traer un botón «Deshacer».
 * `avisar(texto, deshacer)`: `deshacer` es opcional; es una función async que revierte el cambio y devuelve el texto
 * del nuevo aviso. Mientras se deshace el aviso no se cierra, y si falla se muestra el error.
 */
export function useAviso() {
  const [aviso, setAviso] = useState(null) // { texto, deshacer? } | null
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    if (!aviso || ocupado) return
    const t = setTimeout(() => setAviso(null), aviso.deshacer ? 9000 : 6000)
    return () => clearTimeout(t)
  }, [aviso, ocupado])

  const avisar = useCallback((texto, deshacer) => {
    if (texto) setAviso({ texto, deshacer: deshacer || undefined })
  }, [])

  const deshacer = useCallback(async () => {
    if (!aviso?.deshacer) return
    setOcupado(true)
    try {
      setAviso({ texto: (await aviso.deshacer()) || 'Cambio deshecho.' })
    } catch (err) {
      setAviso({ texto: `No se pudo deshacer: ${err.message}` })
    } finally {
      setOcupado(false)
    }
  }, [aviso])

  return { aviso, avisar, deshacer, ocupado }
}
