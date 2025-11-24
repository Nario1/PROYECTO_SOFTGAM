import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";
import SidebarEstudiante from "./SidebarEstudiante";
import "../styles/docente.css";

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

    // 🔹 FUNCIÓN PARA ABRIR ARCHIVO EN NUEVA PESTAÑA
    const abrirArchivo = (archivoPath, tipo, nombreArchivo = "") => {
        if (!archivoPath) {
            setMensaje({ tipo: "error", texto: "No hay archivo para abrir" });
            return;
        }

        // Construir la URL completa del archivo
        const urlArchivo = archivoPath.startsWith("http")
            ? archivoPath
            : `${window.location.origin}/storage/${archivoPath}`;

        // Abrir en nueva pestaña
        window.open(urlArchivo, "_blank", "noopener,noreferrer");

        setMensaje({
            tipo: "success",
            texto: `Archivo ${tipo} abierto en nueva pestaña`,
        });
    };

    // 🔹 FUNCIÓN PARA DESCARGAR ARCHIVO
    const descargarArchivo = (archivoPath, nombreArchivo = "") => {
        if (!archivoPath) {
            setMensaje({
                tipo: "error",
                texto: "No hay archivo para descargar",
            });
            return;
        }

        const urlArchivo = archivoPath.startsWith("http")
            ? archivoPath
            : `${window.location.origin}/storage/${archivoPath}`;

        // Crear un enlace temporal para descarga
        const link = document.createElement("a");
        link.href = urlArchivo;
        link.target = "_blank";
        link.download =
            nombreArchivo || archivoPath.split("/").pop() || "archivo";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setMensaje({
            tipo: "success",
            texto: "Descargando archivo...",
        });
    };

    // 🔹 FUNCIÓN PARA OBTENER EL ICONO SEGÚN EL TIPO DE ARCHIVO
    const getIconoPorTipo = (tipo) => {
        switch (tipo) {
            case "documento":
                return "📄";
            case "video":
                return "🎬";
            case "imagen":
                return "🖼️";
            case "enlace":
                return "🔗";
            default:
                return "📁";
        }
    };

    // 🔹 FUNCIÓN PARA OBTENER EL TEXTO DEL BOTÓN SEGÚN EL TIPO
    const getTextoBoton = (tipo) => {
        switch (tipo) {
            case "documento":
                return "Abrir documento";
            case "video":
                return "Ver video";
            case "imagen":
                return "Ver imagen";
            case "enlace":
                return "Abrir enlace";
            default:
                return "Abrir archivo";
        }
    };

    return (
        <div className="admin-container d-flex" style={{ minHeight: "100vh" }}>
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
                                ? "text-red-500"
                                : mensaje.tipo === "success"
                                ? "text-green-500"
                                : "text-blue-500"
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
                                        Tipo
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
                                        <td className="py-2 px-4 border border-gray-600 text-center">
                                            <span title={r.tipo}>
                                                {getIconoPorTipo(r.tipo)}
                                            </span>
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            {r.fecha_publicacion || "-"}
                                        </td>
                                        <td className="py-2 px-4 border border-gray-600">
                                            {r.tipo === "enlace" ? (
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        onClick={() =>
                                                            abrirArchivo(
                                                                r.url_recurso,
                                                                r.tipo
                                                            )
                                                        }
                                                        className="text-blue-400 hover:text-blue-300 text-left flex items-center gap-1"
                                                    >
                                                        🔗{" "}
                                                        {getTextoBoton(r.tipo)}
                                                    </button>
                                                    <span className="text-xs text-gray-400 break-all">
                                                        {r.url_recurso}
                                                    </span>
                                                </div>
                                            ) : r.archivo_path ? (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() =>
                                                                abrirArchivo(
                                                                    r.archivo_path,
                                                                    r.tipo,
                                                                    r.nombre_archivo_original
                                                                )
                                                            }
                                                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                                                        >
                                                            👁️{" "}
                                                            {getTextoBoton(
                                                                r.tipo
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                descargarArchivo(
                                                                    r.archivo_path,
                                                                    r.nombre_archivo_original ||
                                                                        r.archivo_path
                                                                            .split(
                                                                                "/"
                                                                            )
                                                                            .pop()
                                                                )
                                                            }
                                                            className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1"
                                                        >
                                                            ⬇️ Descargar
                                                        </button>
                                                    </div>
                                                    <span className="text-xs text-gray-400 break-all">
                                                        {r.nombre_archivo_original ||
                                                            r.archivo_path
                                                                .split("/")
                                                                .pop() +
                                                                (r.extension_original
                                                                    ? `.${r.extension_original}`
                                                                    : "")}
                                                    </span>
                                                </div>
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
