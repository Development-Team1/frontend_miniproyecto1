/*
 * Búsqueda, filtros y orden de la lista de «Eventos». Todo se calcula en el navegador con los eventos ya cargados.
 * La búsqueda ignora mayúsculas y tildes, y mira el nombre del evento, su tipo y los nombres de sus gestiones.
 */
import { progresoDe } from './carga'
import { diasHasta } from './fechas'

export const ESTADOS = [
  { clave: 'todos', texto: 'Todos' },
  { clave: 'proximos', texto: 'Próximos' },
  { clave: 'pasados', texto: 'Ya pasaron' },
  { clave: 'pendientes', texto: 'Con gestiones por hacer' },
  { clave: 'completos', texto: 'Completos' },
]

export const ORDENES = [
  { clave: 'cercana', texto: 'Fecha: más cercana primero' },
  { clave: 'lejana', texto: 'Fecha: más lejana primero' },
  { clave: 'nombre', texto: 'Nombre (A–Z)' },
  { clave: 'progreso', texto: 'Menor progreso primero' },
]

export const FILTROS_INICIALES = { texto: '', tipo: '', estado: 'todos', orden: 'cercana' }

export const hayFiltros = (f) => Boolean(f.texto.trim() || f.tipo || f.estado !== 'todos')

const normalizar = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function filtrarEventos(eventos, f) {
  const consulta = normalizar(f.texto.trim())
  return eventos.filter((e) => {
    if (f.tipo && e.tipo !== f.tipo) return false
    if (f.estado === 'proximos' && diasHasta(e.fecha) < 0) return false
    if (f.estado === 'pasados' && diasHasta(e.fecha) >= 0) return false
    if (f.estado === 'pendientes' && !(progresoDe(e).faltan > 0)) return false
    if (f.estado === 'completos' && !progresoDe(e).completo) return false
    if (!consulta) return true
    return normalizar([e.nombre, e.tipo, ...e.tareas.map((t) => t.nombre)].join(' ')).includes(consulta)
  })
}

// `pasados`: en «más cercana primero» los que ya pasaron van del más reciente al más antiguo.
export function ordenarEventos(items, orden, pasados) {
  const porFecha = (a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id
  const copia = [...items]
  if (orden === 'nombre') return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es') || porFecha(a, b))
  if (orden === 'progreso') {
    return copia.sort((a, b) => progresoDe(a).porcentaje - progresoDe(b).porcentaje || porFecha(a, b))
  }
  copia.sort(porFecha)
  return (orden === 'lejana') !== pasados ? copia.reverse() : copia
}
