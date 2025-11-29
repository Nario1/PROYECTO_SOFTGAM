import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthUser from "../pageauth/AuthUser";
import Config from "../Config";
import SidebarEstudiante from "./SidebarEstudiante";
import "../styles/perfil_estudiante.css";

const niveles = [
    { id: 1, nombre: "Novato Matemático ⭐", puntos: 0 },
    { id: 2, nombre: "Aprendiz Experto 🏆", puntos: 20 },
    { id: 3, nombre: "Maestro de Números 👑", puntos: 50 },
];

const PerfilEstudiante = () => {
    const { getUser } = AuthUser();
    const navigate = useNavigate();

    const [puntos, setPuntos] = useState(0);
    const [nivel, setNivel] = useState({});
    const [siguienteNivel, setSiguienteNivel] = useState({});
    const [insignias, setInsignias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [ranking, setRanking] = useState([]);
    const [posicionActual, setPosicionActual] = useState(0);

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

    const calcularProgreso = (puntosActuales) => {
        if (!siguienteNivel || !siguienteNivel.puntos) return 100;

        const puntosBase = nivel?.puntos || 0;
        const puntosNecesarios = siguienteNivel.puntos - puntosBase;
        const puntosObtenidos = puntosActuales - puntosBase;

        return Math.min(100, Math.max(0, (puntosObtenidos / puntosNecesarios) * 100));
    };

    const fetchData = async () => {
        try {
            setLoading(true);

            const user = getUser();
            const userId = user?.id;

            if (!userId) return setLoading(false);

            const resPuntos = await Config.GetPuntosEstudiante(userId);
            const totalPuntos = parseInt(resPuntos.data?.data?.puntos?.total, 10) || 0;

            setPuntos(totalPuntos);

            const { actual, siguiente } = calcularNivel(totalPuntos);
            setNivel(actual);
            setSiguienteNivel(siguiente || { nombre: "Nivel Máximo Alcanzado", puntos: null });

            await Config.CheckInsignias(userId);

            const resInsignias = await Config.GetInsigniasEstudiante(userId);
            const insigniasData = resInsignias.data?.data?.insignias || [];

            const insigniasDefault = [
                {
                    id: 1,
                    nombre: "Primer Logro",
                    descripcion: "Completaste tu primera actividad",
                    icono: "⭐",
                    obtenida: totalPuntos >= 0,
                },
                {
                    id: 2,
                    nombre: "Pensamiento Fluido",
                    descripcion: "Alcanzaste 20 puntos",
                    icono: "🧠",
                    obtenida: totalPuntos >= 20,
                },
                {
                    id: 3,
                    nombre: "Acierto Rápido",
                    descripcion: "Dominaste todos los niveles",
                    icono: "🎯",
                    obtenida: totalPuntos >= 50,
                },
            ];

            setInsignias(insigniasDefault);

            // 🆕 OBTENER RANKING
            const resRanking = await Config.GetLeaderboard();
            const rankingData = resRanking.data?.data?.leaderboard || [];

            const rankingMapeado = rankingData.map((estudiante) => ({
                id: estudiante.id,
                nombre:
                    estudiante.name ||
                    `${estudiante.nombre} ${estudiante.apellido}` ||
                    "Estudiante",
                puntos: parseInt(estudiante.puntos_totales, 10) || 0,
                avatar: "👤",
            }));

            setRanking(rankingMapeado);

            const posicion = rankingMapeado.findIndex((u) => u.id === userId) + 1;
            setPosicionActual(posicion || rankingMapeado.length + 1);

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
        <div className="perfil-container">
            <SidebarEstudiante />

            <div className="perfil-content">
                <div className="perfil-header">
                    <h1 className="perfil-title">🎮 Dashboard de Progreso</h1>
                    <p className="perfil-subtitle">
                        Aquí puedes ver tu avance por niveles, insignias y tu posición en el Ranking.
                    </p>
                </div>

                {loading && <div className="loading-message">⏳ Cargando datos del dashboard...</div>}

                <div className="dashboard-grid">
                    {/* Columna Izquierda */}
                    <div className="columna-izquierda">

                        <div className="puntos-card">
                            <div className="puntos-label">Puntos Totales (OE2: Sistema de Puntos)</div>
                            <div className="puntos-valor">{puntos}</div>

                            <div className="nivel-badge">Nivel Actual (OE3: Progresión por Niveles)</div>
                            <div className="nivel-nombre">{nivel?.nombre || "No definido"}</div>
                        </div>

                        <div className="progreso-card">
                            <div className="progreso-label">
                                Progreso al Siguiente Nivel ({siguienteNivel?.id || "Max"})
                            </div>

                            <div className="progreso-info">
                                {siguienteNivel?.puntos
                                    ? `${puntos} / ${siguienteNivel.puntos} puntos necesarios. (${Math.round(
                                          calcularProgreso(puntos)
                                      )}%)`
                                    : "¡Has alcanzado el nivel máximo!"}
                            </div>

                            <div className="progreso-barra">
                                <div
                                    className="progreso-fill"
                                    style={{ width: `${calcularProgreso(puntos)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* 🆕 CARD DE RANKING */}
                        <div className="ranking-card">
                            <div className="ranking-header">
                                <span className="ranking-title">Tabla de Posiciones (Ranking)</span>
                                <span className="ranking-posicion">#{posicionActual}</span>
                            </div>

                            <div className="ranking-lista">
                                {ranking.length > 0 ? (
                                    ranking.slice(0, 10).map((usuario, index) => (
                                        <div
                                            key={`ranking-${usuario.id}-${index}`}
                                            className={`ranking-item ${
                                                usuario.id === getUser()?.id
                                                    ? "ranking-item-actual"
                                                    : ""
                                            }`}
                                        >
                                            <div className="ranking-numero">{index + 1}</div>
                                            <div className="ranking-avatar">{usuario.avatar}</div>
                                            <div className="ranking-nombre">{usuario.nombre}</div>
                                            <div className="ranking-puntos">{usuario.puntos} pts</div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-data">No hay datos de ranking disponibles</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha */}
                    <div className="columna-derecha">
                        <div className="insignias-card">
                            <div className="insignias-header">🏅 Insignias Obtenidas</div>

                            <div className="insignias-grid">
                                {insignias.map((insignia, index) => (
                                    <div
                                        key={`insignia-${insignia.id}-${index}`}
                                        className={`insignia-item ${
                                            insignia.obtenida
                                                ? "insignia-obtenida"
                                                : "insignia-bloqueada"
                                        }`}
                                    >
                                        <div className="insignia-icono">
                                            {insignia.obtenida ? insignia.icono : "🔒"}
                                        </div>

                                        <div className="insignia-info">
                                            <div className="insignia-nombre">{insignia.nombre}</div>

                                            <div className="insignia-descripcion">
                                                {insignia.obtenida ? insignia.descripcion : "Pendiente"}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    className="btn-jugar"
                    onClick={() => navigate("/estudiante/juegos")}
                    disabled={loading}
                >
                    {loading ? "Cargando..." : "Ir a Jugar (+ Ejercicios Gamificados)"}
                </button>
            </div>
        </div>
    );
};

export default PerfilEstudiante;