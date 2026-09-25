import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const VistaListaEventos = () => {
    const [eventos] = useState([
        { id: 1, nombre: 'Conferencia Tecnológica 2026', tipo: 'Corporativo', cliente: 'TechCorp' },
        { id: 2, nombre: 'Boda de Sofia y Mateo', tipo: 'Boda', cliente: 'Sofia Gómez' }
    ]);

    return (
        <div className="eventos-container">
            <h2 style={{ marginBottom: '1.5rem' }}>Lista de Eventos</h2>
            <div className="eventos-grid">
                {eventos.map(evento => (
                    <div key={evento.id} className="card-evento">
                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.3rem' }}>{evento.nombre}</h3>
                            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>{evento.tipo} — {evento.cliente}</p>
                        </div>
                        <Link to={`/eventos/${evento.id}`} className="btn btn-neutral">
                            Ver detalle
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};