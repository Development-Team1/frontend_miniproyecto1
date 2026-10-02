const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const TOKEN_KEY = 'mp1_token'

export const tokenStore = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token) } catch { /* sin almacenamiento disponible */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY) } catch { /* sin almacenamiento disponible */ }
  },
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

// FastAPI responde `detail` como texto, o como lista cuando falla la validación.
function mensajeDe(cuerpo, porDefecto) {
  const d = cuerpo?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d) && d[0]?.msg) return d[0].msg.replace(/^Value error,\s*/, '')
  return porDefecto
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  const token = tokenStore.get()
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.', 0)
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    if (res.status === 401 && auth && token) onUnauthorized()
    throw new ApiError(
      mensajeDe(data, 'Algo salió mal de nuestro lado. Intenta de nuevo en unos minutos.'),
      res.status,
    )
  }
  return data
}

// El servidor gratuito de Render duerme tras un rato sin uso: lo despertamos de antemano.
export const despertarServidor = () => fetch(`${API_URL}/api/health`).catch(() => {})
