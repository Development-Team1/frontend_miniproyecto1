import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModalSubtarea } from '../components/ModalSubtarea';
import { ModalConfirmarEliminar } from '../components/ModalConfirmarEliminar';

export const VistaDetalleEvento = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Estado con subtareas iniciales de prueba
    const [subtareas, setSubtareas] = useState([
        { id: 101, nombre_gestion: 'Contratación de Sonido y Luces', horas_estimadas: 6 },
        { id: 102, nombre_gestion: 'Catering y Banquetes', horas_estimadas: 4 }
    ]);

    const [isModalSubtareaOpen, setIsModalSubtareaOpen] = useState(false);
    const [isModalEliminarOpen, setIsModalEliminarOpen] = useState(false);
    const [subtareaAEliminar, setSubtareaAEliminar] = useState(null);

    const handleAgregarSubtareaMock = (nuevaSubtarea) => {
        setSubtareas([...subtareas, { id: Date.now(), ...nuevaSubtarea }]);
    };

    const handleEliminarSubtareaMock = () => {
        setSubtareas(subtareas.filter(sub => sub.id !== subtareaAEliminar));
        setIsModalEliminarOpen(false);
    };

    return (
        <div className="detalle-container" style={{ padding: '1rem' }}>
            <button className="btn btn-neutral" onClick={() => navigate('/')} style={{ marginBottom: '1rem' }}>
                ← Volver a eventos
            </button>

            <h2>Conferencia Tecnológica 2026</h2>
            <p><strong>Cliente:</strong> TechCorp | <strong>Tipo:</strong> Corporativo</p>

            <hr style={{ margin: '1.5rem 0', borderColor: '#444' }} />

            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Subtareas Logísticas</h3>
                <button className="btn btn-primary" onClick={() => setIsModalSubtareaOpen(true)}>
                    + Agregar Subtarea
                </button>
            </div>

            {subtareas.length === 0 ? (
                <p>No hay subtareas registradas para este evento.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {subtareas.map(sub => (
                        <li key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', borderBottom: '1px solid #333' }}>
                            <span>{sub.nombre_gestion} — <strong>{sub.horas_estimadas} hrs</strong></span>
                            <button className="btn btn-danger" onClick={() => {
                                setSubtareaAEliminar(sub.id);
                                setIsModalEliminarOpen(true);
                            }}>
                                Eliminar
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Modal Subtarea Mock */}
            <ModalSubtarea
                isOpen={isModalSubtareaOpen}
                onClose={() => setIsModalSubtareaOpen(false)}
                onSubtareaCreada={() => { }}
                // Inyectamos la función local para probar la interfaz
                onSaveLocal={handleAgregarSubtareaMock}
            />

            {/* Modal Confirmación de Eliminación */}
            <ModalConfirmarEliminar
                isOpen={isModalEliminarOpen}
                onConfirm={handleEliminarSubtareaMock}
                onCancel={() => setIsModalEliminarOpen(false)}
            />
        </div>
    );
};