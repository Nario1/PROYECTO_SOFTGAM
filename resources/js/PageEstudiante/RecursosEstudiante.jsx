import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";
import SidebarEstudiante from "./SidebarEstudiante"; // sidebar
import "../styles/docente.css"; // estilos generales

const RecursosEstudiante = () => {
    const { getUserId } = AuthUser();
    const studentId = getUserId();

    const [recursos, setRecursos] = useState([]);
    const [mensaje, setMensaje] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRecursos = async () => {
            setLoading(true);
            try {
                const res = await Config.GetRecursosParaEstudiantes();
                if (res.data?.data) {
                    setRecursos(res.data.data);
                } else {
                    setRecursos([]);
                }
            } catch (err) {
                console.error("❌ Error al cargar recursos:", err);
                setMensaje({
                    tipo: "error",
                    texto: "Error al cargar recursos",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchRecursos();
    }, [studentId]);

    return (
        <div className="admin-container d-flex" style={{ minHeight: "100vh" }}>
            {/* Sidebar */}
            <SidebarEstudiante />

            <div
                className="admin-content flex-grow-1 overflow-y-auto p-6"
                style={{ maxHeight: "calc(100vh - 2rem)" }}
            >
                <h2 className="text-2xl font-bold text-white mb-4">
                    📚 Recursos Disponibles
                </h2>

                {mensaje && (
                    <p
                        className={`font-bold mb-4 ${
                            mensaje.tipo === "error"
                                ? "text-danger"
                                : "text-success"
                        }`}
                    >
                        {mensaje.texto}
                    </p>
                )}

                {loading ? (
                    <p className="text-white">Cargando recursos...</p>
                ) : recursos.length === 0 ? (
                    <p className="text-white">No hay recursos disponibles.</p>
                ) : (
                    <div
                        className="admin-card overflow-y-auto p-4"
                        style={{ maxHeight: "70vh" }}
                    >
                        <table className="min-w-full bg-black text-white border border-gray-600">
                            <thead className="bg-gray-800 sticky top-0">
                                <tr>
                                    <th className="py-2 px-4 border border-gray-600">
                                        Título
                                    </th>
                                    <th className="py-2 px-4 border border-gray-600">
                                        Descripción
                                    </th>
                                    <th className="py-2 px-4 border border-gray-600">
                                        Docente
                                    </th>
                                    <th className="py-2 px-4 border border-gray-600">
                                        Temática
                                    </th>
                                    <th className="py-2 px-4 border border-gray-600">
                                        Fecha Publicación
                                    </th>
                                    <th className="py-2 px-4 border border-gray-600">
                                        Archivo / Enlace
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {recursos.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="hover:bg-gray-900"
                                    >
                                        <td className="py-2 px-4 border border-gray-600">
                                            {r.titulo}
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            {r.descripcion || "-"}
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            {r.docente
                                                ? `${r.docente.nombre} ${r.docente.apellido}`
                                                : "-"}
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            {r.tematica?.nombre || "-"}
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            {r.fecha_publicacion || "-"}
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            {r.tipo === "enlace" ? (
                                                <a
                                                    href={r.url_recurso}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 underline"
                                                >
                                                    Ver enlace
                                                </a>
                                            ) : r.archivo_path ? (
                                                <a
                                                    href={`${window.location.origin}/storage/${r.archivo_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 underline"
                                                >
                                                    Ver archivo
                                                </a>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecursosEstudiante;
