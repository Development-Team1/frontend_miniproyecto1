import { diaDelMes, diasHasta, fechaCorta, fechaLarga, formatoHoras, mesCorto, textoRelativo } from '../lib/fechas'

const FORMAS = ['var(--blob-a)', 'var(--blob-b)', 'var(--blob-c)']

export default function ItemEvento({ evento, abierto, onAlternar, onEditar, onEliminar }) {
  const pasado = diasHasta(evento.fecha) < 0
  const n = evento.tareas.length
  const horas = evento.tareas.reduce((suma, t) => suma + Number(t.horas_estimadas), 0)
  const gestiones = [...evento.tareas].sort((a, b) => a.plazo.localeCompare(b.plazo))
  const idPanel = `evento-${evento.id}`

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
                    <span className="gestion-nombre">{g.nombre}</span>
                    <span className="gestion-dato">Plazo: {fechaCorta(g.plazo)}</span>
                    <span className="gestion-dato">{formatoHoras(g.horas_estimadas)}</span>
                  </li>
                ))}
              </ul>
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
