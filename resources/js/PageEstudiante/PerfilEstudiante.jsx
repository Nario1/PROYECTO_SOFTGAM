import React, { useEffect, useState } from "react";
import AuthUser from "../pageauth/AuthUser";
import Config from "../Config";
import SidebarEstudiante from "./SidebarEstudiante";
import "../styles/docente.css"; // estilos generales

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

            const resPuntos = await Config.GetPuntosEstudiante(userId);
            const totalPuntos = resPuntos.data?.data?.puntos?.total || 0;
            setPuntos(totalPuntos);

            const { actual, siguiente } = calcularNivel(totalPuntos);
            setNivel(actual);
            setSiguienteNivel(siguiente || { nombre: "No definido" });

            await Config.CheckInsignias(userId);

            const resInsignias = await Config.GetInsigniasEstudiante(userId);
            let insigniasData = resInsignias.data?.data?.insignias || [];

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
                    descripcion: "Otorgada por alcanzar 20 puntos",
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
        <div className="admin-container">
            <SidebarEstudiante />

            <div
                className="admin-content flex flex-col gap-6 overflow-y-auto"
                style={{
                    maxHeight: "calc(100vh - 2rem)",
                    paddingBottom: "2rem",
                }}
            >
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    🎮 Mi Dashboard
                </h1>

                <button
                    onClick={fetchData}
                    disabled={loading}
                    className={`w-full px-6 py-2 rounded-xl font-semibold text-white transition-colors duration-300 admin-btn ${
                        loading
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                    }`}
                >
                    {loading ? "Actualizando..." : "Actualizar Dashboard"}
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-xl p-4 shadow-md border border-gray-700">
                        <h2 className="text-sm font-medium text-yellow-400">
                            ⭐ Puntos
                        </h2>
                        <p className="text-2xl font-bold text-yellow-300">
                            {puntos}
                        </p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 shadow-md border border-gray-700">
                        <h2 className="text-sm font-medium text-blue-400">
                            📘 Nivel Actual
                        </h2>
                        <p className="text-xl font-semibold text-blue-300">
                            {nivel?.nombre || "No definido"}
                        </p>
                    </div>
                    <div className="bg-gray-800 rounded-xl p-4 shadow-md border border-gray-700">
                        <h2 className="text-sm font-medium text-green-400">
                            ⬆️ Siguiente Nivel
                        </h2>
                        <p className="text-xl font-semibold text-green-300">
                            {siguienteNivel?.nombre || "No definido"}
                        </p>
                    </div>
                </div>

                <h2 className="text-xl font-bold mt-6 text-white">
                    🏅 Mis Insignias
                </h2>
                {insignias.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                        {insignias.map((insignia) => (
                            <div
                                key={insignia.id}
                                className="bg-gray-800 rounded-xl p-3 shadow-md border border-gray-700 text-left"
                            >
                                <h3 className="font-semibold text-pink-400">
                                    {insignia.nombre}
                                </h3>
                                <p className="text-sm text-gray-300">
                                    {insignia.descripcion}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">
                        Aún no tienes insignias. ¡Completa retos para ganarlas!
                    </p>
                )}
            </div>
        </div>
    );
};

export default PerfilEstudiante;
