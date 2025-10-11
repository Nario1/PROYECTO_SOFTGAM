import React, { useEffect, useState } from "react";
import API from "../Config";
import SidebarDocente from "./SidebarDocente"; // 🔹 Sidebar añadido
import "../styles/docente.css";

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
        <div className="admin-container d-flex" style={{ minHeight: "100vh" }}>
            {/* 🔹 Sidebar fijo */}
            <SidebarDocente />

            {/* 🔹 Contenido principal */}
            <div
                className="admin-content overflow-y-auto flex flex-col gap-6 p-6"
                style={{ maxHeight: "100vh", flexGrow: 1 }}
            >
                <h1 className="text-3xl font-bold mb-6 text-center">
                    📋 Gestión de Pruebas Diagnósticas
                </h1>

                {/* Formulario Nueva Prueba */}
                {(pruebas.length === 0 || mostrarFormularioPrueba) && (
                    <div className="admin-card flex flex-col gap-4">
                        <h2 className="text-xl font-bold">
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
                            className="admin-input"
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
                            className="admin-textarea"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() =>
                                    setMostrarFormularioPrueba(false)
                                }
                                className="admin-btn"
                            >
                                Cancelar
                            </button>
                            <button onClick={crearPrueba} className="admin-btn">
                                Guardar Prueba
                            </button>
                        </div>
                    </div>
                )}

                {/* Botón Crear Nueva Prueba */}
                {pruebas.length > 0 && !mostrarFormularioPrueba && (
                    <div className="text-right">
                        <button
                            onClick={() => setMostrarFormularioPrueba(true)}
                            className="admin-btn"
                        >
                            ➕ Crear nueva prueba
                        </button>
                    </div>
                )}

                {/* Lista de Pruebas */}
                <div className="flex flex-col gap-4">
                    {pruebas.map((prueba) => (
                        <div
                            key={prueba.id}
                            className="admin-card flex flex-col gap-2"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {prueba.titulo}
                                    </h2>
                                    <p className="text-gray-300 mt-1 text-sm">
                                        {prueba.descripcion}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => abrirModal(prueba)}
                                        className="admin-btn"
                                    >
                                        Gestionar
                                    </button>
                                    <button
                                        onClick={() =>
                                            eliminarPrueba(prueba.id)
                                        }
                                        className="admin-btn admin-btn-danger"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal de preguntas */}
                {modalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-16 z-50 overflow-auto">
                        <div className="admin-card w-full max-w-3xl p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">
                                    Preguntas - {selectedPrueba?.titulo}
                                </h2>
                                <button
                                    onClick={cerrarModal}
                                    className="text-gray-500 hover:text-red-500 font-bold text-xl"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
                                {preguntas.length > 0 ? (
                                    preguntas.map((p) => (
                                        <div
                                            key={p.id}
                                            className="p-4 border rounded hover:shadow-sm flex justify-between items-center transition"
                                        >
                                            <span>{p.texto}</span>
                                            <button
                                                onClick={() =>
                                                    eliminarPregunta(p.id)
                                                }
                                                className="admin-btn admin-btn-danger text-sm"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 italic">
                                        No hay preguntas registradas.
                                    </p>
                                )}
                            </div>

                            {/* Nueva pregunta */}
                            <div className="flex flex-col gap-4 border-t pt-4">
                                <h3 className="text-gray-200 font-semibold text-lg">
                                    Agregar nueva pregunta
                                </h3>

                                <div className="flex flex-col gap-2">
                                    <label className="text-gray-400">
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
                                        className="admin-input"
                                    />
                                    {errores.texto && (
                                        <p className="text-danger text-sm">
                                            {errores.texto}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-gray-400">
                                        Opciones
                                    </label>
                                    {nuevaPregunta.opcionesArray.map(
                                        (opcion, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-2"
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
                                                    className="admin-input flex-1"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newOpciones =
                                                            nuevaPregunta.opcionesArray.filter(
                                                                (_, i) =>
                                                                    i !== idx
                                                            );
                                                        setNuevaPregunta({
                                                            ...nuevaPregunta,
                                                            opcionesArray:
                                                                newOpciones,
                                                        });
                                                    }}
                                                    className="admin-btn admin-btn-danger px-2 py-1"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )
                                    )}
                                    {errores.opciones && (
                                        <p className="text-danger text-sm">
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
                                        className="admin-btn w-full"
                                    >
                                        Agregar opción
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-gray-400">
                                        Respuesta correcta
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Lima"
                                        value={nuevaPregunta.respuesta_correcta}
                                        onChange={(e) =>
                                            setNuevaPregunta({
                                                ...nuevaPregunta,
                                                respuesta_correcta:
                                                    e.target.value,
                                            })
                                        }
                                        className="admin-input"
                                    />
                                    {errores.respuesta_correcta && (
                                        <p className="text-danger text-sm">
                                            {errores.respuesta_correcta}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={agregarPregunta}
                                    className="admin-btn w-full"
                                >
                                    Guardar Pregunta
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DiagnosticoDocente;
