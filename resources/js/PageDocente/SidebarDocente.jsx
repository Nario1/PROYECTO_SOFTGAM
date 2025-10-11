// SidebarDocente.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const SidebarDocente = () => {
    return (
        <div className="col-sm-3">
            <div className="list-group">
                {/* Panel principal del docente */}
                <NavLink
                    to="/docente"
                    className="list-group-item list-group-item-action"
                >
                    Panel Docente
                </NavLink>

                {/* Pruebas Diagnósticas */}
                <NavLink
                    to="/docente/diagnostico"
                    className="list-group-item list-group-item-action"
                >
                    Pruebas Diagnósticas
                </NavLink>

                {/* Reportes de Pruebas Diagnósticas */}
                <NavLink
                    to="/docente/reportes-diagnostico"
                    className="list-group-item list-group-item-action"
                >
                    Reportes de Diagnósticos
                </NavLink>

                {/* Asignación de Actividades Académicas */}
                <NavLink
                    to="/docente/asignar-actividad"
                    className="list-group-item list-group-item-action"
                >
                    Asignación de Actividades Académicas
                </NavLink>

                {/* Calificación y Retroalimentación */}
                <NavLink
                    to="/docente/cali-retro"
                    className="list-group-item list-group-item-action"
                >
                    Calificación y Retroalimentación
                </NavLink>

                {/* Toma de Asistencia */}
                <NavLink
                    to="/docente/asistencia"
                    className="list-group-item list-group-item-action"
                >
                    Tomar Asistencia
                </NavLink>

                {/* ✅ Nueva opción: Recursos Didácticos */}
                <NavLink
                    to="/docente/recursos"
                    className="list-group-item list-group-item-action"
                >
                    Recursos Didácticos
                </NavLink>
            </div>
        </div>
    );
};

export default SidebarDocente;
