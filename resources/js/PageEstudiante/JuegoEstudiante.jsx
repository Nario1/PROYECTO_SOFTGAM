import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Config from "../Config";
import SidebarEstudiante from "./SidebarEstudiante"; // sidebar
import "../styles/docente.css"; // estilos generales

const JuegosEstudiante = () => {
    const [juegos, setJuegos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nivel, setNivel] = useState(1);
    const [insignia, setInsignia] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJuegos = async () => {
            try {
                const res = await Config.GetJuegos();

                if (
                    res?.data?.success &&
                    Array.isArray(res?.data?.data?.juegos)
                ) {
                    const juegosConNivel = res.data.data.juegos.map((juego) => {
                        const puntos = juego.progreso?.puntos_totales || 0;
                        const nivelCalculado = Math.floor(puntos / 100) + 1;
                        const obtieneInsignia = nivelCalculado >= 5;

                        if (obtieneInsignia)
                            setInsignia("🏅 Has ganado una insignia!");

                        return {
                            ...juego,
                            nivelCalculado,
                        };
                    });

                    const nivelMax = Math.max(
                        ...juegosConNivel.map((j) => j.nivelCalculado)
                    );
                    setNivel(nivelMax);
                    setJuegos(juegosConNivel);
                } else {
                    setError(
                        "No se pudieron obtener los juegos correctamente."
                    );
                }
            } catch (err) {
                console.error("❌ Error al cargar juegos:", err);
                setError("Hubo un problema al conectar con el servidor.");
            } finally {
                setLoading(false);
            }
        };

        fetchJuegos();
    }, []);

    const handlePlay = (juego) => {
        const nombre = juego.nombre.toLowerCase();

        if (nombre.includes("patrones")) {
            navigate("/estudiante/juegos/patrones");
        } else if (nombre.includes("suma") || nombre.includes("resta")) {
            navigate("/estudiante/juegos/sumayresta");
        } else {
            alert("Este juego aún no tiene implementada la ruta.");
        }
    };

    return (
        <div
            className="admin-container d-flex"
            style={{ minHeight: "100vh", background: "#111" }}
        >
            {/* Sidebar */}
            <SidebarEstudiante />

            <div
                className="admin-content flex-grow-1 overflow-y-auto p-6"
                style={{ maxHeight: "calc(100vh - 2rem)" }}
            >
                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                    🎮 Juegos disponibles
                </h2>
                <p className="text-center text-white mb-4">
                    Nivel actual: <strong>{nivel}</strong>{" "}
                    {insignia && <span>{insignia}</span>}
                </p>

                {loading && (
                    <p className="text-center text-white">
                        ⏳ Cargando juegos...
                    </p>
                )}
                {error && <p className="text-center text-danger">⚠️ {error}</p>}

                {!loading && !error && juegos.length === 0 && (
                    <p className="text-center text-white">
                        No hay juegos disponibles en este momento.
                    </p>
                )}

                <div className="row">
                    {juegos.map((juego) => (
                        <div key={juego.id} className="col-md-4 mb-4">
                            <div className="admin-card h-100 d-flex flex-column p-4 shadow-sm">
                                <img
                                    src={
                                        juego.imagen
                                            ? `http://localhost:8000/storage/${juego.imagen}`
                                            : "https://via.placeholder.com/300x200?text=Sin+imagen"
                                    }
                                    alt={juego.nombre || "Juego sin nombre"}
                                    style={{
                                        width: "100%",
                                        height: "200px",
                                        objectFit: "cover",
                                        borderRadius: "0.5rem",
                                        marginBottom: "1rem",
                                    }}
                                />
                                <h5 className="text-white text-center mb-2">
                                    {juego.nombre}
                                </h5>
                                <p className="text-white mb-1">
                                    {juego.descripcion || "Sin descripción"}
                                </p>
                                <p className="text-white mb-1">
                                    <strong>Temática:</strong>{" "}
                                    {juego.tematica?.nombre || "Sin temática"}
                                </p>
                                <p className="text-white mb-1">
                                    <strong>Dificultad:</strong>{" "}
                                    {juego.dificultad_promedio || 2}
                                </p>
                                <p className="text-white mb-3">
                                    <strong>Puntos:</strong>{" "}
                                    {juego.progreso?.puntos_totales || 0} |{" "}
                                    <strong>Nivel:</strong>{" "}
                                    {juego.nivelCalculado}
                                </p>
                                <button
                                    className="admin-btn mt-auto w-100"
                                    onClick={() => handlePlay(juego)}
                                >
                                    🎯 Jugar ahora
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default JuegosEstudiante;
