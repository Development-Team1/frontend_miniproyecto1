import { useCallback, useEffect, useMemo, useState } from 'react'
import BarraApp from '../components/BarraApp'
import Link from '../components/Link'
import AccionesGestion from '../components/AccionesGestion'
import NotaGestion from '../components/NotaGestion'
import Aviso from '../components/Aviso'
import { api } from '../lib/api'
import { LIMITE_POR_DEFECTO } from '../lib/carga'
import { fechaCorta, formatoHoras, textoRelativo } from '../lib/fechas'
import { hoyISO } from '../lib/hoy'
import { FILTROS, compararTarjetas, estadoGestion, proximoPlazo, resumirGestiones } from '../lib/progreso'
import { useTitulo } from '../lib/router'
import { useAviso } from '../lib/useAviso'
import { MENSAJE_SERVIDOR_LENTO, useAvisoLento } from '../lib/useAvisoLento'

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`
const decimal = (n) => n.toLocaleString('es-CO', { maximumFractionDigits: 1 })

function Anillo({ porcentaje }) {
  const radio = 52
  const largo = 2 * Math.PI * radio
  return (
    <div className="prog-anillo" role="img" aria-label={`${decimal(porcentaje)}% completado`}>
      <svg viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <circle className="prog-anillo__pista" cx="60" cy="60" r={radio} />
        <circle
          className="prog-anillo__valor" cx="60" cy="60" r={radio} transform="rotate(-90 60 60)"
          strokeDasharray={`${(largo * porcentaje) / 100} ${largo}`}
        />
      </svg>
      <b>{decimal(porcentaje)}%</b>
    </div>
  )
}

function Barra({ r, etiqueta }) {
  const ancho = (n) => `${r.total ? (n * 100) / r.total : 0}%`
  return (
    <div
      className="prog-barra" role="progressbar" aria-label={etiqueta}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(r.porcentaje)}
      aria-valuetext={`${decimal(r.porcentaje)}%: ${r.hechas} de ${plural(r.total, 'gestión hecha', 'gestiones hechas')}`}
    >
      <span className="prog-barra__hechas" style={{ width: ancho(r.hechas) }} />
      <span className="prog-barra__pospuestas" style={{ width: ancho(r.pospuestas) }} />
      <span className="prog-barra__vencidas" style={{ width: ancho(r.vencidas) }} />
    </div>
  )
}

// Con `soloActivos` se omiten las categorías en cero (tarjetas por evento).
function Chips({ r, soloActivos = false }) {
  const items = [
    { clave: 'hechas', texto: plural(r.hechas, 'Completada', 'Completadas'), n: r.hechas },
    { clave: 'pendientes', texto: plural(r.pendientes, 'Pendiente', 'Pendientes'), n: r.pendientes },
    { clave: 'pospuestas', texto: plural(r.pospuestas, 'Pospuesta', 'Pospuestas'), n: r.pospuestas },
    { clave: 'vencidas', texto: plural(r.vencidas, 'Vencida', 'Vencidas'), n: r.vencidas },
  ].filter((i) => !soloActivos || i.n > 0)
  return (
    <ul className="prog-chips">
      {items.map((i) => (
        <li key={i.clave} className={`prog-chip prog-chip--${i.clave}`}>{i.texto}</li>
      ))}
    </ul>
  )
}

function Dato({ titulo, valor, detalle }) {
  return (
    <div className="prog-dato">
      <span className="prog-dato__titulo">{titulo}</span>
      <b>{valor}</b>
      {detalle && <span className="prog-dato__detalle">{detalle}</span>}
    </div>
  )
}

const ETIQUETAS = {
  hecha: { clase: 'hecha', texto: 'Hecha' },
  pospuesta: { clase: 'pospuesta', texto: 'Pospuesta' },
  vencida: { clase: 'vencida', texto: 'Vencida' },
}

function TarjetaEvento({ evento, r, hoy, abierta, onAlternar, eventos, limite, onActualizado }) {
  const idDetalle = `prog-detalle-${evento.id}`
  const gestiones = [...evento.tareas].sort((a, b) => a.plazo.localeCompare(b.plazo) || a.id - b.id)
  return (
    <li className={`prog-card${abierta ? ' prog-card--abierta' : ''}${r.completo ? ' prog-card--completa' : ''}`}>
      <div className="prog-card__cab">
        <div>
          <h3>{evento.nombre}</h3>
          <p className="prog-card__fecha">{fechaCorta(evento.fecha)} · {textoRelativo(evento.fecha)}</p>
        </div>
        <span className="evento__tipo">{evento.tipo}</span>
      </div>

      {r.total === 0 ? (
        <>
          <p className="prog-card__vacio">Este evento aún no tiene gestiones.</p>
          <Link to="/eventos" className="btn btn--texto btn--chico">Agregarlas en Eventos</Link>
        </>
      ) : (
        <>
          <p className="prog-card__conteo">
            <span>{r.hechas}/{r.total} {r.total === 1 ? 'gestión' : 'gestiones'}</span>
            <b>{Math.round(r.porcentaje)}%</b>
          </p>
          <Barra r={r} etiqueta={`Progreso de ${evento.nombre}`} />
          <Chips r={r} soloActivos />
          {r.horasRestantes > 0 && <p className="prog-card__horas">Faltan {formatoHoras(r.horasRestantes)} de trabajo</p>}
          <button
            type="button" className="btn btn--texto btn--chico prog-card__detalle"
            aria-expanded={abierta} aria-controls={idDetalle} onClick={onAlternar}
          >
            {abierta ? 'Ocultar detalle' : 'Ver detalle'}
          </button>
        </>
      )}

      {abierta && r.total > 0 && (
        <ul className="evento__gestiones" id={idDetalle}>
          {gestiones.map((g) => {
            const estado = estadoGestion(g, hoy)
            const etiqueta = ETIQUETAS[estado]
            return (
              <li key={g.id} className={`gestion gestion--${g.status}`}>
                <div className="gestion__fila">
                  <span className="gestion-nombre">
                    {g.nombre}
                    {etiqueta && <span className={`etiqueta etiqueta--${etiqueta.clase}`}>{etiqueta.texto}</span>}
                  </span>
                  <span className="gestion-dato">Plazo: {fechaCorta(g.plazo)}</span>
                  <span className="gestion-dato">{formatoHoras(g.horas_estimadas)}</span>
                </div>
                <NotaGestion nota={g.note} />
                <AccionesGestion evento={evento} tarea={g} eventos={eventos} limite={limite} onActualizado={onActualizado} />
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

export default function Progreso() {
  const [eventos, setEventos] = useState([])
  const [estado, setEstado] = useState('cargando') // cargando | listo | error
  const [error, setError] = useState('')
  const [limite, setLimite] = useState(LIMITE_POR_DEFECTO)
  const [filtro, setFiltro] = useState('todos')
  const [abiertas, setAbiertas] = useState(() => new Set())
  const { aviso, avisar, deshacer, ocupado } = useAviso()
  const lento = useAvisoLento(estado === 'cargando')
  useTitulo('Progreso · Mini-proyecto 1')
  const hoy = hoyISO()

  const cargar = useCallback(async () => {
    setEstado('cargando')
    try {
      const [lista, limiteApi] = await Promise.all([
        api('/events'),
        api('/settings/daily-limit').catch(() => ({ horas: LIMITE_POR_DEFECTO })),
      ])
      setEventos(lista)
      setLimite(Number(limiteApi.horas))
      setEstado('listo')
    } catch (err) {
      setError(err.message)
      setEstado('error')
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Una gestión se marcó como hecha, se pospuso o se reabrió: se reemplaza el evento con lo que dice el servidor
  const reemplazar = (evento) => setEventos((previos) => previos.map((e) => (e.id === evento.id ? evento : e)))
  const actualizado = (evento, mensaje, revertir) => {
    reemplazar(evento)
    avisar(mensaje, revertir && (async () => {
      reemplazar(await revertir())
      return 'Cambio deshecho.'
    }))
  }

  const alternar = (id) =>
    setAbiertas((previas) => {
      const nuevas = new Set(previas)
      if (nuevas.has(id)) nuevas.delete(id)
      else nuevas.add(id)
      return nuevas
    })

  const general = useMemo(() => resumirGestiones(eventos.flatMap((e) => e.tareas), hoy), [eventos, hoy])
  const proximo = useMemo(() => proximoPlazo(eventos, hoy), [eventos, hoy])
  const tarjetas = useMemo(
    () => eventos.map((evento) => ({ evento, r: resumirGestiones(evento.tareas, hoy) })).sort(compararTarjetas),
    [eventos, hoy],
  )
  const listos = tarjetas.filter((t) => t.r.completo).length
  const filtroActivo = FILTROS.find((f) => f.clave === filtro) ?? FILTROS[0]
  const visibles = tarjetas.filter((t) => filtroActivo.cumple(t.r))

  return (
    <div className="panel">
      <BarraApp />

      <main className="panel__principal hoy">
        <section className="panel__encabezado">
          <div>
            <h1>Progreso</h1>
            {estado === 'listo' && (
              <p>
                {eventos.length === 0
                  ? 'Aquí verás cómo avanza la preparación de tus eventos.'
                  : `${plural(eventos.length, 'evento', 'eventos')} · ${plural(general.total, 'gestión', 'gestiones')}`}
              </p>
            )}
          </div>
        </section>

        {estado === 'cargando' && (
          <div className="panel__estado" role="status">
            <p>Cargando tu progreso…</p>
            {lento && <p className="campo__ayuda">{MENSAJE_SERVIDOR_LENTO}</p>}
          </div>
        )}

        {estado === 'error' && (
          <div className="panel__estado">
            <p className="alerta alerta--error" role="alert">{error}</p>
            <button type="button" className="btn btn--suave" onClick={cargar}>Reintentar</button>
          </div>
        )}

        {estado === 'listo' && eventos.length === 0 && (
          <div className="vacio">
            <h2>Aún no tienes eventos</h2>
            <p>Cuando crees eventos y les agregues gestiones, aquí verás su progreso.</p>
            <div className="vacio__acciones">
              <Link to="/eventos" className="btn btn--primario">Ir a mis eventos</Link>
            </div>
          </div>
        )}

        {estado === 'listo' && eventos.length > 0 && general.total === 0 && (
          <div className="vacio">
            <h2>Tus eventos aún no tienen gestiones</h2>
            <p>Agrégalas al editar un evento y empezarás a ver el avance aquí.</p>
            <div className="vacio__acciones">
              <Link to="/eventos" className="btn btn--primario">Ir a mis eventos</Link>
            </div>
          </div>
        )}

        {estado === 'listo' && general.total > 0 && (
          <>
            <section className="prog-general" aria-labelledby="t-general">
              <Anillo porcentaje={general.porcentaje} />
              <div className="prog-general__cuerpo">
                <h2 id="t-general">Progreso general</h2>
                <p className="prog-general__texto">
                  {general.hechas} de {plural(general.total, 'gestión completada', 'gestiones completadas')} en {plural(eventos.length, 'evento', 'eventos')}.
                </p>
                <Barra r={general} etiqueta="Progreso general de todos tus eventos" />
                <Chips r={general} />
                <div className="prog-datos">
                  <Dato titulo="Horas por completar" valor={formatoHoras(general.horasRestantes)} detalle={`Límite diario: ${formatoHoras(limite)}`} />
                  <Dato
                    titulo="Próximo plazo"
                    valor={proximo ? (proximo.plazo === hoy ? 'Hoy' : fechaCorta(proximo.plazo)) : 'Sin plazos'}
                    detalle={proximo ? `${proximo.nombre} · ${proximo.evento}` : 'No hay gestiones por vencer'}
                  />
                  <Dato titulo="Eventos listos" valor={`${listos} de ${eventos.length}`} detalle={listos === eventos.length ? 'Todo al día' : 'Con todas sus gestiones hechas'} />
                </div>
              </div>
            </section>

            <section aria-labelledby="t-eventos">
              <div className="prog-seccion">
                <h2 id="t-eventos" className="panel__seccion">Por evento</h2>
                <div className="prog-filtros" role="group" aria-label="Filtrar eventos">
                  {FILTROS.map((f) => (
                    <button
                      key={f.clave} type="button" aria-pressed={filtro === f.clave}
                      className={`btn btn--chico ${filtro === f.clave ? 'btn--primario' : 'btn--suave'}`}
                      onClick={() => setFiltro(f.clave)}
                    >
                      {f.texto} ({tarjetas.filter((t) => f.cumple(t.r)).length})
                    </button>
                  ))}
                </div>
              </div>

              {visibles.length === 0 ? (
                <div className="vacio">
                  <h2>Ningún evento coincide</h2>
                  <p>Prueba con otro filtro para ver tus eventos.</p>
                  <div className="vacio__acciones">
                    <button type="button" className="btn btn--primario" onClick={() => setFiltro('todos')}>Ver todos</button>
                  </div>
                </div>
              ) : (
                <ul className="prog-lista">
                  {visibles.map(({ evento, r }) => (
                    <TarjetaEvento
                      key={evento.id} evento={evento} r={r} hoy={hoy}
                      abierta={abiertas.has(evento.id)} onAlternar={() => alternar(evento.id)}
                      eventos={eventos} limite={limite} onActualizado={actualizado}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      <Aviso aviso={aviso} ocupado={ocupado} onDeshacer={deshacer} />
    </div>
  )
}