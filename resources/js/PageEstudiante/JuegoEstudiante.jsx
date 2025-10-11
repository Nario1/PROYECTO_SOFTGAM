import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Config from "../Config";

const JuegosEstudiante = () => {
    const [juegos, setJuegos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nivel, setNivel] = useState(1); // Nivel del estudiante
    const [insignia, setInsignia] = useState(null); // Recompensa
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJuegos = async () => {
            try {
                const res = await Config.GetJuegos(); // Trae juegos desde Laravel

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

    if (loading)
        return <div className="text-center mt-4">⏳ Cargando juegos...</div>;
    if (error)
        return <div className="text-center mt-4 text-danger">⚠️ {error}</div>;

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
        <div className="container mt-4">
            <h2 className="text-center mb-2">🎮 Juegos disponibles</h2>
            <p className="text-center">
                Nivel actual: <strong>{nivel}</strong>{" "}
                {insignia && <span>{insignia}</span>}
            </p>

            {juegos.length === 0 ? (
                <p className="text-center">
                    No hay juegos disponibles en este momento.
                </p>
            ) : (
                <div className="row">
                    {juegos.map((juego) => (
                        <div key={juego.id} className="col-md-4 mb-4">
                            <div className="card h-100 shadow-sm">
                                <img
                                    src={
                                        juego.imagen
                                            ? `http://localhost:8000/storage/${juego.imagen}`
                                            : "https://via.placeholder.com/300x200?text=Sin+imagen"
                                    }
                                    className="card-img-top"
                                    alt={juego.nombre || "Juego sin nombre"}
                                    style={{
                                        height: "200px",
                                        objectFit: "cover",
                                    }}
                                />
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title text-center">
                                        {juego.nombre}
                                    </h5>
                                    <p className="card-text">
                                        {juego.descripcion || "Sin descripción"}
                                    </p>
                                    <p className="card-text">
                                        <strong>Temática:</strong>{" "}
                                        {juego.tematica?.nombre ||
                                            "Sin temática"}
                                    </p>
                                    <p className="card-text">
                                        <strong>Dificultad:</strong>{" "}
                                        {juego.dificultad_promedio || 2}
                                    </p>
                                    <p className="card-text">
                                        <strong>Puntos:</strong>{" "}
                                        {juego.progreso?.puntos_totales || 0} |
                                        <strong> Nivel:</strong>{" "}
                                        {juego.nivelCalculado}
                                    </p>

                                    <button
                                        className="btn btn-primary mt-auto w-100"
                                        onClick={() => handlePlay(juego)}
                                    >
                                        🎯 Jugar ahora
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default JuegosEstudiante;
