import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet, useNavigate } from "react-router-dom";
import AuthUser from "../pageauth/AuthUser";

const LayoutPublic = () => {
    const { getUserId, getRol } = AuthUser();
    const navigate = useNavigate();

    useEffect(() => {
        const userId = getUserId();
        const rol = getRol();

        if (userId) {
            // Si ya está logueado, lo llevamos a su panel según rol
            if (rol === "admin") navigate("/admin", { replace: true });
            else if (rol === "docente") navigate("/docente", { replace: true });
            else if (rol === "estudiante")
                navigate("/estudiante", { replace: true });
        } else {
            // Si no hay usuario, vamos a login
            navigate("/login", { replace: true });
        }
    }, [navigate, getUserId, getRol]);

    return (
        <>
            <Navbar />
            <Outlet />
            <Footer />
        </>
    );
};

export default LayoutPublic;
