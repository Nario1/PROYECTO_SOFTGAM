// PanelDocente.jsx
import React, { useEffect, useState } from "react";
import SidebarDocente from "./SidebarDocente";
import AuthUser from "../pageauth/AuthUser";

const PanelDocente = () => {
    const { getUserName } = AuthUser();
    const [nombreDocente, setNombreDocente] = useState("Docente");

    useEffect(() => {
        const nombre = getUserName();
        setNombreDocente(nombre);
    }, [getUserName]);

    return (
        <div className="container-fluid">
            <div className="row">
                {/* Sidebar */}
                <SidebarDocente />

                {/* Contenido principal */}
                <div className="col-md-9 p-4">
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>Bienvenido, {nombreDocente}</h2>
                        <small>{new Date().toLocaleDateString()}</small>
                    </div>

                    {/* Acciones rápidas */}
                    <div className="card shadow-sm p-3 mb-4">
                        <h5>Acciones rápidas</h5>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            <a href="/docente" className="btn btn-primary">
                                Panel Docente
                            </a>
                            <a
                                href="/docente/diagnostico"
                                className="btn btn-success"
                            >
                                Pruebas Diagnósticas
                            </a>
                            <a
                                href="/docente/reportes-diagnostico"
                                className="btn btn-warning"
                            >
                                Reportes de Diagnósticos
                            </a>
                            <a
                                href="/docente/asignar-actividad"
                                className="btn btn-info"
                            >
                                Asignación de Actividades Académicas
                            </a>
                            <a
                                href="/docente/cali-retro"
                                className="btn btn-dark"
                            >
                                Calificación y Retroalimentación
                            </a>
                            <a
                                href="/docente/asistencia"
                                className="btn btn-secondary"
                            >
                                Tomar Asistencia
                            </a>
                            <a
                                href="/docente/recursos"
                                className="btn btn-warning"
                            >
                                Recursos Didácticos
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanelDocente;
