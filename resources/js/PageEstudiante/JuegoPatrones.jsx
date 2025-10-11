import React, { useState, useEffect } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";
import "../styles/docente.css";
import "../styles/gamificacion.css";

const niveles = [
    { id: 1, nombre: "Nivel 1", puntos: 0 },
    { id: 2, nombre: "Nivel 2", puntos: 20 },
    { id: 3, nombre: "Nivel 3", puntos: 50 },
];

const preguntas = [
    { id: 1, texto: "2, 4, 6, ?", respuesta: "8" },
    { id: 2, texto: "5, 10, 15, ?", respuesta: "20" },
    { id: 3, texto: "1, 4, 9, 16, ?", respuesta: "25" },
];

const JuegoPatrones = () => {
    const { getUser } = AuthUser();
    const [puntos, setPuntos] = useState(0);
    const [nivel, setNivel] = useState({});
    const [siguienteNivel, setSiguienteNivel] = useState({});
    const [insignias, setInsignias] = useState([]);
    const [preguntaActual, setPreguntaActual] = useState(0);
    const [respuesta, setRespuesta] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false);
    const [dragRespuesta, setDragRespuesta] = useState("");

    const calcularNivel = (totalPuntos) => {
        let actual = niveles[0];
        let siguiente = null;
        for (let i = 0; i < niveles.length; i++) {
            if (totalPuntos >= niveles[i].puntos) {
                actual = niveles[i];
                siguiente = niveles[i + 1] || null;
            }
        }
        return { actual, siguiente };
    };

    const actualizarInsignias = (totalPuntos) => {
        let nuevas = [];
        if (totalPuntos >= 0)
            nuevas.push({
                id: 1,
                nombre: "Insignia Novato",
                descripcion: "Otorgada por completar la primera jugada",
            });
        if (totalPuntos >= 20)
            nuevas.push({
                id: 2,
                nombre: "Insignia Experto",
                descripcion: "Otorgada por alcanzar 20 puntos",
            });
        if (totalPuntos >= 50)
            nuevas.push({
                id: 3,
                nombre: "Insignia Maestro",
                descripcion: "Otorgada por completar todos los niveles",
            });
        setInsignias(nuevas);
    };

    const responder = async (respuestaUsuario) => {
        const pregunta = preguntas[preguntaActual];
        if (!pregunta) return;
        const user = getUser();
        const userId = user?.id;
        if (!userId) return;

        if (respuestaUsuario.trim() === pregunta.respuesta) {
            const nuevosPuntos = puntos + 10;
            setPuntos(nuevosPuntos);
            setMensaje("✅ ¡Correcto!");
            const { actual, siguiente } = calcularNivel(nuevosPuntos);
            setNivel(actual);
            setSiguienteNivel(siguiente || { nombre: "No definido" });
            actualizarInsignias(nuevosPuntos);

            try {
                setLoading(true);
                await Config.AddPuntos(
                    userId,
                    10,
                    "Respuesta correcta en el juego de patrones"
                );
                await Config.CheckInsignias(userId);
            } catch (error) {
                console.error("Error al guardar los puntos:", error);
            } finally {
                setLoading(false);
            }
        } else {
            setMensaje("❌ Incorrecto, intenta nuevamente.");
        }

        setRespuesta("");
        setPreguntaActual((prev) => prev + 1);
        setDragRespuesta("");
    };

    const fetchPuntosIniciales = async () => {
        try {
            const user = getUser();
            const userId = user?.id;
            if (!userId) return;

            const res = await Config.GetPuntosEstudiante(userId);
            const totalPuntos = res.data?.data?.puntos?.total || 0;
            setPuntos(totalPuntos);

            const { actual, siguiente } = calcularNivel(totalPuntos);
            setNivel(actual);
            setSiguienteNivel(siguiente || { nombre: "No definido" });
            actualizarInsignias(totalPuntos);
        } catch (error) {
            console.error("Error al obtener puntos iniciales:", error);
        }
    };

    useEffect(() => {
        fetchPuntosIniciales();
    }, []);

    const pregunta = preguntas[preguntaActual];

    /* Drag & Drop Handlers */
    const handleDragStart = (e, valor) => {
        e.dataTransfer.setData("text/plain", valor);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        const valor = e.dataTransfer.getData("text/plain");
        setDragRespuesta(valor);
    };
    const allowDrop = (e) => e.preventDefault();

    return (
        <div className="flex bg-gray-900 min-h-screen p-4">
            <div className="flex flex-col w-full max-w-6xl mx-auto space-y-6">
                {/* 🟡 Cards de progreso en fila */}
                <div className="flex gap-4 justify-center">
                    <div className="card-progreso text-center flex-1">
                        <h2>⭐ Puntos</h2>
                        <p className="puntos-animacion">{puntos}</p>
                    </div>
                    <div className="card-progreso text-center flex-1">
                        <h2>📘 Nivel</h2>
                        <p>{nivel?.nombre || "No definido"}</p>
                    </div>
                    <div className="card-progreso text-center flex-1">
                        <h2>⬆️ Siguiente Nivel</h2>
                        <p>{siguienteNivel?.nombre || "No definido"}</p>
                    </div>
                </div>

                {/* 🎯 Card del juego */}
                <div className="card-juego p-6 space-y-4">
                    {/* Insignias */}
                    <div className="card-insignias">
                        <h2 className="text-xl font-bold mb-2">🏅 Insignias</h2>
                        {insignias.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2">
                                {insignias.map((i) => (
                                    <div key={i.id} className="insignia-card">
                                        <h3>{i.nombre}</h3>
                                        <p>{i.descripcion}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-200">
                                Aún no tienes insignias.
                            </p>
                        )}
                    </div>

                    {/* Pregunta Drag & Drop */}
                    {pregunta && (
                        <div className="card-pregunta">
                            <p className="mb-2 text-white font-semibold">
                                Pregunta: {pregunta.texto}
                            </p>

                            <div
                                className="drop-zone mb-3"
                                onDrop={handleDrop}
                                onDragOver={allowDrop}
                            >
                                {dragRespuesta || "Arrastra tu respuesta aquí"}
                            </div>

                            <div className="flex space-x-2 justify-center mb-3 flex-wrap">
                                {["5", "8", "10", "15", "20", "25"].map(
                                    (num) => (
                                        <div
                                            key={num}
                                            className="respuesta-draggable"
                                            draggable
                                            onDragStart={(e) =>
                                                handleDragStart(e, num)
                                            }
                                        >
                                            {num}
                                        </div>
                                    )
                                )}
                            </div>

                            <button
                                className="btn-gamificacion w-full"
                                onClick={() => responder(dragRespuesta)}
                                disabled={!dragRespuesta || loading}
                            >
                                {loading ? "Guardando..." : "Enviar"}
                            </button>

                            {mensaje && (
                                <p className="mt-2 text-white font-bold">
                                    {mensaje}
                                </p>
                            )}
                        </div>
                    )}

                    {!pregunta && (
                        <p className="text-white text-center mt-4">
                            🎉 ¡Has completado todas las preguntas!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JuegoPatrones;
