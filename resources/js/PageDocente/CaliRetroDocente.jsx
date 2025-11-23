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

                // 🔹 Asegurar que cada entrega tenga un ID único
                const entregasConIdUnico = ents.map((ent, index) => ({
                    ...ent,
                    uniqueId:
                        ent.id ||
                        `ent-${ent.estudiante_id}-${actividad.id}-${index}`,
                }));

                setEntregas(entregasConIdUnico);
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

        // Validar que la calificación sea un número válido
        const calificacionNum = parseFloat(ent.calificacion);
        if (
            isNaN(calificacionNum) ||
            calificacionNum < 0 ||
            calificacionNum > 100
        ) {
            return setMensaje({
                tipo: "error",
                texto: "La calificación debe ser un número entre 0 y 100",
            });
        }

        try {
            await Config.ActualizarRetroalimentacion(
                actividadSeleccionada.id,
                ent.estudiante_id,
                {
                    calificacion: calificacionNum,
                    retroalimentacion: ent.retroalimentacion || "",
                }
            );
            setMensaje({
                tipo: "success",
                texto: `Retroalimentación guardada para ${ent.estudiante_nombre}`,
            });

            // 🔹 CORRECCIÓN: Actualizar solo la entrega específica usando uniqueId
            setEntregas((prev) =>
                prev.map((e) =>
                    e.uniqueId === ent.uniqueId ? { ...e, ...ent } : e
                )
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
    const handleChange = (e, uniqueId) => {
        const { name, value } = e.target;
        setEntregas((prev) =>
            prev.map((ent) =>
                ent.uniqueId === uniqueId ? { ...ent, [name]: value } : ent
            )
        );
    };

    // Volver a la lista de actividades
    const handleVolverActividades = () => {
        setMostrarEntregas(false);
        setActividadSeleccionada(null);
        setEntregas([]);
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
                                ? "text-danger font-bold p-3 bg-red-900 rounded"
                                : "text-success font-bold p-3 bg-green-900 rounded"
                        }
                    >
                        {mensaje.texto}
                    </p>
                )}

                {/* Tabla Actividades - Solo mostrar cuando no se ven entregas */}
                {!mostrarEntregas && (
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
                )}

                {/* Tabla Entregas */}
                {mostrarEntregas && (
                    <div className="admin-card overflow-auto max-h-[70vh] mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">
                                Entregas de: {actividadSeleccionada?.titulo}
                            </h3>
                            <button
                                className="admin-btn bg-gray-600 hover:bg-gray-700"
                                onClick={handleVolverActividades}
                            >
                                ← Volver a Actividades
                            </button>
                        </div>

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
                                            // 🔹 CORRECCIÓN: Usar uniqueId como key único
                                            key={ent.uniqueId}
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
                                                    // 🔹 CORRECCIÓN: Usar uniqueId para identificar cada entrega
                                                    onChange={(e) =>
                                                        handleChange(
                                                            e,
                                                            ent.uniqueId
                                                        )
                                                    }
                                                    className="admin-input bg-gray-700 text-white w-20"
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    placeholder="0-100"
                                                />
                                            </td>
                                            <td className="py-2 px-4 border border-gray-600">
                                                <textarea
                                                    name="retroalimentacion"
                                                    value={
                                                        ent.retroalimentacion ||
                                                        ""
                                                    }
                                                    // 🔹 CORRECCIÓN: Usar uniqueId para identificar cada entrega
                                                    onChange={(e) =>
                                                        handleChange(
                                                            e,
                                                            ent.uniqueId
                                                        )
                                                    }
                                                    className="admin-input bg-gray-700 text-white w-48"
                                                    rows="3"
                                                    placeholder="Escribe la retroalimentación individual aquí..."
                                                />
                                            </td>
                                            <td className="py-2 px-4 border border-gray-600">
                                                <button
                                                    className="admin-btn bg-green-600 hover:bg-green-700"
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
                                            No hay entregas para esta actividad
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <div className="mt-4 p-3 bg-blue-900 rounded">
                            <p className="text-white text-sm">
                                💡 <strong>Nota:</strong> Cada estudiante puede
                                tener su propia calificación y retroalimentación
                                individual. Los cambios se guardan de forma
                                independiente para cada entrega.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaliRetroDocente;
