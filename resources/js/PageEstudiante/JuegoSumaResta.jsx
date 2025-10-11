import React, { useState, useEffect } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";

const niveles = [
    { id: 1, nombre: "Nivel 1", puntos: 0 },
    { id: 2, nombre: "Nivel 2", puntos: 20 },
    { id: 3, nombre: "Nivel 3", puntos: 50 },
];

const problemas = [
    {
        id: 1,
        nivel: 1,
        pregunta: "Si tienes 3 manzanas y te dan 2 más, ¿cuántas tienes?",
        respuesta: 5,
    },
    {
        id: 2,
        nivel: 1,
        pregunta: "Si tienes 5 caramelos y comes 2, ¿cuántos te quedan?",
        respuesta: 3,
    },
    {
        id: 3,
        nivel: 2,
        pregunta: "Si compras 12 lápices y pierdes 4, ¿cuántos te quedan?",
        respuesta: 8,
    },
    {
        id: 4,
        nivel: 2,
        pregunta:
            "Hay 15 pájaros en un árbol y 7 se van volando, ¿cuántos quedan?",
        respuesta: 8,
    },
    {
        id: 5,
        nivel: 3,
        pregunta: "Una tienda tiene 45 juguetes, vende 17, ¿cuántos quedan?",
        respuesta: 28,
    },
    {
        id: 6,
        nivel: 3,
        pregunta: "Si hay 32 galletas y comes 18, ¿cuántas quedan?",
        respuesta: 14,
    },
];

const JuegoSumaResta = () => {
    const { getUser } = AuthUser();
    const [puntos, setPuntos] = useState(0);
    const [nivel, setNivel] = useState({});
    const [siguienteNivel, setSiguienteNivel] = useState({});
    const [insignias, setInsignias] = useState([]);
    const [indiceProblema, setIndiceProblema] = useState(0);
    const [respuestaUsuario, setRespuestaUsuario] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false);

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
        const nuevas = [];
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

    const problema = problemas[indiceProblema];

    const manejarRespuesta = async () => {
        if (!problema) return;
        const user = getUser();
        const userId = user?.id;
        if (!userId) return;

        if (parseInt(respuestaUsuario) === problema.respuesta) {
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
                    "Respuesta correcta en Suma y Resta"
                );
                await Config.CheckInsignias(userId);
            } catch (error) {
                console.error("Error al guardar puntos:", error);
            } finally {
                setLoading(false);
            }

            // Siguiente problema
            setIndiceProblema(indiceProblema + 1);
        } else {
            setMensaje("❌ Incorrecto, intenta nuevamente.");
        }

        setRespuestaUsuario("");
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm text-center space-y-6">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    🎮 Estado Actual del Juego
                </h1>

                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-yellow-50 rounded-2xl p-4 shadow-md">
                        <h2 className="text-sm font-medium text-yellow-600">
                            ⭐ Puntos
                        </h2>
                        <p className="text-2xl font-bold text-yellow-800">
                            {puntos}
                        </p>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4 shadow-md">
                        <h2 className="text-sm font-medium text-blue-600">
                            📘 Nivel Actual
                        </h2>
                        <p className="text-xl font-semibold text-blue-800">
                            {nivel?.nombre || "No definido"}
                        </p>
                    </div>
                    <div className="bg-green-50 rounded-2xl p-4 shadow-md">
                        <h2 className="text-sm font-medium text-green-600">
                            ⬆️ Siguiente Nivel
                        </h2>
                        <p className="text-xl font-semibold text-green-800">
                            {siguienteNivel?.nombre || "No definido"}
                        </p>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-gray-900 mt-4">
                    🏅 Insignias del Nivel
                </h2>
                {insignias.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                        {insignias.map((insignia) => (
                            <div
                                key={insignia.id}
                                className="bg-pink-50 rounded-xl p-3 shadow-sm text-left"
                            >
                                <h3 className="font-semibold text-pink-600">
                                    {insignia.nombre}
                                </h3>
                                <p className="text-sm text-gray-700">
                                    {insignia.descripcion}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">
                        Aún no tienes insignias en este nivel.
                    </p>
                )}

                {problema ? (
                    <div className="mt-6">
                        <p className="text-lg font-semibold text-gray-800 mb-2">
                            Pregunta: {problema.pregunta}
                        </p>
                        <input
                            type="number"
                            className="border border-gray-300 rounded-lg p-2 w-full text-center"
                            placeholder="Tu respuesta"
                            value={respuestaUsuario}
                            onChange={(e) =>
                                setRespuestaUsuario(e.target.value)
                            }
                        />
                        <button
                            onClick={manejarRespuesta}
                            disabled={loading}
                            className={`w-full mt-3 py-2 rounded-full font-semibold text-white ${
                                loading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                        >
                            {loading ? "Guardando..." : "Enviar"}
                        </button>
                        {mensaje && (
                            <p className="mt-2 text-lg font-medium text-gray-800">
                                {mensaje}
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="text-lg text-gray-700 mt-4">
                        🎉 ¡Has completado todas las preguntas!
                    </p>
                )}
            </div>
        </div>
    );
};

export default JuegoSumaResta;
