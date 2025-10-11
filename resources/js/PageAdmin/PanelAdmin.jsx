// PanelAdmin.jsx
import React from "react";
import Sidebar from "./Sidebar";
import AuthUser from "../pageauth/AuthUser";

const PanelAdmin = () => {
    const { getUserName } = AuthUser(); // Obtener nombre del usuario logueado

    return (
        <div className="container-fluid">
            <div className="row">
                {/* Sidebar */}
                <Sidebar />

                {/* Contenido principal */}
                <div className="col-md-9 p-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>Bienvenido, {getUserName()}</h2>
                        <small>{new Date().toLocaleDateString()}</small>
                    </div>

                    {/* Acciones rápidas */}
                    <div className="card shadow-sm p-3 mb-4">
                        <h5>Acciones rápidas</h5>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            <a
                                href="/admin/usuarios"
                                className="btn btn-primary"
                            >
                                Administrar Usuarios
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanelAdmin;
