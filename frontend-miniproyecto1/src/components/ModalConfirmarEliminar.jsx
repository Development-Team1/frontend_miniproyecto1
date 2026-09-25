import React from 'react';

export const ModalConfirmarEliminar = ({ isOpen, title, message, onConfirm, onCancel, isDeleting }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content border-danger">
                <h3>{title || "¿Eliminar elemento?"}</h3>
                <p className="modal-body">
                    {message || "Esta acción eliminará el registro y toda su información asociada. No se puede deshacer."}
                </p>

                <div className="modal-actions">
                    <button className="btn btn-danger" onClick={onConfirm} disabled={isDeleting}>
                        {isDeleting ? "Eliminando..." : "Eliminar"}
                    </button>
                    <button className="btn btn-neutral" onClick={onCancel} disabled={isDeleting}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};