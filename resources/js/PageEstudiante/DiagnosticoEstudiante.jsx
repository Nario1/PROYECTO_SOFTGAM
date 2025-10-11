import React, { useEffect, useState, useRef } from "react";
import API from "../Config";
import SidebarEstudiante from "./SidebarEstudiante";
import "../styles/docente.css";

function DiagnosticoEstudiante() {
    const [pruebas, setPruebas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [examenAbierto, setExamenAbierto] = useState(false);
    const [preguntas, setPreguntas] = useState([]);
    const [selectedPrueba, setSelectedPrueba] = useState(null);
    const [respuestas, setRespuestas] = useState([]);
    const [timer, setTimer] = useState(300);
    const [resultado, setResultado] = useState(null);
    const timerRef = useRef(null);

    useEffect(() => {
        fetchPruebas();
    }, []);
    useEffect(() => {
        if (examenAbierto) startTimer();
        return () => clearInterval(timerRef.current);
    }, [examenAbierto]);
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (examenAbierto && !resultado) {
                e.preventDefault();
                e.returnValue =
                    "Estás en medio de un examen. ¿Seguro que quieres salir?";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [examenAbierto, resultado]);

    const fetchPruebas = async () => {
        try {
            const res = await API.getAllPruebasDiagnosticas();
            if (res.data.success) setPruebas(res.data.data);
        } catch (error) {
            console.error("Error al obtener pruebas:", error);
        } finally {
            setLoading(false);
        }
    };

    const abrirModal = async (prueba) => {
        try {
            const res = await API.GetPreguntas(prueba.id);
            if (res.data.success) {
                setPreguntas(res.data.data);
                setSelectedPrueba(prueba);
                setExamenAbierto(true);
                setRespuestas([]);
                setResultado(null);
                setTimer(300);
            } else alert(res.data.message);
        } catch (error) {
            console.error("Error al obtener preguntas:", error);
        }
    };

    const cerrarModal = () => {
        setExamenAbierto(false);
        setPreguntas([]);
        setSelectedPrueba(null);
        setRespuestas([]);
        setResultado(null);
        clearInterval(timerRef.current);
    };

    const handleChange = (preguntaId, value) => {
        setRespuestas((prev) => {
            const index = prev.findIndex((r) => r.pregunta_id === preguntaId);
            if (index > -1) {
                const newRes = [...prev];
                newRes[index].respuesta = value;
                return newRes;
            } else
                return [...prev, { pregunta_id: preguntaId, respuesta: value }];
        });
    };

    const enviarPrueba = async () => {
        clearInterval(timerRef.current);
        let correctas = 0;
        const feedback = preguntas.map((p) => {
            const r = respuestas.find((res) => res.pregunta_id === p.id);
            const acertada = r && r.respuesta === p.respuesta_correcta;
            if (acertada) correctas++;
            return {
                pregunta: p.texto,
                tuRespuesta: r ? r.respuesta : "No respondida",
                correcta: p.respuesta_correcta,
                correctaBool: acertada,
            };
        });
        setResultado({ correctas, total: preguntas.length, feedback });
        try {
            await API.EnviarRespuestas(selectedPrueba.id, {
                respuestas,
                categoria: "",
                puntaje: correctas,
            });
        } catch (error) {
            console.error("Error al enviar la prueba:", error);
        }
    };

    const startTimer = () => {
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    enviarPrueba();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const formatTime = (seconds) => {
        const m = String(Math.floor(seconds / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        return `${m}:${s}`;
    };

    if (loading) return <p className="text-white p-4">Cargando pruebas...</p>;
    if (!pruebas.length)
        return <p className="text-white p-4">No hay pruebas disponibles</p>;

    return (
        <div className="admin-container d-flex" style={{ minHeight: "100vh" }}>
            <SidebarEstudiante />

            <div
                className="admin-content flex-grow-1 p-6 overflow-y-auto"
                style={{ maxHeight: "100vh" }}
            >
                <h2 className="text-2xl font-bold text-white mb-4">
                    Pruebas Diagnósticas
                </h2>
                <ul className="space-y-3">
                    {pruebas.map((prueba) => (
                        <li
                            key={prueba.id}
                            className="admin-card flex justify-between items-center p-4 text-white"
                        >
                            <div>
                                <strong>{prueba.titulo}</strong> -{" "}
                                {prueba.descripcion}
                            </div>
                            <button
                                className="admin-btn"
                                onClick={() => abrirModal(prueba)}
                            >
                                Tomar prueba
                            </button>
                        </li>
                    ))}
                </ul>

                {examenAbierto && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-auto p-6 flex justify-center items-start">
                        <div
                            className="admin-card w-full max-w-4xl p-6 overflow-y-auto"
                            style={{ maxHeight: "85vh" }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">
                                    {selectedPrueba?.titulo}
                                </h2>
                                <button
                                    onClick={cerrarModal}
                                    className="text-red-500 font-bold text-xl"
                                >
                                    ✕
                                </button>
                            </div>

                            <p className="mb-4 font-semibold">
                                Tiempo restante:{" "}
                                <span>{formatTime(timer)}</span>
                            </p>

                            {resultado ? (
                                <div className="text-left">
                                    <h3 className="text-lg font-semibold mb-2">
                                        Resultado
                                    </h3>
                                    <p>
                                        Correctas: {resultado.correctas} de{" "}
                                        {resultado.total}
                                    </p>
                                    <div className="mt-4">
                                        {resultado.feedback.map((f, i) => (
                                            <div
                                                key={i}
                                                className={`p-2 border-b ${
                                                    f.correctaBool
                                                        ? "bg-green-700"
                                                        : "bg-red-700"
                                                }`}
                                            >
                                                <p>
                                                    <strong>Pregunta:</strong>{" "}
                                                    {f.pregunta}
                                                </p>
                                                <p>
                                                    <strong>
                                                        Tu respuesta:
                                                    </strong>{" "}
                                                    {f.tuRespuesta}
                                                </p>
                                                {!f.correctaBool && (
                                                    <p>
                                                        <strong>
                                                            Respuesta correcta:
                                                        </strong>{" "}
                                                        {f.correcta}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={cerrarModal}
                                        className="admin-btn mt-4 w-full"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {preguntas.map((p) => (
                                        <div
                                            key={p.id}
                                            className="border-b pb-3"
                                        >
                                            <p className="font-medium">
                                                {p.texto}
                                            </p>
                                            {p.opciones &&
                                                JSON.parse(p.opciones).map(
                                                    (op, i) => (
                                                        <label
                                                            key={i}
                                                            className="block mt-1"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`pregunta-${p.id}`}
                                                                value={op}
                                                                checked={
                                                                    respuestas.find(
                                                                        (r) =>
                                                                            r.pregunta_id ===
                                                                            p.id
                                                                    )
                                                                        ?.respuesta ===
                                                                    op
                                                                }
                                                                onChange={() =>
                                                                    handleChange(
                                                                        p.id,
                                                                        op
                                                                    )
                                                                }
                                                                className="mr-2"
                                                            />
                                                            {op}
                                                        </label>
                                                    )
                                                )}
                                        </div>
                                    ))}
                                    <button
                                        onClick={enviarPrueba}
                                        className="admin-btn w-full mt-4"
                                    >
                                        Terminar prueba
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DiagnosticoEstudiante;
