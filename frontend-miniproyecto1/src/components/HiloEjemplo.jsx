// Ejemplo ilustrativo: un evento visto como un hilo de gestiones que termina en la fecha del evento.
const NODOS = [
  { x: 20, y: 6, lado: 'der', titulo: 'Reservar el salón', detalle: 'Hasta el 3 de oct, 2 horas' },
  { x: 75, y: 38, lado: 'izq', titulo: 'Confirmar el catering', detalle: 'Hasta el 10 de oct, 3 horas' },
  { x: 27.5, y: 66, lado: 'der', titulo: 'Enviar invitaciones', detalle: 'Hasta el 17 de oct, 1,5 horas' },
  { x: 72.5, y: 92, lado: 'izq', titulo: 'Cumpleaños de Sofía', detalle: 'Sábado 24 de octubre', final: true },
]

export default function HiloEjemplo() {
  return (
    <figure className="hilo">
      <div className="hilo__escena" role="img" aria-label="Ejemplo de un evento: cuatro pasos enlazados por un hilo, desde reservar el salón hasta el día del cumpleaños.">
        <span className="hilo__fondo" aria-hidden="true" />
        <svg className="hilo__trazo" viewBox="0 0 400 500" preserveAspectRatio="none" aria-hidden="true">
          <path className="hilo__camino" d="M80 30 C80 120 320 90 300 190 S90 250 110 330 S320 370 290 460" pathLength="1" />
          <path className="hilo__luz" d="M80 30 C80 120 320 90 300 190 S90 250 110 330 S320 370 290 460" pathLength="1" />
        </svg>
        {NODOS.map((n, i) => (
          <div
            key={n.titulo}
            className={`hilo__nodo hilo__nodo--${n.lado}${n.final ? ' hilo__nodo--final' : ''}`}
            style={{ left: `${n.x}%`, top: `${n.y}%`, '--i': i }}
            aria-hidden="true"
          >
            <span className="hilo__punto" />
            <span className="hilo__etiqueta">
              <strong>{n.titulo}</strong>
              <small>{n.detalle}</small>
            </span>
          </div>
        ))}
      </div>
      <figcaption>Así se ve un evento en la app. Es un ejemplo ilustrativo.</figcaption>
    </figure>
  )
}
