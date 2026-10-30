import { useMemo, useState } from 'react'
import Link from './Link'
import { formatoNumero, horasPorDia, sumarDias } from '../lib/carga'
import { fechaCorta, formatoHoras, leerFecha } from '../lib/fechas'
import { hoyISO } from '../lib/hoy'

const DIAS_POR_PAGINA = 7
const MAX_PAGINAS = 8 // hasta ~2 meses hacia adelante
const TOPE_VISUAL = 1.25 // la barra llega al 125 % del límite para que la sobrecarga se vea
const EPS = 1e-9

const nombreDia = (iso, weekday) => leerFecha(iso).toLocaleDateString('es-CO', { weekday }).replace('.', '')

function nivelDe(horas, limite) {
  if (horas > limite + EPS) return 'sobre'
  if (horas <= 0) return 'libre'
  return horas / limite >= 0.8 ? 'alta' : 'normal'
}

/*
 * Horas planificadas por día frente al límite diario. Sirve para ver qué días están llenos
 * antes de crear o posponer algo. Cuenta solo gestiones sin hacer; las vencidas se resumen aparte.
 */
export default function CargaSemanal({ eventos, limite }) {
  const [pagina, setPagina] = useState(0)
  const hoy = hoyISO()
  const inicio = sumarDias(hoy, pagina * DIAS_POR_PAGINA)

  const { dias, libre, sobrecargados, vencidasHoras } = useMemo(() => {
    const mapa = horasPorDia(eventos, null)
    const lista = Array.from({ length: DIAS_POR_PAGINA }, (_, i) => {
      const iso = sumarDias(inicio, i)
      const horas = mapa.get(iso) || 0
      return { iso, horas, nivel: nivelDe(horas, limite) }
    })
    let vencidas = 0
    for (const e of eventos) for (const t of e.tareas) if (t.status !== 'hecha' && t.plazo < hoy) vencidas += Number(t.horas_estimadas)
    // Día con más espacio de la página (si empatan, el más cercano)
    const masLibre = lista.reduce((mejor, d) => (d.horas < mejor.horas ? d : mejor), lista[0])
    return {
      dias: lista,
      libre: masLibre.horas < limite ? masLibre : null,
      sobrecargados: lista.filter((d) => d.nivel === 'sobre'),
      vencidasHoras: vencidas,
    }
  }, [eventos, inicio, hoy, limite])

  const fin = dias[dias.length - 1].iso
  const textoDia = (d) => `${nombreDia(d.iso, 'short')} ${fechaCorta(d.iso)}`

  return (
    <section className="sem" aria-labelledby="t-semana">
      <div className="sem__cabecera">
        <div>
          <h2 id="t-semana">Carga de los próximos días</h2>
          <p className="sem__rango">{fechaCorta(inicio)} – {fechaCorta(fin)} · Límite diario: {formatoHoras(limite)}</p>
        </div>
        <div className="sem__nav">
          <button type="button" className="btn btn--suave btn--chico" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>
            ‹ Anteriores
          </button>
          <button type="button" className="btn btn--suave btn--chico" disabled={pagina >= MAX_PAGINAS - 1} onClick={() => setPagina(pagina + 1)}>
            Siguientes ›
          </button>
        </div>
      </div>

      <ul className="sem__dias">
        {dias.map((d) => {
          const alto = Math.min(d.horas / limite, TOPE_VISUAL) / TOPE_VISUAL
          return (
            <li key={d.iso} className={`sem__dia sem__dia--${d.nivel}${d.iso === hoy ? ' sem__dia--hoy' : ''}`}>
              <span className="sr-only">
                {`${nombreDia(d.iso, 'long')} ${fechaCorta(d.iso)}: ${formatoNumero(d.horas)} de ${formatoNumero(limite)} horas${d.nivel === 'sobre' ? ', supera el límite' : ''}`}
              </span>
              <span className="sem__horas" aria-hidden="true">{d.horas > 0 ? `${formatoNumero(d.horas)}h` : '–'}</span>
              <span className="sem__barra" aria-hidden="true">
                <span className="sem__relleno" style={{ height: `${alto * 100}%` }} />
              </span>
              <span className="sem__nombre" aria-hidden="true">{d.iso === hoy ? 'Hoy' : nombreDia(d.iso, 'short')}</span>
              <span className="sem__fecha" aria-hidden="true">{leerFecha(d.iso).getDate()}</span>
            </li>
          )
        })}
      </ul>

      <div className="sem__notas">
        {sobrecargados.length > 0 && (
          <p className="sem__nota sem__nota--sobre">
            {sobrecargados.length === 1 ? 'Este día supera el límite' : 'Estos días superan el límite'}: {sobrecargados.map(textoDia).join(', ')}.{' '}
            <Link to="/eventos">Reorganízalo en Eventos</Link>
          </p>
        )}
        {libre && sobrecargados.length === 0 && (
          <p className="sem__nota">
            Más espacio: <b>{textoDia(libre)}</b> ({formatoHoras(Math.round((limite - libre.horas) * 100) / 100)} disponibles).
          </p>
        )}
        {vencidasHoras > 0 && pagina === 0 && (
          <p className="sem__nota">Además tienes {formatoHoras(vencidasHoras)} de gestiones vencidas sin hacer, que no se cuentan aquí.</p>
        )}
      </div>
    </section>
  )
}
