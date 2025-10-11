import React from "react";
import { Link } from "react-router-dom";
import AuthUser from "../pageauth/AuthUser";

const Navbar = () => {
    const { getToken, logout } = AuthUser();

    const logoutUser = () => {
        logout(); // Ejecuta la función de AuthUser
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                {/* Nombre del sistema y logo a la izquierda */}
                <Link
                    className="navbar-brand d-flex align-items-center"
                    to="/login"
                >
                    <img
                        src="/img/logo.png" // ⚡ ruta de la imagen
                        alt="Logo"
                        width="40" // Ajusta el tamaño a tu gusto
                        height="40"
                        className="me-2"
                    />
                    TRILENIUM SYSTEM INTERNATIONAL
                </Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Login/Logout a la derecha */}
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav ms-auto">
                        {getToken() ? (
                            <li className="nav-item">
                                <button
                                    className="btn btn-link nav-link"
                                    onClick={logoutUser}
                                >
                                    Logout
                                </button>
                            </li>
                        ) : (
                            <li className="nav-item">
                                <Link className="nav-link" to="/login">
                                    Login
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
