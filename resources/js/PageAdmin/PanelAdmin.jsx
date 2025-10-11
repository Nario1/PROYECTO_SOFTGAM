import React from "react";
import Sidebar from "./Sidebar";
import AuthUser from "../pageauth/AuthUser";
import "../styles/sidebar.css"; // Importamos los estilos gamificados

const PanelAdmin = () => {
    const { getUserName } = AuthUser();

    // Formatear fecha de manera atractiva
    const fechaActual = new Date();
    const opcionesFecha = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    };
    const fechaFormateada = fechaActual.toLocaleDateString(
        "es-ES",
        opcionesFecha
    ); // Ej: "viernes, 11 de octubre de 2025"

    return (
        <div className="admin-container d-flex">
            {/* Sidebar */}
            <Sidebar />

            {/* Contenido principal */}
            <div className="admin-content flex-grow-1 p-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4 admin-header">
                    <h2>Bienvenido, {getUserName()}</h2>

                    {/* Fecha resaltada */}
                    <span
                        className="fecha-badge"
                        style={{
                            background: "rgba(94, 140, 255, 0.3)",
                            color: "#fff",
                            padding: "6px 12px",
                            borderRadius: "12px",
                            fontWeight: "600",
                            fontSize: "0.95rem",
                            textTransform: "capitalize",
                        }}
                    >
                        {fechaFormateada.charAt(0).toUpperCase() +
                            fechaFormateada.slice(1)}
                    </span>
                </div>

                {/* Acciones rápidas */}
                <div className="card shadow-sm p-3 mb-4 admin-card">
                    <h5>Acciones rápidas</h5>
                    <div className="d-flex flex-wrap gap-2 mt-2">
                        <a
                            href="/admin/usuarios"
                            className="btn btn-primary admin-btn"
                        >
                            Administrar Usuarios
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanelAdmin;
