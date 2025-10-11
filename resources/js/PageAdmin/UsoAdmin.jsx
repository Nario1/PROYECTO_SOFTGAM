import React, { useState } from "react";
import Config from "../Config";

const UsoAdmin = () => {
    const [userId, setUserId] = useState("");
    const [tiempoSesion, setTiempoSesion] = useState("");
    const [actividadesCompletadas, setActividadesCompletadas] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!userId || !tiempoSesion) {
            setError("Debe completar todos los campos obligatorios.");
            return;
        }

        try {
            const response = await Config.LogUso(userId, {
                tiempo_sesion: parseInt(tiempoSesion),
                actividades_completadas: parseInt(actividadesCompletadas) || 0,
            });

            if (response.data.success) {
                setMessage("Sesión registrada correctamente.");
                setUserId("");
                setTiempoSesion("");
                setActividadesCompletadas("");
            } else {
                setError("No se pudo registrar la sesión.");
            }
        } catch (err) {
            console.error(err);
            setError("Error al registrar sesión en el servidor.");
        }
    };

    return (
        <div className="container mt-4">
            <h2>Registrar Sesión de Uso</h2>

            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">ID del Estudiante</label>
                    <input
                        type="number"
                        className="form-control"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">
                        Tiempo de Sesión (minutos)
                    </label>
                    <input
                        type="number"
                        className="form-control"
                        value={tiempoSesion}
                        onChange={(e) => setTiempoSesion(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">
                        Actividades Completadas
                    </label>
                    <input
                        type="number"
                        className="form-control"
                        value={actividadesCompletadas}
                        onChange={(e) =>
                            setActividadesCompletadas(e.target.value)
                        }
                    />
                </div>
                <button type="submit" className="btn btn-primary">
                    Registrar Sesión
                </button>
            </form>
        </div>
    );
};

export default UsoAdmin;
