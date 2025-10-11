import React, { useEffect, useState } from "react";
import SidebarDocente from "./SidebarDocente";
import AuthUser from "../pageauth/AuthUser";
import "../styles/docente.css"; // Importamos los estilos oscuros gamificados

const PanelDocente = () => {
    const { getUserName } = AuthUser();
    const [nombreDocente, setNombreDocente] = useState("Docente");

    useEffect(() => {
        const nombre = getUserName();
        setNombreDocente(nombre);
    }, [getUserName]);

    // Fecha formateada
    const fechaActual = new Date();
    const opcionesFecha = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    };
    const fechaFormateada = fechaActual
        .toLocaleDateString("es-ES", opcionesFecha)
        .replace(
            /^./,
            fechaActual
                .toLocaleDateString("es-ES", opcionesFecha)[0]
                .toUpperCase()
        );

    return (
        <div className="admin-container d-flex">
            {/* Sidebar */}
            <SidebarDocente />

            {/* Contenido principal */}
            <div className="admin-content flex-grow-1 p-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4 admin-header">
                    <h2>Bienvenido, {nombreDocente}</h2>

                    {/* Fecha resaltada */}
                    <span
                        className="fecha-badge"
                        style={{
                            background: "rgba(0, 255, 212, 0.3)",
                            color: "#fff",
                            padding: "6px 12px",
                            borderRadius: "12px",
                            fontWeight: "600",
                            fontSize: "0.95rem",
                            textTransform: "capitalize",
                        }}
                    >
                        {fechaFormateada}
                    </span>
                </div>

                {/* Acciones rápidas */}
                <div className="card shadow-sm p-3 mb-4 admin-card">
                    <h5>Acciones rápidas</h5>
                    <div className="d-flex flex-column gap-2 mt-2">
                        <a
                            href="/docente"
                            className="btn btn-primary admin-btn"
                        >
                            Panel Docente
                        </a>
                        <a
                            href="/docente/diagnostico"
                            className="btn btn-success admin-btn"
                        >
                            Pruebas Diagnósticas
                        </a>
                        <a
                            href="/docente/reportes-diagnostico"
                            className="btn btn-warning admin-btn"
                        >
                            Reportes de Diagnósticos
                        </a>
                        <a
                            href="/docente/asignar-actividad"
                            className="btn btn-info admin-btn"
                        >
                            Asignación de Actividades Académicas
                        </a>
                        <a
                            href="/docente/cali-retro"
                            className="btn btn-dark admin-btn"
                        >
                            Calificación y Retroalimentación
                        </a>
                        <a
                            href="/docente/asistencia"
                            className="btn btn-secondary admin-btn"
                        >
                            Tomar Asistencia
                        </a>
                        <a
                            href="/docente/recursos"
                            className="btn btn-warning admin-btn"
                        >
                            Recursos Didácticos
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanelDocente;
