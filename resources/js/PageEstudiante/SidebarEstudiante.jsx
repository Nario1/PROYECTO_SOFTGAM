import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/sidebar.css"; // Usamos los estilos del sidebar del docente

const SidebarEstudiante = () => {
    return (
        <div className="sidebar">
            <h3>Panel Estudiante</h3>

            <NavLink
                to="/estudiante/perfil"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Perfil Académico
            </NavLink>

            <NavLink
                to="/estudiante/juegos"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Juegos / Actividades
            </NavLink>

            <NavLink
                to="/estudiante/actividades"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Actividades
            </NavLink>

            <NavLink
                to="/estudiante/diagnostico"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Prueba Diagnóstica
            </NavLink>

            <NavLink
                to="/estudiante/calificaciones"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Calificaciones / Retroalimentación
            </NavLink>

            <NavLink
                to="/estudiante/asistencia"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Asistencia
            </NavLink>

            <NavLink
                to="/estudiante/recursos"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Recursos
            </NavLink>
        </div>
    );
};

export default SidebarEstudiante;
