import React from "react";

const Footer = () => {
    return (
        <footer className="bg-dark text-light py-4 mt-5">
            <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
                {/* Logo o nombre del sistema */}
                <div className="mb-2 mb-md-0 d-flex align-items-center">
                    <img
                        src="/img/logo.jpg"
                        alt="Logo"
                        width="40"
                        height="40"
                        className="me-2 rounded-circle"
                    />
                    <span>TRILENIUM SYSTEM INTERNATIONAL</span>
                </div>

                {/* Derechos y año */}
                <div className="text-center text-md-end">
                    <small>
                        © {new Date().getFullYear()} Todos los derechos
                        reservados
                    </small>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
