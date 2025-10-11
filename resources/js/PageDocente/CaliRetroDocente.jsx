// CaliRetroDocente.jsx
import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";
import "../styles/docente.css"; // Estilos oscuros ya definidos
import SidebarDocente from "./SidebarDocente"; // 🔹 Sidebar añadido

const CaliRetroDocente = () => {
    const { getUserId } = AuthUser();
    const docenteId = getUserId();

    const [actividades, setActividades] = useState([]);
    const [entregas, setEntregas] = useState([]);
    const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [mostrarEntregas, setMostrarEntregas] = useState(false);

    // Cargar actividades del docente
    useEffect(() => {
        (async function fetchActividades() {
            try {
                const res = await Config.GetActividadesDocente(docenteId);
                if (res.data.success) {
                    const acts = Array.isArray(res.data.data)
                        ? res.data.data
                        : res.data.data?.actividades || [];
                    setActividades(acts);
                } else {
                    setActividades([]);
                }
            } catch (err) {
                console.error(err);
                setMensaje({
                    tipo: "error",
                    texto: "Error al cargar actividades",
                });
                setActividades([]);
            }
        })();
    }, [docenteId]);

    // Mostrar entregas de una actividad
    const handleVerEntregas = async (actividad) => {
        try {
            const res = await Config.GetEntregasActividad(actividad.id);
            if (res.data.success) {
                const ents = Array.isArray(res.data.data)
                    ? res.data.data
                    : res.data.data?.entregas || [];
                setEntregas(ents);
                setActividadSeleccionada(actividad);
                setMostrarEntregas(true);
            } else {
                setEntregas([]);
            }
        } catch (err) {
            console.error(err);
            setMensaje({ tipo: "error", texto: "Error al obtener entregas" });
            setEntregas([]);
        }
    };

    // Guardar calificación y retroalimentación
    const handleGuardarRetro = async (ent) => {
        if (ent.calificacion === "" || ent.calificacion === null) {
            return setMensaje({
                tipo: "error",
                texto: "Ingresa una calificación",
            });
        }
        try {
            await Config.ActualizarRetroalimentacion(
                actividadSeleccionada.id,
                ent.estudiante_id,
                {
                    calificacion: ent.calificacion,
                    retroalimentacion: ent.retroalimentacion || "",
                }
            );
            setMensaje({
                tipo: "success",
                texto: "Retroalimentación guardada correctamente",
            });

            setEntregas((prev) =>
                prev.map((e) => (e.id === ent.id ? { ...e, ...ent } : e))
            );

            setTimeout(() => setMensaje(null), 3000);
        } catch (err) {
            console.error(err);
            setMensaje({
                tipo: "error",
                texto: "Error al guardar retroalimentación",
            });
        }
    };

    // Manejar cambios en calificación o retroalimentación
    const handleChange = (e, entregaId) => {
        const { name, value } = e.target;
        setEntregas((prev) =>
            prev.map((ent) =>
                ent.id === entregaId ? { ...ent, [name]: value } : ent
            )
        );
    };

    return (
        <div className="admin-container flex">
            {/* 🔹 Sidebar fijo */}
            <SidebarDocente />

            {/* 🔹 Contenido principal */}
            <div
                className="admin-content flex flex-col gap-6 p-6 overflow-y-auto w-full"
                style={{ maxHeight: "100vh" }}
            >
                <h2 className="text-3xl font-bold text-center mb-6 text-white">
                    Calificación y Retroalimentación
                </h2>

                {mensaje && (
                    <p
                        className={
                            mensaje.tipo === "error"
                                ? "text-danger font-bold"
                                : "text-success font-bold"
                        }
                    >
                        {mensaje.texto}
                    </p>
                )}

                {/* Tabla Actividades */}
                <div className="admin-card overflow-auto max-h-[40vh]">
                    <table className="min-w-full bg-black text-white">
                        <thead className="bg-gray-900 sticky top-0">
                            <tr>
                                <th className="py-3 px-6 border border-gray-700">
                                    Título
                                </th>
                                <th className="py-3 px-6 border border-gray-700">
                                    Temática
                                </th>
                                <th className="py-3 px-6 border border-gray-700">
                                    Fecha límite
                                </th>
                                <th className="py-3 px-6 border border-gray-700">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {actividades.length > 0 ? (
                                actividades.map((act) => (
                                    <tr
                                        key={`act-${act.id}`}
                                        className="hover:bg-gray-800"
                                    >
                                        <td className="py-2 px-4 border border-gray-600">
                                            {act.titulo}
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            {act.tematica_nombre || "-"}
                                        </td>
                                        <td
                                            className={`py-2 px-4 border border-gray-600 ${
                                                new Date(act.fecha_limite) <
                                                new Date()
                                                    ? "text-danger"
                                                    : "text-white"
                                            }`}
                                        >
                                            {act.fecha_limite || "-"}
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            <button
                                                className="admin-btn"
                                                onClick={() =>
                                                    handleVerEntregas(act)
                                                }
                                            >
                                                Ver Entregas
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="text-center py-4"
                                    >
                                        No hay actividades disponibles
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Tabla Entregas */}
                {mostrarEntregas && (
                    <div className="admin-card overflow-auto max-h-[50vh] mt-4">
                        <h3 className="text-xl font-bold text-white mb-4">
                            Entregas de: {actividadSeleccionada?.titulo}
                        </h3>
                        <table className="min-w-full bg-black text-white">
                            <thead className="bg-gray-900 sticky top-0">
                                <tr>
                                    <th className="py-3 px-6 border border-gray-700">
                                        Estudiante
                                    </th>
                                    <th className="py-3 px-6 border border-gray-700">
                                        Texto de entrega
                                    </th>
                                    <th className="py-3 px-6 border border-gray-700">
                                        Archivo
                                    </th>
                                    <th className="py-3 px-6 border border-gray-700">
                                        Fecha de entrega
                                    </th>
                                    <th className="py-3 px-6 border border-gray-700">
                                        Calificación
                                    </th>
                                    <th className="py-3 px-6 border border-gray-700">
                                        Retroalimentación
                                    </th>
                                    <th className="py-3 px-6 border border-gray-700">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {entregas.length > 0 ? (
                                    entregas.map((ent) => (
                                        <tr
                                            key={`ent-${ent.id}`}
                                            className="hover:bg-gray-800"
                                        >
                                            <td className="py-2 px-4 border border-gray-600">
                                                {ent.estudiante_nombre}
                                            </td>
                                            <td className="py-2 px-4 border border-gray-600">
                                                {ent.texto_entrega || "-"}
                                            </td>
                                            <td className="py-2 px-4 border border-gray-600">
                                                {ent.archivo_entrega ? (
                                                    <a
                                                        href={`/storage/${ent.archivo_entrega}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:underline"
                                                    >
                                                        Descargar
                                                    </a>
                                                ) : (
                                                    "-"
                                                )}
                                            </td>
                                            <td className="py-2 px-4 border border-gray-600">
                                                {ent.fecha_entrega || "-"}
                                            </td>
                                            <td className="py-2 px-4 border border-gray-600">
                                                <input
                                                    type="number"
                                                    name="calificacion"
                                                    value={
                                                        ent.calificacion || ""
                                                    }
                                                    onChange={(e) =>
                                                        handleChange(e, ent.id)
                                                    }
                                                    className="admin-input bg-gray-700 text-white"
                                                />
                                            </td>
                                            <td className="py-2 px-4 border border-gray-600">
                                                <textarea
                                                    name="retroalimentacion"
                                                    value={
                                                        ent.retroalimentacion ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleChange(e, ent.id)
                                                    }
                                                    className="admin-input bg-gray-700 text-white"
                                                />
                                            </td>
                                            <td className="py-2 px-4 border border-gray-600">
                                                <button
                                                    className="admin-btn"
                                                    onClick={() =>
                                                        handleGuardarRetro(ent)
                                                    }
                                                >
                                                    Guardar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="text-center py-4"
                                        >
                                            No hay entregas todavía
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaliRetroDocente;
