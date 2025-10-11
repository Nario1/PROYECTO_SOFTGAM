// src/layouts/LayoutPublic.jsx
import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import AuthUser from "../pageauth/AuthUser";

// 🧩 Componentes que ya tenías
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const LayoutPublic = () => {
    const { getToken, getRol } = AuthUser();

    // 🔒 Si ya hay sesión activa, redirigir al panel correspondiente
    if (getToken()) {
        if (getRol() === "admin") return <Navigate to="/admin" replace />;
        if (getRol() === "docente") return <Navigate to="/docente" replace />;
        if (getRol() === "estudiante")
            return <Navigate to="/estudiante" replace />;
    }

    // 🧱 Si no está logueado, mostrar el layout público
    return (
        <>
            <Navbar />
            <main className="container py-4">
                <Outlet />
            </main>
            <Footer />
        </>
    );
};

export default LayoutPublic;
