// Nota que el usuario dejó al posponer una gestión. Se muestra en todas las vistas donde aparece la gestión.
export default function NotaGestion({ nota }) {
  if (!nota) return null
  return (
    <div className="nota-gestion">
      <span className="nota-gestion__titulo">Nota: </span>
      <span>{nota}</span>
    </div>
  )
}
