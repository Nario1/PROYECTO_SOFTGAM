import React, { useEffect, useState } from "react";
import AuthUser from "../pageauth/AuthUser";
import Config from "../Config";
import SidebarEstudiante from "./SidebarEstudiante"; // Sidebar incluido
import "../styles/docente.css"; // estilos generales

const AsistenciaEstudiante = () => {
    const { getUserId } = AuthUser();
    const studentId = getUserId();

    const [asistencias, setAsistencias] = useState([]);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        const fetchAsistencias = async () => {
            if (!studentId) {
                setMensaje("No se encontró el ID del estudiante.");
                return;
            }

            try {
                const res = await Config.GetAsistenciaByEstudiante(studentId);

                if (res.data && Array.isArray(res.data.data)) {
                    setAsistencias(res.data.data);
                    setMensaje("");
                } else if (Array.isArray(res.data)) {
                    setAsistencias(res.data);
                    setMensaje("");
                } else {
                    console.warn(
                        "⚠️ Respuesta inesperada del servidor:",
                        res.data
                    );
                    setMensaje("No hay asistencias registradas.");
                }
            } catch (error) {
                console.error("❌ Error al obtener asistencias:", error);
                setMensaje("Error al cargar asistencias.");
            }
        };

        fetchAsistencias();
    }, [studentId]);

    return (
        <div className="admin-container d-flex" style={{ minHeight: "100vh" }}>
            {/* Sidebar */}
            <SidebarEstudiante />

            {/* Contenido principal */}
            <div
                className="admin-content flex-grow-1 overflow-y-auto p-6"
                style={{ maxHeight: "calc(100vh - 2rem)" }}
            >
                <h2 className="text-2xl font-bold text-white mb-4">
                    📋 Mi Asistencia
                </h2>

                {mensaje && (
                    <p className="text-danger font-bold mb-4">{mensaje}</p>
                )}

                {asistencias.length > 0 && (
                    <div
                        className="admin-card overflow-y-auto p-4"
                        style={{ maxHeight: "70vh" }}
                    >
                        <table className="min-w-full bg-black text-white border border-gray-600">
                            <thead className="bg-gray-800 sticky top-0">
                                <tr>
                                    <th className="py-2 px-4 border border-gray-600">
                                        Fecha
                                    </th>
                                    <th className="py-2 px-4 border border-gray-600">
                                        Docente
                                    </th>
                                    <th className="py-2 px-4 border border-gray-600">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {asistencias.map((asistencia) => (
                                    <tr
                                        key={asistencia.id}
                                        className="hover:bg-gray-900"
                                    >
                                        <td className="py-2 px-4 border border-gray-600">
                                            {asistencia.fecha}
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            {asistencia.docente_nombre || "—"}
                                        </td>
                                        <td
                                            className={`py-2 px-4 border border-gray-600 font-bold ${
                                                asistencia.estado === "Presente"
                                                    ? "text-green-500"
                                                    : "text-red-500"
                                            }`}
                                        >
                                            {asistencia.estado}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {!mensaje && asistencias.length === 0 && (
                    <p className="text-white">
                        No tienes registros de asistencia.
                    </p>
                )}
            </div>
        </div>
    );
};

export default AsistenciaEstudiante;
