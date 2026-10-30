export default function Aviso({ aviso, ocupado, onDeshacer }) {
  if (!aviso) return null
  return (
    <div className="aviso-toast" role="status">
      <span>{aviso.texto}</span>
      {aviso.deshacer && (
        <button type="button" className="aviso-toast__accion" disabled={ocupado} onClick={onDeshacer}>
          {ocupado ? 'Deshaciendo…' : 'Deshacer'}
        </button>
      )}
    </div>
  )
}
