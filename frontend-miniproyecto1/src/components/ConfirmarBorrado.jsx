import { useEffect, useRef, useState } from 'react'

export default function ConfirmarBorrado({ evento, onCancelar, onConfirmar }) {
  const ref = useRef(null)
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal()
  }, [])

  const n = evento.tareas.length
  const confirmar = async () => {
    setBorrando(true)
    setError('')
    try {
      await onConfirmar()
    } catch (err) {
      setError(err.message)
      setBorrando(false)
    }
  }

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="borrar-titulo"
      aria-describedby="borrar-texto"
      onClose={onCancelar}
      onClick={(e) => e.target === ref.current && onCancelar()}
    >
      <div className="modal__contenido">
        <h2 id="borrar-titulo">¿Eliminar «{evento.nombre}»?</h2>
        <p id="borrar-texto">
          {n > 0 ? `También se borrarán ${n === 1 ? 'su gestión' : `sus ${n} gestiones`}. ` : ''}
          Esta acción no se puede deshacer.
        </p>
        {error && <p className="alerta alerta--error" role="alert">{error}</p>}
        <div className="modal__acciones">
          <button type="button" className="btn btn--suave" onClick={onCancelar} autoFocus>Cancelar</button>
          <button type="button" className="btn btn--peligro-solido" onClick={confirmar} disabled={borrando}>
            {borrando ? 'Eliminando…' : 'Eliminar evento'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
