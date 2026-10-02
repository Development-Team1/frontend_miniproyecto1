// Las fechas llegan como "AAAA-MM-DD". Se leen como fecha local para evitar desfases por zona horaria.
export function leerFecha(texto) {
  const [a, m, d] = texto.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function diasHasta(texto) {
  const hoy = new Date()
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return Math.round((leerFecha(texto) - inicioHoy) / 86400000)
}

export function textoRelativo(texto) {
  const n = diasHasta(texto)
  if (n === 0) return 'Es hoy'
  if (n === 1) return 'Es mañana'
  if (n === -1) return 'Fue ayer'
  if (n > 1) return `Faltan ${n} días`
  return `Pasó hace ${-n} días`
}

export const fechaLarga = (texto) =>
  leerFecha(texto).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const fechaCorta = (texto) =>
  leerFecha(texto).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '')

export const diaDelMes = (texto) => leerFecha(texto).getDate()

export const mesCorto = (texto) =>
  leerFecha(texto).toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')

export function formatoHoras(n) {
  const v = Number(n)
  return `${v.toLocaleString('es-CO', { maximumFractionDigits: 2 })} ${v === 1 ? 'hora' : 'horas'}`
}
