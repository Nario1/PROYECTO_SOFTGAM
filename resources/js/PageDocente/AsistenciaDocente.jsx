// AsistenciaDocente.jsx
import React, { useEffect, useState, useCallback } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";
import "../styles/docente.css";
import SidebarDocente from "./SidebarDocente"; // 🔹 Sidebar añadido

const AsistenciaDocente = () => {
    const { getUser } = AuthUser();
    const docente = getUser();
    const docenteId = docente?.id || 1;

    const [estudiantes, setEstudiantes] = useState([]);
    const [asistencia, setAsistencia] = useState({});
    const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [existingMap, setExistingMap] = useState({});

    const extractArrayFromResponse = (res) => {
        if (!res) return [];
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data?.data)) return res.data.data;
        if (Array.isArray(res.data?.asistencias)) return res.data.asistencias;
        if (Array.isArray(res)) return res;
        return [];
    };

    const fetchEstudiantes = useCallback(async () => {
        try {
            const res = await Config.GetEstudiantes();
            const list =
                res.data?.data || res.data || extractArrayFromResponse(res);
            setEstudiantes(Array.isArray(list) ? list : []);
            const init = {};
            (Array.isArray(list) ? list : []).forEach((est) => {
                init[est.id] = { estado: "presente", incidencias: "" };
            });
            setAsistencia(init);
        } catch (err) {
            console.error("Error al cargar estudiantes:", err);
            setEstudiantes([]);
        }
    }, []);

    const fetchAsistenciasForDate = useCallback(
        async (date, studentsList = null) => {
            try {
                const res = await Config.GetAsistencias();
                const all = extractArrayFromResponse(res);
                const forDate = all.filter((a) => a.fecha === date);

                const map = {};
                forDate.forEach((a) => {
                    map[a.estudiante_id] = a;
                });
                setExistingMap(map);

                const list = studentsList || estudiantes;
                if (!Array.isArray(list) || list.length === 0) return;

                const newAsistencia = {};
                list.forEach((est) => {
                    if (map[est.id]) {
                        newAsistencia[est.id] = {
                            estado: map[est.id].estado,
                            incidencias: map[est.id].incidencias || "",
                        };
                    } else {
                        newAsistencia[est.id] = {
                            estado: "presente",
                            incidencias: "",
                        };
                    }
                });
                setAsistencia(newAsistencia);
            } catch (err) {
                console.error("Error al cargar asistencias:", err);
            }
        },
        [estudiantes]
    );

    useEffect(() => {
        fetchEstudiantes();
    }, [fetchEstudiantes]);
    useEffect(() => {
        if (estudiantes.length) fetchAsistenciasForDate(fecha, estudiantes);
    }, [estudiantes, fecha, fetchAsistenciasForDate]);

    const handleFechaChange = (e) => {
        const newDate = e.target.value;
        setFecha(newDate);
        fetchAsistenciasForDate(newDate, estudiantes);
    };

    const handleEstadoChange = (id, estado) => {
        setAsistencia((prev) => ({ ...prev, [id]: { ...prev[id], estado } }));
    };

    const handleIncidenciaChange = (id, text) => {
        setAsistencia((prev) => ({
            ...prev,
            [id]: { ...prev[id], incidencias: text },
        }));
    };

    const handleGuardar = async () => {
        setLoading(true);
        setMensaje("");
        try {
            const promises = Object.keys(asistencia).map(async (estId) => {
                const registro = asistencia[estId];
                const existente = existingMap[estId];

                if (existente?.id) {
                    return Config.UpdateAsistencia(existente.id, {
                        estado: registro.estado,
                        incidencias: registro.incidencias,
                    });
                } else {
                    return Config.AddAsistencia({
                        estudiante_id: estId,
                        docente_id: docenteId,
                        fecha,
                        estado: registro.estado,
                        incidencias: registro.incidencias,
                    });
                }
            });

            await Promise.all(promises);
            await fetchAsistenciasForDate(fecha, estudiantes);
            setMensaje("✅ Asistencia guardada correctamente.");
        } catch (err) {
            console.error(err);
            setMensaje("❌ Ocurrió un error al guardar la asistencia.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container">
            <SidebarDocente /> {/* 🔹 Sidebar fijo añadido */}
            <div
                className="admin-content overflow-y-auto flex flex-col gap-6 p-6"
                style={{ maxHeight: "100vh" }}
            >
                <h1 className="text-3xl font-bold mb-4 text-center">
                    📋 Tomar Asistencia
                </h1>

                {/* Fecha */}
                <div className="mb-4 flex items-center gap-2">
                    <label className="font-semibold">Fecha:</label>
                    <input
                        type="date"
                        value={fecha}
                        onChange={handleFechaChange}
                        className="admin-input"
                    />
                </div>

                {/* Botón Guardar antes de la tabla */}
                <button
                    onClick={handleGuardar}
                    disabled={loading}
                    className={`mb-4 admin-btn w-full ${
                        loading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                >
                    {loading ? "Guardando..." : "Guardar Asistencia"}
                </button>

                {/* Tabla de estudiantes */}
                {estudiantes.length === 0 ? (
                    <p>Cargando estudiantes...</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        <div
                            className="overflow-y-auto border border-gray-600 rounded p-1"
                            style={{ maxHeight: "55vh", paddingBottom: "1rem" }}
                        >
                            <table className="w-full border-collapse border border-gray-300 text-white">
                                <thead>
                                    <tr className="bg-gray-800 sticky top-0 z-10">
                                        <th className="border border-gray-600 p-2">
                                            Estudiante
                                        </th>
                                        <th className="border border-gray-600 p-2 text-center">
                                            Presente
                                        </th>
                                        <th className="border border-gray-600 p-2 text-center">
                                            Ausente
                                        </th>
                                        <th className="border border-gray-600 p-2 text-center">
                                            Tarde
                                        </th>
                                        <th className="border border-gray-600 p-2">
                                            Incidencias
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {estudiantes.map((est) => (
                                        <tr
                                            key={est.id}
                                            className="hover:bg-gray-700"
                                        >
                                            <td className="border border-gray-600 p-2">
                                                {est.nombre}
                                            </td>
                                            {[
                                                "presente",
                                                "ausente",
                                                "tarde",
                                            ].map((estado) => (
                                                <td
                                                    key={estado}
                                                    className="border border-gray-600 p-2 text-center"
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`estado-${est.id}`}
                                                        checked={
                                                            asistencia[est.id]
                                                                ?.estado ===
                                                            estado
                                                        }
                                                        onChange={() =>
                                                            handleEstadoChange(
                                                                est.id,
                                                                estado
                                                            )
                                                        }
                                                    />
                                                </td>
                                            ))}
                                            <td className="border border-gray-600 p-2">
                                                <input
                                                    type="text"
                                                    value={
                                                        asistencia[est.id]
                                                            ?.incidencias || ""
                                                    }
                                                    onChange={(e) =>
                                                        handleIncidenciaChange(
                                                            est.id,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Incidencias..."
                                                    className="admin-input w-full"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {mensaje && (
                            <p className="mt-2 font-medium">{mensaje}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AsistenciaDocente;
