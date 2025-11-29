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
    // Patrones de suma constante (+2)
    { id: 1, texto: "2, 4, 6, ?", respuesta: "8", opciones: ["5", "7", "8", "9", "10", "12"] },
    { id: 2, texto: "10, 12, 14, ?", respuesta: "16", opciones: ["15", "16", "17", "18", "19", "20"] },
    { id: 3, texto: "20, 22, 24, ?", respuesta: "26", opciones: ["25", "26", "27", "28", "29", "30"] },
    
    // Patrones de suma constante (+3)
    { id: 4, texto: "3, 6, 9, ?", respuesta: "12", opciones: ["10", "11", "12", "13", "14", "15"] },
    { id: 5, texto: "15, 18, 21, ?", respuesta: "24", opciones: ["22", "23", "24", "25", "26", "27"] },
    
    // Patrones de suma constante (+5)
    { id: 6, texto: "5, 10, 15, ?", respuesta: "20", opciones: ["17", "18", "19", "20", "21", "22"] },
    { id: 7, texto: "25, 30, 35, ?", respuesta: "40", opciones: ["37", "38", "39", "40", "41", "42"] },
    
    // Patrones de suma constante (+10)
    { id: 8, texto: "10, 20, 30, ?", respuesta: "40", opciones: ["35", "38", "40", "42", "45", "50"] },
    { id: 9, texto: "50, 60, 70, ?", respuesta: "80", opciones: ["75", "78", "80", "82", "85", "90"] },
    
    // Números impares
    { id: 10, texto: "1, 3, 5, ?", respuesta: "7", opciones: ["6", "7", "8", "9", "10", "11"] },
    { id: 11, texto: "11, 13, 15, ?", respuesta: "17", opciones: ["16", "17", "18", "19", "20", "21"] },
    
    // Cuadrados perfectos
    { id: 12, texto: "1, 4, 9, ?", respuesta: "16", opciones: ["12", "14", "15", "16", "18", "20"] },
    { id: 13, texto: "4, 9, 16, ?", respuesta: "25", opciones: ["20", "22", "24", "25", "27", "30"] },
    
    // Potencias de 2
    { id: 14, texto: "2, 4, 8, ?", respuesta: "16", opciones: ["10", "12", "14", "16", "18", "20"] },
    { id: 15, texto: "4, 8, 16, ?", respuesta: "32", opciones: ["24", "28", "30", "32", "34", "36"] },
    
    // Potencias de 3
    { id: 16, texto: "3, 9, 27, ?", respuesta: "81", opciones: ["54", "63", "72", "81", "90", "99"] },
    
    // Suma creciente (+1, +2, +3...)
    { id: 17, texto: "1, 2, 4, 7, ?", respuesta: "11", opciones: ["9", "10", "11", "12", "13", "14"] },
    { id: 18, texto: "2, 3, 5, 8, ?", respuesta: "12", opciones: ["10", "11", "12", "13", "14", "15"] },
    
    // Multiplicación por 2
    { id: 19, texto: "3, 6, 12, ?", respuesta: "24", opciones: ["18", "20", "22", "24", "26", "28"] },
    { id: 20, texto: "5, 10, 20, ?", respuesta: "40", opciones: ["30", "35", "40", "45", "50", "55"] },
    
    // Suma constante (+4)
    { id: 21, texto: "4, 8, 12, ?", respuesta: "16", opciones: ["14", "15", "16", "17", "18", "20"] },
    { id: 22, texto: "16, 20, 24, ?", respuesta: "28", opciones: ["26", "27", "28", "29", "30", "32"] },
    
    // Números pares
    { id: 23, texto: "2, 6, 10, ?", respuesta: "14", opciones: ["12", "13", "14", "15", "16", "18"] },
    { id: 24, texto: "8, 12, 16, ?", respuesta: "20", opciones: ["18", "19", "20", "21", "22", "24"] },
    
    // Suma constante (+7)
    { id: 25, texto: "7, 14, 21, ?", respuesta: "28", opciones: ["25", "26", "27", "28", "29", "30"] },
    
    // Fibonacci básico
    { id: 26, texto: "1, 1, 2, 3, ?", respuesta: "5", opciones: ["4", "5", "6", "7", "8", "9"] },
    { id: 27, texto: "2, 3, 5, 8, ?", respuesta: "13", opciones: ["10", "11", "12", "13", "14", "15"] },
    
    // Resta constante
    { id: 28, texto: "20, 18, 16, ?", respuesta: "14", opciones: ["12", "13", "14", "15", "16", "17"] },
    { id: 29, texto: "50, 45, 40, ?", respuesta: "35", opciones: ["32", "33", "34", "35", "36", "37"] },
    
    // Multiplicación por 3
    { id: 30, texto: "2, 6, 18, ?", respuesta: "54", opciones: ["36", "45", "48", "54", "60", "72"] },
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
                nombre: "Insignia Novato",
                descripcion: "Otorgada por completar la primera jugada",
                emoji: "🌟"
            });
        if (totalPuntos >= 20)
            nuevas.push({
                id: 2,
                nombre: "Insignia Experto",
                descripcion: "Otorgada por alcanzar 20 puntos",
                emoji: "🏆"
            });
        if (totalPuntos >= 50)
            nuevas.push({
                id: 3,
                nombre: "Insignia Maestro",
                descripcion: "Otorgada por completar todos los niveles",
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
                    "Respuesta correcta en el juego de patrones"
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
                        <span className="icon-pattern">✏️</span> OE1: Patrones Numéricos
                    </h1>
                    <p className="juego-subtitle">
                        <strong>**Competencia:**</strong> Resuelve problemas de regularidad, equivalencia y cambio (Series y Patrones). 
                        <strong> **Instrucción:**</strong> Arrastra el número que falta en la serie
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
                            <div className="pattern-boxes">
                                {pregunta.texto.split(', ').map((num, index) => (
                                    <div 
                                        key={index} 
                                        className={`pattern-box ${num === '?' ? 'mystery-box pulse-animation' : ''}`}
                                    >
                                        {num}
                                    </div>
                                ))}
                            </div>

                            <div
                                className={`drop-zone ${dragRespuesta ? 'drop-zone-filled' : ''}`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                            >
                                {dragRespuesta || "🎯 Arrastra el número aquí"}
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
                            <div className="completion-text">¡Has completado todas las preguntas!</div>
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

export default JuegoPatrones;