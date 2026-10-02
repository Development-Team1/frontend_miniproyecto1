import { useCallback, useEffect, useMemo, useState } from 'react'
import BarraApp from '../components/BarraApp'
import Link from '../components/Link'
import { api } from '../lib/api'
import { fechaCorta, fechaLarga, formatoHoras } from '../lib/fechas'
import {
  GRUPOS, REGLA_ORDEN, agruparGestiones, aplanarGestiones, hoyISO, marcaDe, resumenDe, textoPlazo,
} from '../lib/hoy'
import { useTitulo } from '../lib/router'
import { MENSAJE_SERVIDOR_LENTO, useAvisoLento } from '../lib/useAvisoLento'

const ESTADOS = [
  { valor: '', texto: 'Todos los estados' },
  { valor: 'vencida', texto: 'Vencidas' },
  { valor: 'hoy', texto: 'Para hoy' },
  { valor: 'proxima', texto: 'Próximas' },
]

export default function Hoy() {
  const [eventos, setEventos] = useState([])
  const [estado, setEstado] = useState('cargando') // cargando | listo | error
  const [error, setError] = useState('')
  const [filtroEvento, setFiltroEvento] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const lento = useAvisoLento(estado === 'cargando')
  useTitulo('Hoy · Mini-proyecto 1')

  const cargar = useCallback(async () => {
    setEstado('cargando')
    try {
      setEventos(await api('/events'))
      setEstado('listo')
    } catch (err) {
      setError(err.message)
      setEstado('error')
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const gestiones = useMemo(() => aplanarGestiones(eventos), [eventos])
  const eventosConGestiones = eventos.filter((e) => e.tareas.length > 0)

  const visibles = gestiones.filter(
    (g) =>
      (!filtroEvento || String(g.evento.id) === filtroEvento) &&
      (!filtroEstado || g.estado === filtroEstado),
  )
  const grupos = agruparGestiones(visibles)
  const hayFiltros = Boolean(filtroEvento || filtroEstado)
  const limpiar = () => {
    setFiltroEvento('')
    setFiltroEstado('')
  }

  return (
    <div className="panel">
      <BarraApp />

      <main className="panel__principal hoy">
        <section className="panel__encabezado">
          <div>
            <h1>Hoy</h1>
            <p className="hoy__fecha">{fechaLarga(hoyISO())}</p>
            {estado === 'listo' && <p className="hoy__resumen">{resumenDe(gestiones)}</p>}
          </div>
        </section>

        {estado === 'cargando' && (
          <div className="panel__estado" role="status">
            <p>Cargando tus gestiones…</p>
            {lento && <p className="campo__ayuda">{MENSAJE_SERVIDOR_LENTO}</p>}
          </div>
        )}

        {estado === 'error' && (
          <div className="panel__estado">
            <p className="alerta alerta--error" role="alert">{error}</p>
            <button type="button" className="btn btn--suave" onClick={cargar}>Reintentar</button>
          </div>
        )}

        {estado === 'listo' && gestiones.length === 0 && (
          <div className="vacio">
            <h2>Aún no tienes gestiones</h2>
            <p>
              {eventos.length === 0
                ? 'Crea un evento y agrégale sus gestiones: aquí verás cuáles atender primero.'
                : 'Tus eventos todavía no tienen gestiones. Agrégalas al crear o editar un evento y aparecerán aquí.'}
            </p>
            <div className="vacio__acciones">
              <Link to="/eventos?crear=1" className="btn btn--primario">Crear evento</Link>
              {eventos.length > 0 && <Link to="/eventos" className="btn btn--suave">Ir a mis eventos</Link>}
            </div>
          </div>
        )}

        {estado === 'listo' && gestiones.length > 0 && (
          <>
            <details className="regla" open>
              <summary>¿Cómo se ordena esto?</summary>
              <ol>
                {REGLA_ORDEN.map((linea) => <li key={linea}>{linea}</li>)}
              </ol>
            </details>

            <div className="filtros" role="group" aria-label="Filtros">
              <div className="campo">
                <label htmlFor="f-evento">Evento</label>
                <select id="f-evento" className="entrada" value={filtroEvento} onChange={(e) => setFiltroEvento(e.target.value)}>
                  <option value="">Todos los eventos</option>
                  {eventosConGestiones.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="f-estado">Estado</label>
                <select id="f-estado" className="entrada" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                  {ESTADOS.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
                </select>
              </div>
              {hayFiltros && (
                <button type="button" className="btn btn--texto btn--chico" onClick={limpiar}>Limpiar filtros</button>
              )}
            </div>
            <p className="filtros__conteo" role="status">
              {hayFiltros
                ? `Mostrando ${visibles.length} de ${gestiones.length} gestiones`
                : `${gestiones.length} ${gestiones.length === 1 ? 'gestión' : 'gestiones'} en total`}
            </p>

            {visibles.length === 0 ? (
              <div className="vacio">
                <h2>Ninguna gestión coincide</h2>
                <p>Prueba con otro evento o estado, o quita los filtros para verlo todo.</p>
                <div className="vacio__acciones">
                  <button type="button" className="btn btn--primario" onClick={limpiar}>Limpiar filtros</button>
                </div>
              </div>
            ) : (
              GRUPOS.map((g) => {
                const items = grupos[g.clave]
                const vacioHoy = g.clave === 'hoy' && items.length === 0 && !filtroEstado
                if (items.length === 0 && !vacioHoy) return null
                return (
                  <section key={g.clave} className={`grupo grupo--${g.clave}`} aria-labelledby={`g-${g.clave}`}>
                    <div className="grupo__cabecera">
                      <h2 id={`g-${g.clave}`}>
                        {g.titulo}
                        <span className="grupo__conteo" aria-label={`${items.length} ${items.length === 1 ? 'gestión' : 'gestiones'}`}>
                          {items.length}
                        </span>
                      </h2>
                      <p>{g.ayuda}</p>
                    </div>
                    {vacioHoy ? (
                      <p className="grupo__vacio">
                        {hayFiltros ? 'Nada para hoy con los filtros actuales.' : 'No tienes gestiones que venzan hoy. Buen momento para adelantar las próximas.'}
                      </p>
                    ) : (
                      <ul className="grupo__lista">
                        {items.map((it) => {
                          const marca = marcaDe(it)
                          return (
                            <li key={it.id} className="gh">
                              <span className="gh__marca" aria-hidden="true">
                                <b>{marca.grande}</b>
                                {marca.chica && <span>{marca.chica}</span>}
                              </span>
                              <div className="gh__texto">
                                <strong>{it.nombre}</strong>
                                <p>Evento: {it.evento.nombre}</p>
                                <p className="gh__plazo">{textoPlazo(it, fechaCorta)}</p>
                              </div>
                              <span className="gh__horas">{formatoHoras(it.horas)}</span>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </section>
                )
              })
            )}
          </>
        )}
      </main>
    </div>
  )
}
