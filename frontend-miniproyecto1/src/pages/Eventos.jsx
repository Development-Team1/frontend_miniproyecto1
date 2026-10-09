import { useCallback, useEffect, useState } from 'react'
import BarraApp from '../components/BarraApp'
import ItemEvento from '../components/ItemEvento'
import EditorEvento from '../components/EditorEvento'
import ConfirmarBorrado from '../components/ConfirmarBorrado'
import { api } from '../lib/api'
import { LIMITE_POR_DEFECTO } from '../lib/carga'
import { useAuth } from '../lib/auth-context'
import { diasHasta, textoRelativo } from '../lib/fechas'
import { useTitulo } from '../lib/router'
import { MENSAJE_SERVIDOR_LENTO, useAvisoLento } from '../lib/useAvisoLento'

const porFecha = (a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id

export default function Eventos() {
  const { user } = useAuth()
  const [eventos, setEventos] = useState([])
  const [estado, setEstado] = useState('cargando') // cargando | listo | error
  const [error, setError] = useState('')
  const [abierto, setAbierto] = useState(null)
  // null | { evento } (evento null = crear). Se abre solo si llegas con ?crear=1 (desde la vista Hoy)
  const [editor, setEditor] = useState(() =>
    new URLSearchParams(window.location.search).has('crear') ? { evento: null } : null,
  )
  const [porBorrar, setPorBorrar] = useState(null)
  const [limite, setLimite] = useState(LIMITE_POR_DEFECTO)
  const [toast, setToast] = useState('')
  const lento = useAvisoLento(estado === 'cargando')
  useTitulo('Mis eventos · Mini-proyecto 1')

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

  useEffect(() => {
    if (window.location.search) window.history.replaceState({}, '', window.location.pathname)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const guardado = (evento, edicion) => {
    setEventos((prev) => [...prev.filter((e) => e.id !== evento.id), evento].sort(porFecha))
    setAbierto(evento.id)
    setEditor(null)
    setToast(edicion ? 'Cambios guardados' : 'Evento creado')
  }

  const eliminar = async () => {
    await api(`/events/${porBorrar.id}`, { method: 'DELETE' })
    setEventos((prev) => prev.filter((e) => e.id !== porBorrar.id))
    setPorBorrar(null)
    setToast('Evento eliminado')
  }

  const proximos = eventos.filter((e) => diasHasta(e.fecha) >= 0)
  const pasados = eventos.filter((e) => diasHasta(e.fecha) < 0).reverse()
  const nombre = user.name.split(' ')[0]

  const lista = (items) => (
    <ul className="linea">
      {items.map((e) => (
        <ItemEvento
          key={e.id}
          evento={e}
          abierto={abierto === e.id}
          onAlternar={() => setAbierto(abierto === e.id ? null : e.id)}
          onEditar={() => setEditor({ evento: e })}
          onEliminar={() => setPorBorrar(e)}
        />
      ))}
    </ul>
  )

  return (
    <div className="panel">
      <BarraApp />

      <main className="panel__principal">
        <section className="panel__encabezado">
          <div>
            <h1>Hola, {nombre}</h1>
            {estado === 'listo' && (
              <p>
                {proximos.length > 0
                  ? `Tu próximo evento es «${proximos[0].nombre}». ${textoRelativo(proximos[0].fecha)}.`
                  : eventos.length > 0
                    ? 'No tienes eventos por venir. Crea uno nuevo cuando lo necesites.'
                    : 'Aquí aparecerán tus eventos.'}
              </p>
            )}
          </div>
          {estado === 'listo' && eventos.length > 0 && (
            <button type="button" className="btn btn--primario" onClick={() => setEditor({ evento: null })}>Crear evento</button>
          )}
        </section>

        {estado === 'cargando' && (
          <div className="panel__estado" role="status">
            <p>Cargando tus eventos…</p>
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
            <p>Crea el primero y empieza a armar su lista de gestiones.</p>
            <button type="button" className="btn btn--primario" onClick={() => setEditor({ evento: null })}>Crear mi primer evento</button>
          </div>
        )}

        {estado === 'listo' && proximos.length > 0 && (
          <section aria-labelledby="t-proximos">
            <h2 id="t-proximos" className="panel__seccion">Próximos</h2>
            {lista(proximos)}
          </section>
        )}
        {estado === 'listo' && pasados.length > 0 && (
          <section aria-labelledby="t-pasados">
            <h2 id="t-pasados" className="panel__seccion">Ya pasaron</h2>
            {lista(pasados)}
          </section>
        )}
      </main>

      {editor && <EditorEvento evento={editor.evento} eventos={eventos} limite={limite} onCerrar={() => setEditor(null)} onGuardado={guardado} />}
      {porBorrar && <ConfirmarBorrado evento={porBorrar} onCancelar={() => setPorBorrar(null)} onConfirmar={eliminar} />}
      {toast && <p className="aviso-toast" role="status">{toast}</p>}
    </div>
  )
}