import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API_URL = 'https://tu-api-fastapi.vercel.app/api/eventos';

export const FormularioEvento = ({ isEdit }) => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [formData, setFormData] = useState({
        nombre: '',
        tipo: '',
        cliente: '',
        fecha_hora: '',
        lugar: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isEdit && id) {
            fetch(`${API_URL}/${id}`)
                .then(res => res.json())
                .then(data => setFormData(data))
                .catch(() => console.error("Error al cargar evento"));
        }
    }, [isEdit, id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) setErrors({ ...errors, [name]: '' });
    };

    const validate = () => {
        let newErrors = {};
        if (!formData.nombre.trim()) newErrors.nombre = "Este campo es obligatorio.";
        if (!formData.tipo) newErrors.tipo = "Este campo es obligatorio.";
        if (!formData.cliente.trim()) newErrors.cliente = "Este campo es obligatorio.";
        if (!formData.fecha_hora) newErrors.fecha_hora = "Ingresa una fecha y hora válida.";
        if (!formData.lugar.trim()) newErrors.lugar = "Este campo es obligatorio.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        const method = isEdit ? 'PUT' : 'POST';
        const endpoint = isEdit ? `${API_URL}/${id}` : API_URL;

        try {
            const response = await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                navigate('/');
            } else {
                alert("Error al guardar en el servidor.");
            }
        } catch (error) {
            alert("Error de conexión con la API.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="form-container">
            <h2>{isEdit ? "Editar Evento" : "Crear Evento"}</h2>

            <div className="form-group">
                <label>Nombre del evento <span className="required">*</span></label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: Conferencia Anual" />
                {errors.nombre && <span className="error-text">{errors.nombre}</span>}
            </div>

            <div className="form-group">
                <label>Tipo de evento <span className="required">*</span></label>
                <select name="tipo" value={formData.tipo} onChange={handleChange}>
                    <option value="">Seleccione una opción</option>
                    <option value="boda">Boda</option>
                    <option value="corporativo">Corporativo</option>
                    <option value="social">Social</option>
                </select>
                {errors.tipo && <span className="error-text">{errors.tipo}</span>}
            </div>

            <div className="form-group">
                <label>Cliente / Contacto <span className="required">*</span></label>
                <input type="text" name="cliente" value={formData.cliente} onChange={handleChange} placeholder="Ej: Juan Pérez" />
                {errors.cliente && <span className="error-text">{errors.cliente}</span>}
            </div>

            <div className="form-group">
                <label>Fecha y Hora <span className="required">*</span></label>
                <input type="datetime-local" name="fecha_hora" value={formData.fecha_hora} onChange={handleChange} />
                {errors.fecha_hora && <span className="error-text">{errors.fecha_hora}</span>}
            </div>

            <div className="form-group">
                <label>Lugar / Plazo <span className="required">*</span></label>
                <input type="text" name="lugar" value={formData.lugar} onChange={handleChange} placeholder="Ej: Centro de Convenciones" />
                {errors.lugar && <span className="error-text">{errors.lugar}</span>}
            </div>

            <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : (isEdit ? "Guardar cambios" : "Crear evento")}
                </button>
                <button type="button" className="btn btn-neutral" onClick={() => navigate('/')}>
                    Cancelar
                </button>
            </div>
        </form>
    );
};
