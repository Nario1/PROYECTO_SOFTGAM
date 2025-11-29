import React, { useState, useEffect } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";
import "../styles/juegos.css";

const niveles = [
    { id: 1, nombre: "Nivel 1", puntos: 0 },
    { id: 2, nombre: "Nivel 2", puntos: 20 },
    { id: 3, nombre: "Nivel 3", puntos: 50 },
];

const preguntasBase = [
    // Sumas básicas
    { id: 1, texto: "5 + 3 = ?", respuesta: "8", opciones: ["6", "7", "8", "9", "10", "11"] },
    { id: 2, texto: "12 + 8 = ?", respuesta: "20", opciones: ["18", "19", "20", "21", "22", "23"] },
    { id: 3, texto: "15 + 5 = ?", respuesta: "20", opciones: ["18", "19", "20", "21", "22", "23"] },
    { id: 4, texto: "7 + 9 = ?", respuesta: "16", opciones: ["14", "15", "16", "17", "18", "19"] },
    { id: 5, texto: "23 + 7 = ?", respuesta: "30", opciones: ["28", "29", "30", "31", "32", "33"] },
    
    // Sumas con decenas
    { id: 6, texto: "20 + 15 = ?", respuesta: "35", opciones: ["33", "34", "35", "36", "37", "38"] },
    { id: 7, texto: "40 + 25 = ?", respuesta: "65", opciones: ["63", "64", "65", "66", "67", "68"] },
    { id: 8, texto: "30 + 18 = ?", respuesta: "48", opciones: ["46", "47", "48", "49", "50", "51"] },
    { id: 9, texto: "50 + 32 = ?", respuesta: "82", opciones: ["80", "81", "82", "83", "84", "85"] },
    { id: 10, texto: "60 + 24 = ?", respuesta: "84", opciones: ["82", "83", "84", "85", "86", "87"] },
    
    // Restas básicas
    { id: 11, texto: "10 - 3 = ?", respuesta: "7", opciones: ["5", "6", "7", "8", "9", "10"] },
    { id: 12, texto: "15 - 8 = ?", respuesta: "7", opciones: ["5", "6", "7", "8", "9", "10"] },
    { id: 13, texto: "20 - 5 = ?", respuesta: "15", opciones: ["13", "14", "15", "16", "17", "18"] },
    { id: 14, texto: "18 - 9 = ?", respuesta: "9", opciones: ["7", "8", "9", "10", "11", "12"] },
    { id: 15, texto: "25 - 7 = ?", respuesta: "18", opciones: ["16", "17", "18", "19", "20", "21"] },
    
    // Restas con decenas
    { id: 16, texto: "30 - 12 = ?", respuesta: "18", opciones: ["16", "17", "18", "19", "20", "21"] },
    { id: 17, texto: "50 - 23 = ?", respuesta: "27", opciones: ["25", "26", "27", "28", "29", "30"] },
    { id: 18, texto: "45 - 18 = ?", respuesta: "27", opciones: ["25", "26", "27", "28", "29", "30"] },
    { id: 19, texto: "70 - 35 = ?", respuesta: "35", opciones: ["33", "34", "35", "36", "37", "38"] },
    { id: 20, texto: "80 - 42 = ?", respuesta: "38", opciones: ["36", "37", "38", "39", "40", "41"] },
    
    // Sumas más complejas
    { id: 21, texto: "34 + 28 = ?", respuesta: "62", opciones: ["60", "61", "62", "63", "64", "65"] },
    { id: 22, texto: "45 + 37 = ?", respuesta: "82", opciones: ["80", "81", "82", "83", "84", "85"] },
    { id: 23, texto: "56 + 29 = ?", respuesta: "85", opciones: ["83", "84", "85", "86", "87", "88"] },
    { id: 24, texto: "67 + 18 = ?", respuesta: "85", opciones: ["83", "84", "85", "86", "87", "88"] },
    { id: 25, texto: "78 + 15 = ?", respuesta: "93", opciones: ["91", "92", "93", "94", "95", "96"] },
    
    // Restas más complejas
    { id: 26, texto: "65 - 28 = ?", respuesta: "37", opciones: ["35", "36", "37", "38", "39", "40"] },
    { id: 27, texto: "74 - 39 = ?", respuesta: "35", opciones: ["33", "34", "35", "36", "37", "38"] },
    { id: 28, texto: "82 - 45 = ?", respuesta: "37", opciones: ["35", "36", "37", "38", "39", "40"] },
    { id: 29, texto: "93 - 56 = ?", respuesta: "37", opciones: ["35", "36", "37", "38", "39", "40"] },
    { id: 30, texto: "100 - 67 = ?", respuesta: "33", opciones: ["31", "32", "33", "34", "35", "36"] },
];

const JuegoSumaResta = () => {
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
    const [animarPuntos, setAnimarPuntos] = useState(false);
    const [respuestaCorrecta, setRespuestaCorrecta] = useState(false);
    const [respuestaIncorrecta, setRespuestaIncorrecta] = useState(false);
    const [preguntas, setPreguntas] = useState([]);

    // Mezclar array aleatoriamente
    const mezclarArray = (array) => {
        const nuevoArray = [...array];
        for (let i = nuevoArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nuevoArray[i], nuevoArray[j]] = [nuevoArray[j], nuevoArray[i]];
        }
        return nuevoArray;
    };

    // Inicializar preguntas aleatorias al montar el componente
    useEffect(() => {
        const preguntasMezcladas = mezclarArray(preguntasBase);
        setPreguntas(preguntasMezcladas);
    }, []);

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
                nombre: "Calculador Novato",
                descripcion: "Completaste tu primera operación",
                emoji: "🌟"
            });
        if (totalPuntos >= 20)
            nuevas.push({
                id: 2,
                nombre: "Matemático Experto",
                descripcion: "¡Alcanzaste 20 puntos!",
                emoji: "🏆"
            });
        if (totalPuntos >= 50)
            nuevas.push({
                id: 3,
                nombre: "Maestro de Números",
                descripcion: "¡Dominaste todas las operaciones!",
                emoji: "👑"
            });
        setInsignias(nuevas);
    };

    const responder = async (respuestaUsuario) => {
        const pregunta = preguntas[preguntaActual];
        if (!pregunta) return;
        const user = getUser();
        const userId = user?.id;
        if (!userId) return;

        if (respuestaUsuario.trim() === pregunta.respuesta.trim()) {
            const nuevosPuntos = puntos + 10;
            setPuntos(nuevosPuntos);
            setMensaje("✅ ¡Correcto! +10 puntos");
            setRespuestaCorrecta(true);
            setAnimarPuntos(true);
            
            setTimeout(() => {
                setRespuestaCorrecta(false);
                setAnimarPuntos(false);
            }, 2000);

            const { actual, siguiente } = calcularNivel(nuevosPuntos);
            setNivel(actual);
            setSiguienteNivel(siguiente || { nombre: "No definido" });
            actualizarInsignias(nuevosPuntos);

            try {
                setLoading(true);
                await Config.AddPuntos(
                    userId,
                    10,
                    "Respuesta correcta en suma y resta"
                );
                await Config.CheckInsignias(userId);
            } catch (error) {
                console.error("Error al guardar los puntos:", error);
            } finally {
                setLoading(false);
            }

            // Avanzar a la siguiente pregunta solo si acertó
            setTimeout(() => {
                setRespuesta("");
                setPreguntaActual((prev) => prev + 1);
                setDragRespuesta("");
                setMensaje("");
            }, 2000);
        } else {
            setMensaje("❌ Incorrecto, intenta nuevamente.");
            setRespuestaIncorrecta(true);
            
            setTimeout(() => {
                setRespuestaIncorrecta(false);
                setMensaje("");
            }, 1500);
            
            // Solo limpiar la respuesta, NO avanzar de pregunta
            setDragRespuesta("");
        }
    };

    const fetchPuntosIniciales = async () => {
        try {
            const user = getUser();
            const userId = user?.id;
            if (!userId) return;

            const res = await Config.GetPuntosEstudiante(userId);
            const totalPuntos = res.data?.data?.puntos?.total || 0;
            
            // Asegurarse de que totalPuntos sea un número
            const puntosNumericos = parseInt(totalPuntos, 10) || 0;
            setPuntos(puntosNumericos);

            const { actual, siguiente } = calcularNivel(puntosNumericos);
            setNivel(actual);
            setSiguienteNivel(siguiente || { nombre: "No definido" });
            actualizarInsignias(puntosNumericos);
        } catch (error) {
            console.error("Error al obtener puntos iniciales:", error);
        }
    };

    useEffect(() => {
        fetchPuntosIniciales();
    }, []);

    const pregunta = preguntas[preguntaActual];
    const opcionesActuales = pregunta?.opciones || [];

    /* Drag & Drop Handlers */
    const handleDragStart = (e, valor) => {
        e.dataTransfer.setData("text/plain", valor);
        e.currentTarget.style.opacity = "0.5";
    };

    const handleDragEnd = (e) => {
        e.currentTarget.style.opacity = "1";
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const valor = e.dataTransfer.getData("text/plain");
        setDragRespuesta(valor);
        e.currentTarget.classList.remove("drop-zone-over");
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add("drop-zone-over");
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove("drop-zone-over");
    };

    return (
        <div className="juego-container">
            <div className="juego-content">
                {/* Header con título */}
                <div className="juego-header">
                    <h1 className="juego-title">
                        <span className="icon-pattern">➕➖</span> OE2: Suma y Resta
                    </h1>
                    <p className="juego-subtitle">
                        <strong>**Competencia:**</strong> Resuelve problemas de cantidad (Operaciones básicas). 
                        <strong> **Instrucción:**</strong> Arrastra el resultado correcto de la operación
                    </p>
                </div>

                {/* Cards de progreso en fila */}
                <div className="stats-grid">
                    <div className={`stat-card ${animarPuntos ? 'stat-card-pulse' : ''}`}>
                        <div className="stat-icon">⭐</div>
                        <div className="stat-label">Puntos</div>
                        <div className="stat-value">{puntos}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">📘</div>
                        <div className="stat-label">Nivel</div>
                        <div className="stat-value">{nivel?.nombre || "No definido"}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">⬆️</div>
                        <div className="stat-label">Siguiente Nivel</div>
                        <div className="stat-value">{siguienteNivel?.nombre || "No definido"}</div>
                    </div>
                </div>

                {/* Área principal del juego */}
                <div className={`game-area ${respuestaCorrecta ? 'game-area-correct' : ''} ${respuestaIncorrecta ? 'game-area-incorrect' : ''}`}>
                    {/* Pregunta */}
                    {pregunta && (
                        <div className="question-section">
                            <div className="operation-display">
                                <div className="operation-text pulse-animation">
                                    {pregunta.texto}
                                </div>
                            </div>

                            <div
                                className={`drop-zone ${dragRespuesta ? 'drop-zone-filled' : ''}`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                            >
                                {dragRespuesta || "🎯 Arrastra el resultado aquí"}
                            </div>

                            <div className="answer-options">
                                {opcionesActuales.map((num) => (
                                    <div
                                        key={num}
                                        className="answer-box"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, num)}
                                        onDragEnd={handleDragEnd}
                                    >
                                        {num}
                                    </div>
                                ))}
                            </div>

                            <button
                                className={`btn-submit ${!dragRespuesta || loading ? 'btn-submit-disabled' : ''}`}
                                onClick={() => responder(dragRespuesta)}
                                disabled={!dragRespuesta || loading}
                            >
                                {loading ? "⏳ Guardando..." : "🎮 Comprobar"}
                            </button>

                            {mensaje && (
                                <div className={`message-feedback ${respuestaCorrecta ? 'message-success' : 'message-error'}`}>
                                    {mensaje}
                                </div>
                            )}
                        </div>
                    )}

                    {!pregunta && (
                        <div className="completion-message">
                            <div className="completion-emoji">🎉</div>
                            <div className="completion-text">¡Has completado todas las operaciones!</div>
                            <div className="completion-score">Total de puntos: {puntos}</div>
                            <button 
                                className="btn-submit"
                                onClick={() => {
                                    const preguntasMezcladas = mezclarArray(preguntasBase);
                                    setPreguntas(preguntasMezcladas);
                                    setPreguntaActual(0);
                                    setDragRespuesta("");
                                    setMensaje("");
                                }}
                                style={{ marginTop: "1.5rem" }}
                            >
                                🔄 Jugar de Nuevo
                            </button>
                        </div>
                    )}
                </div>

                {/* Insignias */}
                <div className="badges-section">
                    <h2 className="badges-title">🏅 Tus Insignias Ganadas</h2>
                    {insignias.length > 0 ? (
                        <div className="badges-grid">
                            {insignias.map((i) => (
                                <div key={i.id} className="badge-card badge-unlock">
                                    <div className="badge-emoji">{i.emoji}</div>
                                    <h3 className="badge-name">{i.nombre}</h3>
                                    <p className="badge-description">{i.descripcion}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-badges">🎯 Comienza a jugar para desbloquear insignias</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JuegoSumaResta;