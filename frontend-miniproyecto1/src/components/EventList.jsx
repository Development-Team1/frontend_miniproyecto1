import { useEffect, useState } from "react";
import "./EventList.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function EventList({ refreshTrigger }) {
  const [eventos, setEventos] = useState([]);
  const [estado, setEstado] = useState("loading"); // loading | success | error
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    let cancelado = false;

    const cargarEventos = async () => {
      setEstado("loading");
      try {
        const respuesta = await fetch(`${API_URL}/events`);
        if (!respuesta.ok) {
          throw new Error("No pudimos obtener la lista de eventos.");
        }
        const datos = await respuesta.json();
        if (!cancelado) {
          setEventos(datos);
          setEstado("success");
        }
      } catch (err) {
        if (!cancelado) {
          setMensajeError(err.message || "Ocurrió un error al cargar los eventos.");
          setEstado("error");
        }
      }
    };

    cargarEventos();
    return () => {
      cancelado = true;
    };
  }, [refreshTrigger]);

  return (
    <section className="event-list">
      <h2>Eventos creados</h2>

      {estado === "loading" && (
        <p className="event-list__mensaje">Cargando eventos...</p>
      )}

      {estado === "error" && (
        <div className="alerta alerta--error" role="alert">
          {mensajeError}
        </div>
      )}

      {estado === "success" && eventos.length === 0 && (
        <p className="event-list__mensaje">
          Todavía no has creado ningún evento. Usa el formulario para crear el primero.
        </p>
      )}

      {estado === "success" && eventos.length > 0 && (
        <ul className="event-list__items">
          {eventos.map((evento) => (
            <li key={evento.id} className="event-card">
              <div className="event-card__header">
                <strong>{evento.nombre}</strong>
                <span className="event-card__tipo">{evento.tipo}</span>
              </div>
              <p className="event-card__fecha">
                Fecha del evento: {evento.fecha}
              </p>

              {evento.tareas.length > 0 ? (
                <ul className="event-card__tareas">
                  {evento.tareas.map((tarea) => (
                    <li key={tarea.id}>
                      {tarea.nombre} — plazo: {tarea.plazo} — {tarea.horas_estimadas} h
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="event-card__sin-tareas">Sin gestiones asociadas.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
