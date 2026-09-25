import React, { useState } from 'react';

export const ModalSubtarea = ({ isOpen, eventoId, onClose, onSubtareaCreada, onSaveLocal }) => {
    const [subtarea, setSubtarea] = useState({
        nombre_gestion: '',
        plazo_fecha: '',
        horas_estimadas: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSubtarea({ ...subtarea, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: '' });
    };

    const validate = () => {
        let newErrors = {};
        if (!subtarea.nombre_gestion.trim()) newErrors.nombre_gestion = "Este campo es obligatorio.";
        if (!subtarea.plazo_fecha) newErrors.plazo_fecha = "Ingresa una fecha válida.";

        if (!subtarea.horas_estimadas || Number(subtarea.horas_estimadas) <= 0) {
            newErrors.horas_estimadas = "Las horas estimadas deben ser mayores a 0.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        // Si pasamos la función para pruebas locales (sin backend)
        if (onSaveLocal) {
            onSaveLocal(subtarea);
            setSubtarea({ nombre_gestion: '', plazo_fecha: '', horas_estimadas: '' });
            onClose();
            return;
        }

        // Petición real al backend cuando esté conectado
        setIsSubmitting(true);
        try {
            const response = await fetch(`https://tu-api-fastapi.vercel.app/api/eventos/${eventoId}/subtareas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subtarea)
            });

            if (response.ok) {
                if (onSubtareaCreada) onSubtareaCreada();
                onClose();
            } else {
                alert("Error al guardar la subtarea.");
            }
        } catch (error) {
            alert("Error de conexión con la API.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Crear Subtarea Logística</h2>

                <div className="form-group">
                    <label>Nombre de la gestión <span className="required">*</span></label>
                    <input
                        type="text"
                        name="nombre_gestion"
                        value={subtarea.nombre_gestion}
                        onChange={handleChange}
                        placeholder="Ej: Contratación de sonido"
                    />
                    {errors.nombre_gestion && <span className="error-text">{errors.nombre_gestion}</span>}
                </div>

                <div className="form-group">
                    <label>Fecha plazo <span className="required">*</span></label>
                    <input
                        type="date"
                        name="plazo_fecha"
                        value={subtarea.plazo_fecha}
                        onChange={handleChange}
                    />
                    {errors.plazo_fecha && <span className="error-text">{errors.plazo_fecha}</span>}
                </div>

                <div className="form-group">
                    <label>Horas estimadas <span className="required">*</span></label>
                    <input
                        type="number"
                        name="horas_estimadas"
                        min="1"
                        value={subtarea.horas_estimadas}
                        onChange={handleChange}
                        placeholder="Ej: 4"
                    />
                    {errors.horas_estimadas && <span className="error-text">{errors.horas_estimadas}</span>}
                </div>

                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? "Guardando..." : "Crear subtarea"}
                    </button>
                    <button className="btn btn-neutral" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};