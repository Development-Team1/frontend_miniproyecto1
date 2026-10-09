import { useCallback, useEffect, useState } from 'react'
import BarraApp from '../components/BarraApp'
import { api } from '../lib/api'
import { LIMITE_POR_DEFECTO, formatoNumero } from '../lib/carga'
import { useTitulo } from '../lib/router'
import { MENSAJE_SERVIDOR_LENTO, useAvisoLento } from '../lib/useAvisoLento'

const MIN = 1
const MAX = 16

export default function Configuracion() {
  const [estado, setEstado] = useState('cargando') // cargando | listo | error
  const [errorCarga, setErrorCarga] = useState('')
  const [guardado, setGuardado] = useState(LIMITE_POR_DEFECTO)
  const [valor, setValor] = useState(String(LIMITE_POR_DEFECTO))
  const [errorCampo, setErrorCampo] = useState('')
  const [errorServidor, setErrorServidor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState('')
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
    try {
      const { horas } = await api('/settings/daily-limit', { method: 'PUT', body: { horas: Number(valor) } })
      setGuardado(Number(horas))
      setValor(String(horas))
      setToast(`Límite actualizado a ${formatoNumero(horas)}h por día`)
    } catch (err) {
      setErrorServidor(err.message)
    } finally {
      setGuardando(false)
    }
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
                  onChange={(e) => { setValor(e.target.value); setErrorCampo('') }}
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
      </main>
      {toast && <p className="aviso-toast" role="status">{toast}</p>}
    </div>
  )
}
