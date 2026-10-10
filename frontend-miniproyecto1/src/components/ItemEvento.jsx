import { IconoAdvertencia } from './Iconos'
import { formatoNumero, listarDias } from '../lib/carga'
import { diaDelMes, diasHasta, fechaCorta, fechaLarga, formatoHoras, mesCorto, textoRelativo } from '../lib/fechas'

const FORMAS = ['var(--blob-a)', 'var(--blob-b)', 'var(--blob-c)']

export default function ItemEvento({ evento, conflictos = [], abierto, onAlternar, onEditar, onEliminar }) {
  const pasado = diasHasta(evento.fecha) < 0
  const n = evento.tareas.length
  const horas = evento.tareas.reduce((suma, t) => suma + Number(t.horas_estimadas), 0)
  const gestiones = [...evento.tareas].sort((a, b) => a.plazo.localeCompare(b.plazo))
  const idPanel = `evento-${evento.id}`
  const diasSobre = new Set(conflictos.map((c) => c.dia))
  const cantidad = conflictos.length

  return (
    <li className={`evento${pasado ? ' evento--pasado' : ''}`}>
      <div className="evento__fecha" style={{ borderRadius: FORMAS[evento.id % 3] }} aria-hidden="true">
        <b>{diaDelMes(evento.fecha)}</b>
        <span>{mesCorto(evento.fecha)}</span>
      </div>

      <div className="evento__cuerpo">
        <button type="button" className="evento__resumen" aria-expanded={abierto} aria-controls={idPanel} onClick={onAlternar}>
          <span className="evento__titulo">
            <h3>{evento.nombre}</h3>
            <span className="evento__tipo">{evento.tipo}</span>
            {cantidad > 0 && (
              <span className="evento__alerta" title={`Más horas que tu límite diario el ${listarDias(conflictos.map((c) => c.dia))}`}>
                <IconoAdvertencia />
                Sobrecarga en {cantidad} {cantidad === 1 ? 'día' : 'días'}
              </span>
            )}
          </span>
          <span className="evento__meta">
            <span className="evento__cuando">{textoRelativo(evento.fecha)}</span>
            <span>{n === 0 ? 'Sin gestiones' : n === 1 ? '1 gestión' : `${n} gestiones`}</span>
            {n > 0 && <span>{formatoHoras(horas)} de trabajo</span>}
          </span>
        </button>

        {abierto && (
          <div className="evento__detalle" id={idPanel}>
            <p className="evento__fecha-larga">{fechaLarga(evento.fecha)}</p>
            {n === 0 ? (
              <p className="evento__vacio">Este evento aún no tiene gestiones. Agrégalas desde «Editar».</p>
            ) : (
              <ul className="evento__gestiones">
                {gestiones.map((g) => (
                  <li key={g.id}>
                    <span className="gestion-nombre">
                      {diasSobre.has(g.plazo) && (
                        <>
                          <IconoAdvertencia className="icono--mini" />
                          <span className="sr-only">Día con sobrecarga. </span>
                        </>
                      )}
                      {g.nombre}
                    </span>
                    <span className="gestion-dato">Plazo: {fechaCorta(g.plazo)}</span>
                    <span className="gestion-dato">{formatoHoras(g.horas_estimadas)}</span>
                  </li>
                ))}
              </ul>
            )}
            {cantidad > 0 && (
              <div className="evento__sobrecarga" role="note">
                <p className="evento__sobrecarga-titulo"><IconoAdvertencia /> Días con más horas que tu límite</p>
                <ul>
                  {conflictos.map((c) => (
                    <li key={c.dia}>El {fechaCorta(c.dia)} tienes {formatoNumero(c.total)}h de gestión planificadas (límite {formatoNumero(c.limite)}h).</li>
                  ))}
                </ul>
                <p>Edita el evento para mover una gestión a otro día, reducir sus horas o posponerla.</p>
              </div>
            )}
            <div className="evento__acciones">
              <button type="button" className="btn btn--suave btn--chico" onClick={onEditar}>Editar</button>
              <button type="button" className="btn btn--peligro btn--chico" onClick={onEliminar}>Eliminar</button>
            </div>
          </div>
        )}
      </div>
    </li>
  )
}