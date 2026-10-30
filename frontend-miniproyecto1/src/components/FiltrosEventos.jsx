import { ESTADOS, ORDENES, hayFiltros } from '../lib/eventosFiltro'

export default function FiltrosEventos({ valores, onCambio, tipos, total, mostrados, onLimpiar }) {
  const cambiar = (campo) => (e) => onCambio({ ...valores, [campo]: e.target.value })
  const activos = hayFiltros(valores)
  return (
    <form className="filtros-eventos" role="search" aria-label="Buscar y ordenar eventos" onSubmit={(e) => e.preventDefault()}>
      <div className="campo filtros-eventos__buscar">
        <label htmlFor="ev-buscar">Buscar</label>
        <input
          id="ev-buscar" type="search" className="entrada" autoComplete="off"
          placeholder="Nombre del evento o de una gestión" value={valores.texto} onChange={cambiar('texto')}
        />
      </div>
      <div className="campo">
        <label htmlFor="ev-tipo">Tipo</label>
        <select id="ev-tipo" className="entrada" value={valores.tipo} onChange={cambiar('tipo')}>
          <option value="">Todos los tipos</option>
          {tipos.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="ev-estado">Mostrar</label>
        <select id="ev-estado" className="entrada" value={valores.estado} onChange={cambiar('estado')}>
          {ESTADOS.map((o) => <option key={o.clave} value={o.clave}>{o.texto}</option>)}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="ev-orden">Ordenar por</label>
        <select id="ev-orden" className="entrada" value={valores.orden} onChange={cambiar('orden')}>
          {ORDENES.map((o) => <option key={o.clave} value={o.clave}>{o.texto}</option>)}
        </select>
      </div>
      <div className="filtros-eventos__pie">
        <p role="status">{activos ? `Mostrando ${mostrados} de ${total} eventos` : `${total} eventos en total`}</p>
        {activos && <button type="button" className="btn btn--texto btn--chico" onClick={onLimpiar}>Limpiar filtros</button>}
      </div>
    </form>
  )
}
