import React, { useEffect, useState } from "react";
import API from "../Config";

function DiagnosticoDocente() {
    const [pruebas, setPruebas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrueba, setSelectedPrueba] = useState(null);
    const [preguntas, setPreguntas] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [mostrarFormularioPrueba, setMostrarFormularioPrueba] =
        useState(false);

    const [nuevaPregunta, setNuevaPregunta] = useState({
        texto: "",
        opcionesArray: [""],
        respuesta_correcta: "",
    });

    const [errores, setErrores] = useState({});
    const [nuevaPrueba, setNuevaPrueba] = useState({
        titulo: "",
        descripcion: "",
    });

    useEffect(() => {
        fetchPruebas();
    }, []);

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
        setSelectedPrueba(prueba);
        setModalOpen(true);
        try {
            const res = await API.GetPreguntas(prueba.id);
            if (res.data.success) setPreguntas(res.data.data);
        } catch (error) {
            console.error("Error al obtener preguntas:", error);
        }
    };

    const cerrarModal = () => {
        setModalOpen(false);
        setPreguntas([]);
        setSelectedPrueba(null);
        setNuevaPregunta({
            texto: "",
            opcionesArray: [""],
            respuesta_correcta: "",
        });
        setErrores({});
    };

    const validarPregunta = () => {
        let erroresTemp = {};
        if (!nuevaPregunta.texto.trim())
            erroresTemp.texto = "El texto de la pregunta es obligatorio";
        if (nuevaPregunta.opcionesArray.some((op) => !op.trim()))
            erroresTemp.opciones = "Todas las opciones deben estar completas";
        if (!nuevaPregunta.respuesta_correcta.trim())
            erroresTemp.respuesta_correcta =
                "Debes indicar la respuesta correcta";
        setErrores(erroresTemp);
        return Object.keys(erroresTemp).length === 0;
    };

    const agregarPregunta = async () => {
        if (!validarPregunta()) return;

        try {
            const payload = {
                ...nuevaPregunta,
                opciones: JSON.stringify(nuevaPregunta.opcionesArray),
            };
            const res = await API.AddPregunta(selectedPrueba.id, payload);
            if (res.data.success) {
                setPreguntas([...preguntas, res.data.data]);
                setNuevaPregunta({
                    texto: "",
                    opcionesArray: [""],
                    respuesta_correcta: "",
                });
                setErrores({});
            }
        } catch (error) {
            console.error("Error al agregar pregunta:", error);
        }
    };

    const eliminarPregunta = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta pregunta?"))
            return;
        try {
            await API.DeletePregunta(id);
            setPreguntas(preguntas.filter((p) => p.id !== id));
        } catch (error) {
            console.error("Error al eliminar pregunta:", error);
        }
    };

    const eliminarPrueba = async (id) => {
        if (!window.confirm("⚠️ ¿Seguro que deseas eliminar esta prueba?"))
            return;
        try {
            const res = await API.DeletePruebaDiagnostica(id);
            if (res.data.success) {
                setPruebas(pruebas.filter((p) => p.id !== id));
                if (selectedPrueba?.id === id) cerrarModal();
            }
        } catch (error) {
            console.error("Error al eliminar prueba:", error);
        }
    };

    const crearPrueba = async () => {
        if (!nuevaPrueba.titulo.trim())
            return alert("⚠️ El título es obligatorio");
        if (!nuevaPrueba.descripcion.trim())
            return alert("⚠️ La descripción es obligatoria");

        try {
            const res = await API.AddPruebaDiagnostica(nuevaPrueba);
            if (res.data.success) {
                setPruebas([...pruebas, res.data.data]);
                setNuevaPrueba({ titulo: "", descripcion: "" });
                setMostrarFormularioPrueba(false);
            }
        } catch (error) {
            console.error("Error al crear prueba:", error);
        }
    };

    if (loading) return <p className="text-center mt-10">Cargando...</p>;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
                📋 Gestión de Pruebas Diagnósticas
            </h1>

            {(pruebas.length === 0 || mostrarFormularioPrueba) && (
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4 text-gray-800">
                        {pruebas.length === 0
                            ? "Crea tu primera prueba:"
                            : "Nueva prueba diagnóstica:"}
                    </h2>
                    <input
                        type="text"
                        placeholder="Título de la prueba"
                        value={nuevaPrueba.titulo}
                        onChange={(e) =>
                            setNuevaPrueba({
                                ...nuevaPrueba,
                                titulo: e.target.value,
                            })
                        }
                        className="w-full p-3 border rounded mb-3 focus:ring-2 focus:ring-black"
                    />
                    <textarea
                        placeholder="Descripción de la prueba"
                        value={nuevaPrueba.descripcion}
                        onChange={(e) =>
                            setNuevaPrueba({
                                ...nuevaPrueba,
                                descripcion: e.target.value,
                            })
                        }
                        className="w-full p-3 border rounded mb-3 focus:ring-2 focus:ring-black"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setMostrarFormularioPrueba(false)}
                            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={crearPrueba}
                            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition font-semibold"
                        >
                            Guardar Prueba
                        </button>
                    </div>
                </div>
            )}

            {pruebas.length > 0 && !mostrarFormularioPrueba && (
                <div className="text-right mb-4">
                    <button
                        onClick={() => setMostrarFormularioPrueba(true)}
                        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition font-semibold"
                    >
                        ➕ Crear nueva prueba
                    </button>
                </div>
            )}

            <div className="space-y-4">
                {pruebas.map((prueba) => (
                    <div
                        key={prueba.id}
                        className="bg-white shadow rounded-lg p-5 hover:shadow-md transition"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    {prueba.titulo}
                                </h2>
                                <p className="text-gray-600 mt-1 text-sm">
                                    {prueba.descripcion}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => abrirModal(prueba)}
                                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
                                >
                                    Gestionar
                                </button>
                                <button
                                    onClick={() => eliminarPrueba(prueba.id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-16 z-50 overflow-auto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                Preguntas - {selectedPrueba?.titulo}
                            </h2>
                            <button
                                onClick={cerrarModal}
                                className="text-gray-500 hover:text-red-500 font-bold text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 mb-6">
                            {preguntas.length > 0 ? (
                                preguntas.map((p) => (
                                    <div
                                        key={p.id}
                                        className="p-4 border rounded hover:shadow-sm flex justify-between items-center transition"
                                    >
                                        <span className="text-gray-700">
                                            {p.texto}
                                        </span>
                                        <button
                                            onClick={() =>
                                                eliminarPregunta(p.id)
                                            }
                                            className="px-3 py-1 bg-black text-white rounded hover:bg-gray-800 transition text-sm"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic">
                                    No hay preguntas registradas.
                                </p>
                            )}
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-gray-700 font-semibold text-lg">
                                Agregar nueva pregunta
                            </h3>

                            <div className="flex flex-col">
                                <label className="text-gray-600 mb-1">
                                    Texto de la pregunta
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: ¿Cuál es la capital de Perú?"
                                    value={nuevaPregunta.texto}
                                    onChange={(e) =>
                                        setNuevaPregunta({
                                            ...nuevaPregunta,
                                            texto: e.target.value,
                                        })
                                    }
                                    className="p-3 border rounded focus:ring-2 focus:ring-black"
                                />
                                {errores.texto && (
                                    <p className="text-red-600 text-sm">
                                        {errores.texto}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col space-y-2">
                                <label className="text-gray-600 mb-1">
                                    Opciones
                                </label>
                                {nuevaPregunta.opcionesArray.map(
                                    (opcion, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center space-x-2"
                                        >
                                            <input
                                                type="text"
                                                placeholder={`Opción ${
                                                    idx + 1
                                                }`}
                                                value={opcion}
                                                onChange={(e) => {
                                                    const newOpciones = [
                                                        ...nuevaPregunta.opcionesArray,
                                                    ];
                                                    newOpciones[idx] =
                                                        e.target.value;
                                                    setNuevaPregunta({
                                                        ...nuevaPregunta,
                                                        opcionesArray:
                                                            newOpciones,
                                                    });
                                                }}
                                                className="flex-1 p-2 border rounded focus:ring-2 focus:ring-black"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newOpciones =
                                                        nuevaPregunta.opcionesArray.filter(
                                                            (_, i) => i !== idx
                                                        );
                                                    setNuevaPregunta({
                                                        ...nuevaPregunta,
                                                        opcionesArray:
                                                            newOpciones,
                                                    });
                                                }}
                                                className="px-2 py-1 bg-black text-white rounded hover:bg-gray-800 transition"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )
                                )}
                                {errores.opciones && (
                                    <p className="text-red-600 text-sm">
                                        {errores.opciones}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setNuevaPregunta({
                                            ...nuevaPregunta,
                                            opcionesArray: [
                                                ...nuevaPregunta.opcionesArray,
                                                "",
                                            ],
                                        })
                                    }
                                    className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                                >
                                    Agregar opción
                                </button>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-gray-600 mb-1">
                                    Respuesta correcta
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej: Lima"
                                    value={nuevaPregunta.respuesta_correcta}
                                    onChange={(e) =>
                                        setNuevaPregunta({
                                            ...nuevaPregunta,
                                            respuesta_correcta: e.target.value,
                                        })
                                    }
                                    className="p-3 border rounded focus:ring-2 focus:ring-black"
                                />
                                {errores.respuesta_correcta && (
                                    <p className="text-red-600 text-sm">
                                        {errores.respuesta_correcta}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={agregarPregunta}
                                className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition font-semibold"
                            >
                                Guardar Pregunta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DiagnosticoDocente;
