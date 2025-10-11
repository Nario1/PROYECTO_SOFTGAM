// Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = () => {
    return (
        <div className="col-sm-3">
            <div className="list-group">
                {/* Solo Administrar Usuarios */}
                <NavLink
                    to="/admin/usuarios"
                    className="list-group-item list-group-item-action"
                >
                    Administrar Usuarios
                </NavLink>
            </div>
        </div>
    );
};

export default Sidebar;
