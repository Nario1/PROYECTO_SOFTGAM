// PanelEstudiante.jsx
import React, { useEffect, useState } from "react";
import SidebarEstudiante from "./SidebarEstudiante";
import AuthUser from "../pageauth/AuthUser";

const PanelEstudiante = () => {
    const { getUserName } = AuthUser();
    const [nombreEstudiante, setNombreEstudiante] = useState("Estudiante");

    useEffect(() => {
        const nombre = getUserName();
        setNombreEstudiante(nombre);
    }, [getUserName]);

    // Definir los links basados en el sidebar
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
        <div className="container-fluid">
            <div className="row">
                {/* Sidebar */}
                <SidebarEstudiante />

                {/* Contenido principal */}
                <div className="col-md-9 p-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>Bienvenido, {nombreEstudiante}</h2>
                        <small>{new Date().toLocaleDateString()}</small>
                    </div>

                    {/* Acciones rápidas */}
                    <div className="card shadow-sm p-3 mb-4">
                        <h5>Acciones rápidas</h5>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            {accionesRapidas.map((accion, index) => (
                                <a
                                    key={index}
                                    href={accion.link}
                                    className={`btn btn-${accion.color}`}
                                >
                                    {accion.nombre}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanelEstudiante;
