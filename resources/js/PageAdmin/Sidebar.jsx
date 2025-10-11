// Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import "../styles/sidebar.css"; // Importamos tus estilos globales

const Sidebar = () => {
    return (
        <div className="sidebar">
            <h3>Panel Admin</h3>
            <NavLink
                to="/admin/usuarios"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Administrar Usuarios
            </NavLink>
            {/* Aquí puedes añadir más enlaces de administración */}
        </div>
    );
};

export default Sidebar;
