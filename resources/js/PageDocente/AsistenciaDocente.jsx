// AsistenciaDocente.jsx
import React, { useEffect, useState, useCallback } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";

const AsistenciaDocente = () => {
    const { getUser } = AuthUser();
    const docente = getUser();
    const docenteId = docente?.id || 1; // fallback 1 si no está logueado

    const [estudiantes, setEstudiantes] = useState([]);
    const [asistencia, setAsistencia] = useState({}); // { [estId]: { estado, incidencias } }
    const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [existingMap, setExistingMap] = useState({}); // { [estId]: asistenciaRecord }

    // Helper: extrae arrays aun si la respuesta viene en diferentes formas
    const extractArrayFromResponse = (res) => {
        if (!res) return [];
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.data?.data)) return res.data.data;
        if (Array.isArray(res.data?.asistencias)) return res.data.asistencias;
        if (Array.isArray(res)) return res;
        return [];
    };

    // Cargar estudiantes y luego cargar asistencias para la fecha actual
    const fetchEstudiantes = useCallback(async () => {
        try {
            const res = await Config.GetEstudiantes();
            const list =
                res.data?.data || res.data || extractArrayFromResponse(res);
            setEstudiantes(Array.isArray(list) ? list : []);
            // initialize asistencia with defaults (will be overwritten by fetchAsistenciasForDate if any)
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

    // Cargar todas las asistencias y filtrar por fecha -> crear mapa por estudiante
    const fetchAsistenciasForDate = useCallback(
        async (date, studentsList = null) => {
            try {
                const res = await Config.GetAsistencias();
                const all = extractArrayFromResponse(res);
                const forDate = all.filter((a) => a.fecha === date);

                // map existente por estudiante_id
                const map = {};
                forDate.forEach((a) => {
                    map[a.estudiante_id] = a;
                });
                setExistingMap(map);

                // Si ya tenemos lista de estudiantes, actualizar estado en UI
                const list = studentsList || estudiantes;
                if (!Array.isArray(list) || list.length === 0) {
                    // no hay estudiantes cargados aún: no hacemos setAsistencia ahora
                    return;
                }

                const newAsistencia = {};
                list.forEach((est) => {
                    if (map[est.id]) {
                        // si hay registro en BD, usarlo
                        newAsistencia[est.id] = {
                            estado: map[est.id].estado,
                            incidencias: map[est.id].incidencias || "",
                        };
                    } else {
                        // si no hay, valores por defecto
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
        // primer load: estudiantes y asistencias de la fecha inicial
        (async () => {
            await fetchEstudiantes();
        })();
    }, [fetchEstudiantes]);

    // cuando cambien estudiantes (por primer fetch) cargamos la asistencia de la fecha por defecto
    useEffect(() => {
        if (estudiantes.length > 0) {
            fetchAsistenciasForDate(fecha, estudiantes);
        }
    }, [estudiantes, fecha, fetchAsistenciasForDate]);

    // Cuando el usuario cambia la fecha en el input, actualizamos y recargamos
    const handleFechaChange = async (e) => {
        const newDate = e.target.value;
        setFecha(newDate);

        // si ya tenemos estudiantes cargados pasarlos para usarlos al crear estado
        fetchAsistenciasForDate(newDate, estudiantes);
    };

    // Cambios UI
    const handleEstadoChange = (id, estado) => {
        setAsistencia((prev) => ({
            ...prev,
            [id]: { ...prev[id], estado },
        }));
    };

    const handleIncidenciaChange = (id, text) => {
        setAsistencia((prev) => ({
            ...prev,
            [id]: { ...prev[id], incidencias: text },
        }));
    };

    // Guardar: decide update o create según existingMap
    const handleGuardar = async () => {
        setLoading(true);
        setMensaje("");
        try {
            const promises = Object.keys(asistencia).map(async (estId) => {
                const registro = asistencia[estId];
                const existente = existingMap[estId];

                if (existente && existente.id) {
                    // actualizar
                    return Config.UpdateAsistencia(existente.id, {
                        estado: registro.estado,
                        incidencias: registro.incidencias,
                    });
                } else {
                    // crear nuevo
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

            // recargar la info desde backend para reflejar ids / cambios
            await fetchAsistenciasForDate(fecha, estudiantes);

            setMensaje("✅ Asistencia guardada correctamente.");
        } catch (err) {
            console.error("Error al guardar asistencia:", err);
            setMensaje("❌ Ocurrió un error al guardar la asistencia.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Tomar Asistencia</h1>

            <div className="mb-4">
                <label className="mr-2 font-semibold">Fecha:</label>
                <input
                    type="date"
                    value={fecha}
                    onChange={handleFechaChange}
                    className="border border-gray-300 rounded p-1"
                />
            </div>

            {estudiantes.length === 0 ? (
                <p>Cargando estudiantes...</p>
            ) : (
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border border-gray-300 p-2">
                                Estudiante
                            </th>
                            <th className="border border-gray-300 p-2">
                                Presente
                            </th>
                            <th className="border border-gray-300 p-2">
                                Ausente
                            </th>
                            <th className="border border-gray-300 p-2">
                                Tarde
                            </th>
                            <th className="border border-gray-300 p-2">
                                Incidencias
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {estudiantes.map((est) => (
                            <tr key={est.id}>
                                <td className="border border-gray-300 p-2">
                                    {est.nombre}
                                </td>
                                {["presente", "ausente", "tarde"].map(
                                    (estado) => (
                                        <td
                                            key={estado}
                                            className="border border-gray-300 p-2 text-center"
                                        >
                                            <input
                                                type="radio"
                                                name={`estado-${est.id}`}
                                                checked={
                                                    asistencia[est.id]
                                                        ?.estado === estado
                                                }
                                                onChange={() =>
                                                    handleEstadoChange(
                                                        est.id,
                                                        estado
                                                    )
                                                }
                                            />
                                        </td>
                                    )
                                )}
                                <td className="border border-gray-300 p-2">
                                    <input
                                        type="text"
                                        value={
                                            asistencia[est.id]?.incidencias ||
                                            ""
                                        }
                                        onChange={(e) =>
                                            handleIncidenciaChange(
                                                est.id,
                                                e.target.value
                                            )
                                        }
                                        placeholder="Incidencias..."
                                        className="border border-gray-300 rounded p-1 w-full"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <button
                onClick={handleGuardar}
                disabled={loading}
                className={`mt-4 py-2 px-4 rounded font-semibold text-white ${
                    loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                }`}
            >
                {loading ? "Guardando..." : "Guardar Asistencia"}
            </button>

            {mensaje && <p className="mt-2 font-medium">{mensaje}</p>}
        </div>
    );
};

export default AsistenciaDocente;
