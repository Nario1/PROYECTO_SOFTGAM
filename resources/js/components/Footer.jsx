import React from "react";
import logo from "./logo.jpg"; // ← Igual que en el Navbar

const Footer = () => {
    return (
        <footer className="bg-dark text-light py-4 mt-5">
            <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
                {/* Logo + nombre */}
                <div className="mb-2 mb-md-0 d-flex align-items-center">
                    <img
                        src={logo}  // ← Misma lógica que Navbar
                        alt="Logo"
                        width="40"
                        height="40"
                        style={{
                            borderRadius: "8px",
                            marginRight: "8px",
                        }}
                    />
                    <span>TRILENIUM SYSTEM INTERNATIONAL</span>
                </div>

                {/* Derechos */}
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
