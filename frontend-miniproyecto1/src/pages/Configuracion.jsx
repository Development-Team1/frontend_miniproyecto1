import { useCallback, useEffect, useState } from 'react'
import BarraApp from '../components/BarraApp'
import { IconoCheck } from '../components/Iconos'
import { api } from '../lib/api'
import {
  LIMITE_POR_DEFECTO, confirmarCambio, cuerpoEvento, describirCambio, detalleSobrecarga,
  formatoNumero, planReducir, planReprogramar,
} from '../lib/carga'
import { fechaCorta } from '../lib/fechas'
import { useTitulo } from '../lib/router'
import { MENSAJE_SERVIDOR_LENTO, useAvisoLento } from '../lib/useAvisoLento'

const MIN = 1
const MAX = 16

// Una de las soluciones automáticas: muestra qué se hará y lo aplica con un clic
function Ajuste({ titulo, plan, ocupado, aplicando, onAplicar }) {
  return (
    <div className="ajuste">
      <button type="button" className="btn btn--suave" disabled={!plan.factible || ocupado} onClick={onAplicar}>
        {aplicando ? 'Aplicando…' : titulo}
      </button>
      {plan.factible ? (
        <>
          <p className="ajuste__previa">Se hará esto:</p>
          <ul>{plan.cambios.map((c) => <li key={`${c.tareaId}-${c.tipo}`}>{describirCambio(c)}</li>)}</ul>
        </>
      ) : (
        <p className="campo__ayuda">No se puede resolver así. {plan.irresolubles.map((i) => i.motivo).join(' ')}</p>
      )}
    </div>
  )
}

export default function Configuracion() {
  const [estado, setEstado] = useState('cargando') // cargando | listo | error
  const [errorCarga, setErrorCarga] = useState('')
  const [guardado, setGuardado] = useState(LIMITE_POR_DEFECTO)
  const [valor, setValor] = useState(String(LIMITE_POR_DEFECTO))
  const [errorCampo, setErrorCampo] = useState('')
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState('')
  const [bloqueo, setBloqueo] = useState(null) // días que impiden el nuevo límite y sus soluciones
  const [aplicando, setAplicando] = useState(null) // 'fecha' | 'horas' | null
  const [resultado, setResultado] = useState(null)
  const lento = useAvisoLento(estado === 'cargando')
  useTitulo('Configuración · Mini-proyecto 1')

  const cargar = useCallback(async () => {
    setEstado('cargando')
    try {
      const { horas } = await api('/settings/daily-limit')
      setGuardado(Number(horas))
      setValor(String(horas))
      setEstado('listo')
    } catch (err) {
      setErrorCarga(err.message)
      setEstado('error')
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const validar = () => {
    if (valor.trim() === '') return `Escribe cuántas horas por día, entre ${MIN} y ${MAX}.`
    const n = Number(valor)
    if (Number.isNaN(n) || n < MIN || n > MAX) return `El límite debe estar entre ${MIN} y ${MAX} horas.`
    return ''
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErrorServidor('')
    const problema = validar()
    setErrorCampo(problema)
    if (problema) {
      document.getElementById('limite')?.focus()
      return
    }
    setGuardando(true)
    setResultado(null)
    try {
      // Antes de guardar, se revisa que ningún día (desde hoy) tenga más horas que el nuevo límite
      const eventos = await api('/events')
      const dias = detalleSobrecarga(eventos, Number(valor))
      if (dias.length > 0) {
        setBloqueo({
          limite: Number(valor), dias,
          planFecha: planReprogramar(eventos, Number(valor)),
          planHoras: planReducir(eventos, Number(valor)),
        })
        return
      }
      await guardarLimite(Number(valor))
    } catch (err) {
      setErrorServidor(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const guardarLimite = async (horasNuevas) => {
    const { horas } = await api('/settings/daily-limit', { method: 'PUT', body: { horas: horasNuevas } })
    setGuardado(Number(horas))
    setValor(String(horas))
    setBloqueo(null)
    setToast(`Límite actualizado a ${formatoNumero(horas)}h por día`)
    return Number(horas)
  }

  // Aplica una solución automática (cambia las gestiones) y, enseguida, guarda el nuevo límite
  const aplicar = async (tipo, plan) => {
    setAplicando(tipo)
    setErrorServidor('')
    let hechos = 0
    try {
      for (const e of plan.eventosNuevos) {
        await api(`/events/${e.id}`, { method: 'PUT', body: cuerpoEvento(e) })
        hechos += 1
      }
      const limiteNuevo = bloqueo.limite
      await guardarLimite(limiteNuevo)
      setResultado({ limite: limiteNuevo, cambios: plan.cambios })
    } catch (err) {
      setErrorServidor(
        hechos > 0
          ? `${err.message} Se alcanzaron a cambiar ${hechos} de ${plan.eventosNuevos.length} eventos; vuelve a intentarlo.`
          : err.message,
      )
    } finally {
      setAplicando(null)
    }
  }

  const mantener = () => {
    setBloqueo(null)
    setValor(String(guardado))
    setErrorCampo('')
  }

  return (
    <div className="panel">
      <BarraApp />
      <main className="panel__principal">
        <section className="panel__encabezado">
          <div>
            <h1>Configuración</h1>
            <p>Define cuántas horas al día puedes dedicar a organizar eventos. Te avisaremos cuando un día supere ese límite.</p>
          </div>
        </section>

        {estado === 'cargando' && (
          <div className="panel__estado" role="status">
            <p>Cargando tu configuración…</p>
            {lento && <p className="campo__ayuda">{MENSAJE_SERVIDOR_LENTO}</p>}
          </div>
        )}

        {estado === 'error' && (
          <div className="panel__estado">
            <p className="alerta alerta--error" role="alert">{errorCarga}</p>
            <button type="button" className="btn btn--suave" onClick={cargar}>Reintentar</button>
          </div>
        )}

        {estado === 'listo' && (
          <section className="cfg" aria-labelledby="titulo-limite">
            <div className="cfg__valor" aria-hidden="true">
              <b>{formatoNumero(guardado)}</b>
              <span>horas por día</span>
            </div>
            <form onSubmit={guardar} noValidate>
              <h2 id="titulo-limite">Límite de horas por día</h2>
              <p className="cfg__actual">Tu límite actual es de {formatoNumero(guardado)}h por día. Si no lo cambias, usamos {LIMITE_POR_DEFECTO}h.</p>
              <div className="campo">
                <label htmlFor="limite">Horas por día</label>
                <input
                  id="limite" className="entrada" type="number" inputMode="decimal" step="0.5" min={MIN} max={MAX}
                  value={valor}
                  onChange={(e) => { setValor(e.target.value); setErrorCampo(''); setBloqueo(null) }}
                  aria-invalid={errorCampo ? 'true' : undefined}
                  aria-describedby={errorCampo ? 'limite-error' : 'limite-ayuda'}
                />
                {errorCampo
                  ? <span id="limite-error" className="campo__error">{errorCampo}</span>
                  : <span id="limite-ayuda" className="campo__ayuda">Entre {MIN} y {MAX} horas. Puedes usar medias horas, por ejemplo 4,5.</span>}
              </div>
              {errorServidor && <p className="alerta alerta--error" role="alert">{errorServidor}</p>}
              <div className="cfg__acciones">
                <button type="submit" className="btn btn--primario" disabled={guardando}>
                  {guardando ? 'Guardando…' : 'Guardar límite'}
                </button>
                <button type="button" className="btn btn--texto" onClick={() => { setValor(String(LIMITE_POR_DEFECTO)); setErrorCampo('') }}>
                  Usar {LIMITE_POR_DEFECTO}h
                </button>
              </div>
            </form>
          </section>
        )}

        {estado === 'listo' && bloqueo && (
          <section className="bloqueo" aria-labelledby="titulo-bloqueo">
            <h2 id="titulo-bloqueo">Todavía no puedes fijar un límite de {formatoNumero(bloqueo.limite)}h</h2>
            <p>Estos días ya tienen más horas planificadas que ese límite:</p>
            <ul className="bloqueo__dias">
              {bloqueo.dias.map((d) => (
                <li key={d.dia}>
                  <strong>{fechaCorta(d.dia)}: {formatoNumero(d.total)}h planificadas</strong>
                  <span className="campo__ayuda"> (el nuevo límite sería {formatoNumero(bloqueo.limite)}h)</span>
                  <ul>
                    {d.items.map((i) => (
                      <li key={i.tareaId}>Gestión «{i.nombre}» del evento «{i.eventoNombre}»: {formatoNumero(i.horas)}h</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
            <p className="bloqueo__pregunta">¿Cómo lo resuelves?</p>
            <div className="ajustes">
              <Ajuste titulo="Reprogramar gestiones a otros días" plan={bloqueo.planFecha}
                ocupado={aplicando !== null} aplicando={aplicando === 'fecha'} onAplicar={() => aplicar('fecha', bloqueo.planFecha)} />
              <Ajuste titulo="Reducir las horas de las gestiones" plan={bloqueo.planHoras}
                ocupado={aplicando !== null} aplicando={aplicando === 'horas'} onAplicar={() => aplicar('horas', bloqueo.planHoras)} />
            </div>
            {errorServidor && <p className="alerta alerta--error" role="alert">{errorServidor}</p>}
            <button type="button" className="btn btn--texto" onClick={mantener} disabled={aplicando !== null}>
              Mantener mi límite actual ({formatoNumero(guardado)}h)
            </button>
          </section>
        )}

        {estado === 'listo' && resultado && (
          <section className="confirmacion confirmacion--grande" role="status">
            <IconoCheck />
            <div>
              <p className="confirmacion__titulo">Límite actualizado a {formatoNumero(resultado.limite)}h por día.</p>
              <p className="confirmacion__detalle">Para que ningún día lo supere se hicieron estos cambios:</p>
              <ul>{resultado.cambios.map((c) => <li key={`${c.tareaId}-${c.tipo}`}>{confirmarCambio(c)}</li>)}</ul>
            </div>
          </section>
        )}
      </main>
      {toast && <p className="aviso-toast" role="status">{toast}</p>}
    </div>
  )
}