// SidebarEstudiante.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const SidebarEstudiante = () => {
    return (
        <div className="col-sm-3">
            <div className="list-group">
                {/* Perfil Académico */}
                <NavLink
                    to="/estudiante/perfil"
                    className="list-group-item list-group-item-action"
                >
                    Perfil Académico
                </NavLink>

                {/* Juegos / Actividades */}
                <NavLink
                    to="/estudiante/juegos"
                    className="list-group-item list-group-item-action"
                >
                    Juegos / Actividades
                </NavLink>

                {/* Actividades asignadas */}
                <NavLink
                    to="/estudiante/actividades"
                    className="list-group-item list-group-item-action"
                >
                    Actividades
                </NavLink>

                {/* Prueba Diagnóstica */}
                <NavLink
                    to="/estudiante/diagnostico"
                    className="list-group-item list-group-item-action"
                >
                    Prueba Diagnóstica
                </NavLink>

                {/* Calificaciones y Retroalimentaciones */}
                <NavLink
                    to="/estudiante/calificaciones"
                    className="list-group-item list-group-item-action"
                >
                    Calificaciones / Retroalimentación
                </NavLink>

                {/* Asistencia */}
                <NavLink
                    to="/estudiante/asistencia"
                    className="list-group-item list-group-item-action"
                >
                    Asistencia
                </NavLink>

                {/* Recursos del Estudiante */}
                <NavLink
                    to="/estudiante/recursos"
                    className="list-group-item list-group-item-action"
                >
                    Recursos
                </NavLink>
            </div>
        </div>
    );
};

export default SidebarEstudiante;
