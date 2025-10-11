import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirigir al login después de 1 segundo (opcional)
        const timer = setTimeout(() => {
            navigate("/login");
        }, 1000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2>Página no encontrada</h2>
            <p>Redirigiendo al login...</p>
        </div>
    );
};

export default NotFound;
