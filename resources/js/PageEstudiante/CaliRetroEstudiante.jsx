import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";
import SidebarEstudiante from "./SidebarEstudiante";
import "../styles/docente.css";

const CaliRetroEstudiante = () => {
    const { getUserId } = AuthUser();
    const estudianteId = getUserId();

    const [retroalimentaciones, setRetroalimentaciones] = useState([]);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await Config.GetRetroalimentacionesPorEstudiante(
                    estudianteId
                );
                if (res.data.success) {
                    const datos = Array.isArray(res.data.data)
                        ? res.data.data
                        : [];
                    setRetroalimentaciones(datos);
                } else {
                    setRetroalimentaciones([]);
                }
            } catch (err) {
                console.error("❌ Error:", err);
                setMensaje({
                    tipo: "error",
                    texto: "Error al cargar calificaciones",
                });
            }
        })();
    }, [estudianteId]);

    return (
        <div className="admin-container d-flex" style={{ minHeight: "100vh" }}>
            {/* Sidebar */}
            <SidebarEstudiante />

            {/* Contenido principal */}
            <div className="admin-content flex-grow-1 p-6 overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-4">
                    📘 Mis Calificaciones y Retroalimentaciones
                </h2>

                {mensaje && (
                    <p
                        className={
                            mensaje.tipo === "error"
                                ? "text-danger"
                                : "text-success"
                        }
                    >
                        {mensaje.texto}
                    </p>
                )}

                <div
                    className="admin-card overflow-y-auto p-4"
                    style={{ maxHeight: "75vh" }} // termina más arriba del borde inferior
                >
                    <table className="min-w-full bg-black text-white border border-gray-600">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="py-2 px-4 border border-gray-600">
                                    Actividad
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Docente
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Fecha Entrega
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Calificación
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Retroalimentación
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {retroalimentaciones.length > 0 ? (
                                retroalimentaciones.map((r) => (
                                    <tr
                                        key={`retro-${r.id}`}
                                        className="hover:bg-gray-900 transition"
                                    >
                                        <td className="py-2 px-4 border border-gray-600">
                                            {r.actividad_titulo}
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            {r.docente_nombre}
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            {r.fecha_entrega || "-"}
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            {r.calificacion !== null
                                                ? r.calificacion
                                                : "⏳ Pendiente"}
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            {r.retroalimentacion !== null
                                                ? r.retroalimentacion
                                                : "Sin comentarios"}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-4 text-center"
                                    >
                                        No tienes calificaciones aún.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CaliRetroEstudiante;
