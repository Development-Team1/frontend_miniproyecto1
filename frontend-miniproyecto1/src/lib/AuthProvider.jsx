import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, setUnauthorizedHandler, tokenStore } from './api'
import { AuthContext } from './auth-context'
import { navigate } from './router'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // loading: comprobando sesión guardada | anon: sin sesión | auth: sesión activa
  const [status, setStatus] = useState(tokenStore.get() ? 'loading' : 'anon')
  const [aviso, setAviso] = useState('')

  const cerrarSesion = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('anon')
    navigate('/', { replace: true })
  }, [])

  const sesionVencida = useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus('anon')
    setAviso('Tu sesión venció. Inicia sesión de nuevo para continuar.')
    navigate('/ingresar', { replace: true })
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(sesionVencida)
    if (!tokenStore.get()) return
    api('/auth/me')
      .then((u) => {
        setUser(u)
        setStatus('auth')
      })
      .catch(() => setStatus('anon'))
  }, [sesionVencida])

  const abrirSesion = useCallback((data) => {
    tokenStore.set(data.access_token)
    setUser(data.user)
    setAviso('')
    setStatus('auth')
  }, [])

  const value = useMemo(
    () => ({
      user,
      status,
      aviso,
      iniciarSesion: async (email, password) =>
        abrirSesion(await api('/auth/login', { method: 'POST', body: { email, password }, auth: false })),
      crearCuenta: async (name, email, password) =>
        abrirSesion(await api('/auth/register', { method: 'POST', body: { name, email, password }, auth: false })),
      cerrarSesion,
    }),
    [user, status, aviso, abrirSesion, cerrarSesion],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
