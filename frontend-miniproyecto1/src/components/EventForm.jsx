import { useState } from "react";
import "./EventForm.css";

// Ajusta esta URL: en desarrollo local apunta a tu backend local,
// en producción debería venir de una variable de entorno de Vite (VITE_API_URL).
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const TIPOS_EVENTO = ["Boda", "Cumpleaños", "Corporativo", "Social", "Otro"];

const tareaVacia = () => ({ nombre: "", plazo: "", horas_estimadas: "" });

export default function EventForm() {
  const [evento, setEvento] = useState({ nombre: "", tipo: "", fecha: "" });
  const [tareas, setTareas] = useState([tareaVacia()]);
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState("idle"); // idle | loading | success | error
  const [mensajeServidor, setMensajeServidor] = useState("");

  const actualizarEvento = (campo, valor) => {
    setEvento((prev) => ({ ...prev, [campo]: valor }));
  };

  const actualizarTarea = (index, campo, valor) => {
    setTareas((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [campo]: valor } : t))
    );
  };

  const agregarTarea = () => setTareas((prev) => [...prev, tareaVacia()]);

  const eliminarTarea = (index) => {
    setTareas((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Validación en el cliente, en espejo con las reglas del backend ---
  const validar = () => {
    const nuevosErrores = {};

    if (!evento.nombre.trim()) {
      nuevosErrores.nombre = "El nombre del evento es obligatorio.";
    }
    if (!evento.tipo.trim()) {
      nuevosErrores.tipo = "Selecciona un tipo de evento.";
    }
    if (!evento.fecha) {
      nuevosErrores.fecha = "La fecha del evento es obligatoria.";
    }

    const erroresTareas = tareas.map((t) => {
      const e = {};
      if (!t.nombre.trim()) {
        e.nombre = "Dale un nombre a esta gestión (ej: Reservar salón).";
      }
      if (!t.plazo) {
        e.plazo = "Define un plazo para esta gestión.";
      }
      if (t.horas_estimadas === "" || Number(t.horas_estimadas) <= 0) {
        e.horas_estimadas = "Las horas estimadas deben ser mayores a 0.";
      }
      return e;
    });

    if (erroresTareas.some((e) => Object.keys(e).length > 0)) {
      nuevosErrores.tareas = erroresTareas;
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const resetFormulario = () => {
    setEvento({ nombre: "", tipo: "", fecha: "" });
    setTareas([tareaVacia()]);
    setErrores({});
  };

  const manejarSubmit = async (e) => {
    e.preventDefault();
    setMensajeServidor("");

    if (!validar()) {
      setEstado("error");
      setMensajeServidor("Revisa los campos marcados antes de continuar.");
      return;
    }

    setEstado("loading");

    try {
      const respuesta = await fetch(`${API_URL}/events/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: evento.nombre,
          tipo: evento.tipo,
          fecha: evento.fecha,
          tareas: tareas.map((t) => ({
            nombre: t.nombre,
            plazo: t.plazo,
            horas_estimadas: Number(t.horas_estimadas),
          })),
        }),
      });

      if (!respuesta.ok) {
        // FastAPI devuelve 422 con detalle de validación, o 500 con mensaje propio
        const cuerpo = await respuesta.json().catch(() => null);
        const detalle =
          cuerpo?.detail && typeof cuerpo.detail === "string"
            ? cuerpo.detail
            : "No pudimos crear el evento. Verifica los datos e intenta de nuevo.";
        throw new Error(detalle);
      }

      setEstado("success");
      setMensajeServidor("¡Evento creado con éxito! Ya puedes verlo en tu lista de eventos.");
      resetFormulario();
    } catch (err) {
      setEstado("error");
      setMensajeServidor(
        err.message || "Ocurrió un error inesperado. Intenta de nuevo."
      );
    }
  };

  return (
    <form className="event-form" onSubmit={manejarSubmit} noValidate>
      <h2>Crear nuevo evento</h2>
      <p className="event-form__hint">
        Completa los datos del evento y agrega las gestiones logísticas necesarias
        (reservar salón, enviar invitaciones, confirmar catering, etc.).
      </p>

      {/* --- Datos del evento --- */}
      <fieldset>
        <legend>Datos del evento</legend>

        <div className="campo">
          <label htmlFor="nombre">Nombre del evento</label>
          <input
            id="nombre"
            type="text"
            placeholder="Ej: Boda de Ana y Luis"
            value={evento.nombre}
            onChange={(e) => actualizarEvento("nombre", e.target.value)}
          />
          {errores.nombre && <span className="error-texto">{errores.nombre}</span>}
        </div>

        <div className="campo">
          <label htmlFor="tipo">Tipo de evento</label>
          <select
            id="tipo"
            value={evento.tipo}
            onChange={(e) => actualizarEvento("tipo", e.target.value)}
          >
            <option value="">Selecciona un tipo</option>
            {TIPOS_EVENTO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
          {errores.tipo && <span className="error-texto">{errores.tipo}</span>}
        </div>

        <div className="campo">
          <label htmlFor="fecha">Fecha del evento</label>
          <input
            id="fecha"
            type="date"
            value={evento.fecha}
            onChange={(e) => actualizarEvento("fecha", e.target.value)}
          />
          {errores.fecha && <span className="error-texto">{errores.fecha}</span>}
        </div>
      </fieldset>

      {/* --- Subtareas logísticas --- */}
      <fieldset>
        <legend>Gestiones logísticas</legend>
        <p className="event-form__hint">
          Agrega cada tarea con su plazo límite y una estimación realista de horas de trabajo.
        </p>

        {tareas.map((tarea, index) => {
          const errorTarea = errores.tareas?.[index] || {};
          return (
            <div className="tarea-card" key={index}>
              <div className="tarea-card__header">
                <strong>Gestión {index + 1}</strong>
                {tareas.length > 1 && (
                  <button
                    type="button"
                    className="btn-link btn-eliminar"
                    onClick={() => eliminarTarea(index)}
                  >
                    Eliminar
                  </button>
                )}
              </div>

              <div className="campo">
                <label>Nombre de la gestión</label>
                <input
                  type="text"
                  placeholder="Ej: Reservar salón"
                  value={tarea.nombre}
                  onChange={(e) => actualizarTarea(index, "nombre", e.target.value)}
                />
                {errorTarea.nombre && (
                  <span className="error-texto">{errorTarea.nombre}</span>
                )}
              </div>

              <div className="campo-grupo">
                <div className="campo">
                  <label>Plazo</label>
                  <input
                    type="date"
                    value={tarea.plazo}
                    onChange={(e) => actualizarTarea(index, "plazo", e.target.value)}
                  />
                  {errorTarea.plazo && (
                    <span className="error-texto">{errorTarea.plazo}</span>
                  )}
                </div>

                <div className="campo">
                  <label>Horas estimadas</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="Ej: 3"
                    value={tarea.horas_estimadas}
                    onChange={(e) =>
                      actualizarTarea(index, "horas_estimadas", e.target.value)
                    }
                  />
                  {errorTarea.horas_estimadas && (
                    <span className="error-texto">{errorTarea.horas_estimadas}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <button type="button" className="btn-secundario" onClick={agregarTarea}>
          + Agregar otra gestión
        </button>
      </fieldset>

      {/* --- Estados de envío --- */}
      {estado === "error" && mensajeServidor && (
        <div className="alerta alerta--error" role="alert">
          {mensajeServidor}
        </div>
      )}
      {estado === "success" && mensajeServidor && (
        <div className="alerta alerta--success" role="status">
          {mensajeServidor}
        </div>
      )}

      <button type="submit" className="btn-primario" disabled={estado === "loading"}>
        {estado === "loading" ? "Guardando evento..." : "Crear evento"}
      </button>
    </form>
  );
}
