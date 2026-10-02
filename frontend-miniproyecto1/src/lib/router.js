import { useEffect, useState } from 'react'

export function navigate(to, { replace = false } = {}) {
  window.history[replace ? 'replaceState' : 'pushState']({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo(0, 0)
}

export function usePath() {
  const [path, setPath] = useState(window.location.pathname)
  useEffect(() => {
    const alCambiar = () => setPath(window.location.pathname)
    window.addEventListener('popstate', alCambiar)
    return () => window.removeEventListener('popstate', alCambiar)
  }, [])
  return path
}

export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo
  }, [titulo])
}
