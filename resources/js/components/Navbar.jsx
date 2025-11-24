import React from "react";
import { Link } from "react-router-dom";
import AuthUser from "../pageauth/AuthUser";
import "../styles/Navbar.css"; // Asegúrate de importar tu CSS

const Navbar = () => {
    const { getToken, logout } = AuthUser();

    const logoutUser = () => {
        logout();
    };

    return (
        <nav className="navbar">
            {/* 🔹 Logo y nombre del sistema */}
            <div className="navbar-logo">
                <Link
                    to="/login"
                    style={{ textDecoration: "none", color: "inherit" }}
                >
                    <img
                        src="softgam/img/logo.jpg"
                        alt="Logo"
                        width="36"
                        height="36"
                        style={{
                            verticalAlign: "middle",
                            marginRight: "8px",
                            borderRadius: "8px",
                        }}
                    />
                    TRILENIUM
                </Link>
            </div>

            {/* 🔹 Enlaces */}
            <div className="nav-links">
                {getToken() ? (
                    <button className="nav-btn" onClick={logoutUser}>
                        Logout
                    </button>
                ) : (
                    <Link to="/login" className="nav-link">
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
