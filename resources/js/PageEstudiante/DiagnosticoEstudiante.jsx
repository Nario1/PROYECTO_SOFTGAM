import React, { useEffect, useState, useRef } from "react";
import API from "../Config";

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
            } else {
                alert(res.data.message);
            }
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
            } else {
                return [...prev, { pregunta_id: preguntaId, respuesta: value }];
            }
        });
    };

    const enviarPrueba = async () => {
        clearInterval(timerRef.current);

        let correctas = 0;

        // Generar feedback
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

        // Enviar al backend
        try {
            await API.EnviarRespuestas(selectedPrueba.id, {
                respuestas: respuestas,
                categoria: "",
                puntaje: correctas,
            });
            console.log("Respuestas guardadas correctamente");
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

    if (loading) return <p>Cargando pruebas...</p>;
    if (!pruebas.length) return <p>No hay pruebas disponibles</p>;

    if (examenAbierto) {
        return (
            <div className="fixed inset-0 bg-gray-100 z-50 overflow-auto min-h-screen p-6">
                <div className="max-w-4xl mx-auto bg-white p-6 shadow-lg rounded-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">
                            {selectedPrueba?.titulo}
                        </h2>
                        <button
                            onClick={cerrarModal}
                            className="text-gray-500 hover:text-red-500 font-bold text-xl"
                        >
                            ✕
                        </button>
                    </div>

                    <p className="mb-4 font-semibold">
                        Tiempo restante: <span>{formatTime(timer)}</span>
                    </p>

                    {resultado ? (
                        <div className="text-center">
                            <h3 className="text-lg font-semibold mb-2">
                                Resultado
                            </h3>
                            <p>
                                Correctas: {resultado.correctas} de{" "}
                                {resultado.total}
                            </p>

                            <div className="mt-4 text-left">
                                <h4 className="font-semibold mb-2">
                                    Feedback:
                                </h4>
                                {resultado.feedback.map((f, i) => (
                                    <div
                                        key={i}
                                        className={`p-2 border-b ${
                                            f.correctaBool
                                                ? "bg-green-100"
                                                : "bg-red-100"
                                        }`}
                                    >
                                        <p>
                                            <strong>Pregunta:</strong>{" "}
                                            {f.pregunta}
                                        </p>
                                        <p>
                                            <strong>Tu respuesta:</strong>{" "}
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
                                className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            >
                                Cerrar
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {preguntas.map((p) => (
                                <div key={p.id} className="border-b pb-3">
                                    <p className="font-medium">{p.texto}</p>
                                    {p.opciones &&
                                        JSON.parse(p.opciones).map((op, i) => (
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
                                                        )?.respuesta === op
                                                    }
                                                    onChange={() =>
                                                        handleChange(p.id, op)
                                                    }
                                                    className="mr-2"
                                                />
                                                {op}
                                            </label>
                                        ))}
                                </div>
                            ))}
                            <button
                                onClick={enviarPrueba}
                                className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Terminar prueba
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1>Pruebas Diagnósticas</h1>
            <ul>
                {pruebas.map((prueba) => (
                    <li key={prueba.id} style={{ marginBottom: "10px" }}>
                        <strong>{prueba.titulo}</strong> - {prueba.descripcion}{" "}
                        <button onClick={() => abrirModal(prueba)}>
                            Tomar prueba
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default DiagnosticoEstudiante;
