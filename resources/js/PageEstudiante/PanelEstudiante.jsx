// PanelEstudiante.jsx
import React, { useEffect, useState } from "react";
import SidebarEstudiante from "./SidebarEstudiante";
import AuthUser from "../pageauth/AuthUser";
import "../styles/docente.css"; // Usamos los estilos del PanelDocente

const PanelEstudiante = () => {
    const { getUserName } = AuthUser();
    const [nombreEstudiante, setNombreEstudiante] = useState("Estudiante");

    useEffect(() => {
        const nombre = getUserName();
        setNombreEstudiante(nombre);
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

    const accionesRapidas = [
        {
            nombre: "Perfil Académico",
            link: "/estudiante/perfil",
            color: "primary",
        },
        {
            nombre: "Juegos / Actividades",
            link: "/estudiante/juegos",
            color: "success",
        },
        {
            nombre: "Actividades",
            link: "/estudiante/actividades",
            color: "warning",
        },
        {
            nombre: "Prueba Diagnóstica",
            link: "/estudiante/diagnostico",
            color: "info",
        },
        {
            nombre: "Calificaciones / Retroalimentación",
            link: "/estudiante/calificaciones",
            color: "dark",
        },
        {
            nombre: "Asistencia",
            link: "/estudiante/asistencia",
            color: "secondary",
        },
        { nombre: "Recursos", link: "/estudiante/recursos", color: "warning" },
    ];

    return (
        <div className="admin-container d-flex">
            {/* Sidebar */}
            <SidebarEstudiante />

            {/* Contenido principal */}
            <div className="admin-content flex-grow-1 p-4">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4 admin-header">
                    <h2>Bienvenido, {nombreEstudiante}</h2>

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

                {/* Acciones rápidas en columna */}
                <div className="card shadow-sm p-3 mb-4 admin-card">
                    <h5>Acciones rápidas</h5>
                    <div className="d-flex flex-column gap-2 mt-2">
                        {accionesRapidas.map((accion, index) => (
                            <a
                                key={index}
                                href={accion.link}
                                className={`btn btn-${accion.color} admin-btn w-full text-left`}
                            >
                                {accion.nombre}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanelEstudiante;
