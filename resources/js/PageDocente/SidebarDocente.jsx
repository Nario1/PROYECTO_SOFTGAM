// SidebarDocente.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/sidebar.css"; // Usamos los estilos globales para todos los sidebars

const SidebarDocente = () => {
    return (
        <div className="sidebar">
            <h3>Panel Docente</h3>

            <NavLink
                to="/docente"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Inicio
            </NavLink>
            <NavLink
                to="/docente/diagnostico"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Pruebas Diagnósticas
            </NavLink>
            <NavLink
                to="/docente/reportes-diagnostico"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Reportes Diagnósticos
            </NavLink>
            <NavLink
                to="/docente/asignar-actividad"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Asignar Actividades
            </NavLink>
            <NavLink
                to="/docente/cali-retro"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Calificación y Retroalimentación
            </NavLink>
            <NavLink
                to="/docente/asistencia"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Tomar Asistencia
            </NavLink>
            <NavLink
                to="/docente/recursos"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Recursos Didácticos
            </NavLink>
        </div>
    );
};

export default SidebarDocente;
