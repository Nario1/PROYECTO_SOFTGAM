import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";

const niveles = [
    { id: 1, nombre: "Nivel 1", puntos: 0 },
    { id: 2, nombre: "Nivel 2", puntos: 20 },
    { id: 3, nombre: "Nivel 3", puntos: 50 },
];

const PerfilEstudiante = () => {
    const { getUser } = AuthUser();
    const [puntos, setPuntos] = useState(0);
    const [nivel, setNivel] = useState({});
    const [siguienteNivel, setSiguienteNivel] = useState({});
    const [insignias, setInsignias] = useState([]);
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

    const fetchData = async () => {
        try {
            setLoading(true);
            const user = getUser();
            const userId = user?.id;
            if (!userId) return setLoading(false);

            // Obtener puntos del estudiante
            const resPuntos = await Config.GetPuntosEstudiante(userId);
            const totalPuntos = resPuntos.data?.data?.puntos?.total || 0;
            setPuntos(totalPuntos);

            // Calcular nivel según puntos
            const { actual, siguiente } = calcularNivel(totalPuntos);
            setNivel(actual);
            setSiguienteNivel(siguiente || { nombre: "No definido" });

            // Actualizar insignias en backend
            await Config.CheckInsignias(userId);

            // Obtener insignias del estudiante
            const resInsignias = await Config.GetInsigniasEstudiante(userId);
            let insigniasData = resInsignias.data?.data?.insignias || [];

            // Forzar asignación de insignias según puntos/nivel
            if (
                totalPuntos >= 0 &&
                !insigniasData.find((i) => i.nombre === "Insignia Novato")
            ) {
                insigniasData.push({
                    id: 1,
                    nombre: "Insignia Novato",
                    descripcion: "Otorgada por completar la primera jugada",
                    criterio: "nivel:1",
                });
            }
            if (
                totalPuntos >= 20 &&
                !insigniasData.find((i) => i.nombre === "Insignia Experto")
            ) {
                insigniasData.push({
                    id: 2,
                    nombre: "Insignia Experto",
                    descripcion: "Otorgada por alcanzar 50 puntos",
                    criterio: "nivel:2",
                });
            }
            if (
                totalPuntos >= 50 &&
                !insigniasData.find((i) => i.nombre === "Insignia Maestro")
            ) {
                insigniasData.push({
                    id: 3,
                    nombre: "Insignia Maestro",
                    descripcion: "Otorgada por completar todos los niveles",
                    criterio: "nivel:3",
                });
            }

            setInsignias(insigniasData);
        } catch (error) {
            console.error("Error al cargar el dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm text-center space-y-6">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    🎮 Mi Dashboard
                </h1>

                <button
                    onClick={fetchData}
                    disabled={loading}
                    className={`w-full px-6 py-2 rounded-full font-semibold text-white transition-colors duration-300
                        ${
                            loading
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                >
                    {loading ? "Actualizando..." : "Actualizar Dashboard"}
                </button>

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
                    🏅 Mis Insignias
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
                        Aún no tienes insignias. ¡Completa retos para ganarlas!
                    </p>
                )}
            </div>
        </div>
    );
};

export default PerfilEstudiante;
