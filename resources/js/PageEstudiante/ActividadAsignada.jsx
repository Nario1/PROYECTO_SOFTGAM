import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";
import SidebarEstudiante from "./SidebarEstudiante";
import "../styles/docente.css";

const ActividadAsignada = () => {
    const { getUserId } = AuthUser();
    const studentId = getUserId();

    const [actividades, setActividades] = useState([]);
    const [mensaje, setMensaje] = useState(null);
    const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
    const [textoEntrega, setTextoEntrega] = useState("");
    const [archivoEntrega, setArchivoEntrega] = useState(null);

    // 🔹 FUNCIÓN PARA OBTENER EL TIPO DE ARCHIVO - IGUAL QUE AsignarActividad
    const getTipoArchivo = (archivoPath, extensionOriginal = null) => {
        if (!archivoPath) return "otros";

        const extension = (
            extensionOriginal || archivoPath.split(".").pop()
        )?.toLowerCase();

        const tiposArchivo = {
            documento: [
                "pdf",
                "doc",
                "docx",
                "txt",
                "ppt",
                "pptx",
                "xlsx",
                "csv",
                "odt",
                "rtf",
            ],
            imagen: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico"],
            video: ["mp4", "mov", "avi", "mkv", "wmv", "flv", "webm"],
            otros: ["zip", "rar", "7z", "tar", "gz"],
        };

        for (const [tipo, extensiones] of Object.entries(tiposArchivo)) {
            if (extensiones.includes(extension)) {
                return tipo;
            }
        }

        return "otros";
    };

    // 🔥 FUNCIÓN PRINCIPAL PARA MANEJAR ARCHIVOS - IGUAL QUE AsignarActividad
    const manejarArchivo = async (
        actividadId,
        archivoPath,
        tipo,
        esEntrega = false
    ) => {
        if (!archivoPath) {
            setMensaje({ tipo: "error", texto: "No hay archivo disponible" });
            return;
        }

        try {
            let response;
            if (esEntrega) {
                response = await Config.DescargarEntrega(actividadId);
            } else {
                response = await Config.DescargarMaterialActividad(actividadId);
            }

            if (response.data?.success) {
                const { download_url, file_name, action, file_type } =
                    response.data;

                if (action === "ver") {
                    // Para imágenes y videos: abrir en nueva pestaña
                    window.open(download_url, "_blank", "noopener,noreferrer");
                    setMensaje({
                        tipo: "success",
                        texto: `${
                            file_type === "imagen" ? "Imagen" : "Video"
                        } abierto en nueva pestaña`,
                    });
                } else {
                    // Para documentos y otros: forzar descarga
                    const link = document.createElement("a");
                    link.href = download_url;
                    link.download = file_name;
                    link.target = "_blank";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    setMensaje({
                        tipo: "success",
                        texto: `Descargando ${file_name}...`,
                    });
                }
            } else {
                setMensaje({
                    tipo: "error",
                    texto:
                        response.data?.message || "Error al preparar archivo",
                });
            }
        } catch (err) {
            console.error("❌ Error al manejar archivo:", err);
            setMensaje({
                tipo: "error",
                texto: "Error al procesar el archivo",
            });
        }
    };

    // 🔹 FUNCIÓN PARA DETERMINAR ÍCONO SEGÚN TIPO
    const getIconoTipo = (tipo) => {
        const iconos = {
            documento: "📄",
            imagen: "🖼️",
            video: "🎥",
            otros: "📦",
        };
        return iconos[tipo] || "📁";
    };

    // 🔹 FUNCIÓN PARA DETERMINAR TEXTO DEL BOTÓN
    const getTextoBoton = (tipo) => {
        return tipo === "imagen" || tipo === "video"
            ? "👁️ Ver"
            : "📥 Descargar";
    };

    // Cargar actividades asignadas
    useEffect(() => {
        const fetchActividades = async () => {
            try {
                const res = await Config.GetActividadesAsignadas(studentId);
                if (res.data.success) {
                    setActividades(res.data.data.actividades);
                }
            } catch (err) {
                console.error("❌ Error al obtener actividades:", err);
                setMensaje({
                    tipo: "error",
                    texto: "Error al cargar actividades",
                });
            }
        };
        fetchActividades();
    }, [studentId]);

    const seleccionarActividad = (actividad) => {
        setActividadSeleccionada(actividad);
        setTextoEntrega(actividad.texto_entrega || "");
        setArchivoEntrega(null);
        setMensaje(null);
    };

    const handleArchivoChange = (e) => {
        setArchivoEntrega(e.target.files[0]);
    };

    const enviarEntrega = async (e) => {
        e.preventDefault();
        if (!actividadSeleccionada) return;

        const formData = new FormData();
        formData.append("actividad_id", actividadSeleccionada.id);
        formData.append("texto_entrega", textoEntrega);
        if (archivoEntrega) formData.append("archivo_entrega", archivoEntrega);

        try {
            const res = await Config.EnviarEntrega(formData);
            if (res.data.success) {
                setMensaje({
                    tipo: "success",
                    texto: "Entrega enviada correctamente",
                });

                const updatedActividades = actividades.map((act) =>
                    act.id === actividadSeleccionada.id
                        ? {
                              ...act,
                              texto_entrega: textoEntrega,
                              archivo_entrega:
                                  archivoEntrega?.name || act.archivo_entrega,
                              archivo_url:
                                  res.data.data.archivo_url || act.archivo_url,
                              asignacion_id: res.data.data.asignacion_id,
                              nombre_archivo_original_entrega:
                                  res.data.data.nombre_archivo_original ||
                                  act.nombre_archivo_original_entrega,
                              extension_original_entrega:
                                  res.data.data.extension_original ||
                                  act.extension_original_entrega,
                          }
                        : act
                );
                setActividades(updatedActividades);
                setActividadSeleccionada(null);
            } else {
                setMensaje({
                    tipo: "error",
                    texto: res.data.message || "Error al enviar entrega",
                });
            }
        } catch (err) {
            console.error("❌ Error al enviar entrega:", err);
            setMensaje({ tipo: "error", texto: "Error al enviar entrega" });
        }
    };

    return (
        <div
            className="admin-container d-flex"
            style={{ minHeight: "100vh", background: "#111" }}
        >
            <SidebarEstudiante />

            <div
                className="admin-content flex-grow-1 overflow-y-auto p-6"
                style={{ maxHeight: "calc(100vh - 2rem)" }}
            >
                <h2 className="text-2xl font-bold text-white mb-4">
                    📚 Mis Actividades Asignadas
                </h2>

                {mensaje && (
                    <p
                        className={`font-semibold ${
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

                <div className="admin-card overflow-x-auto mb-6">
                    <table className="w-full border-collapse border border-gray-300 text-white">
                        <thead className="bg-gray-800 sticky top-0 z-10">
                            <tr>
                                <th className="border border-gray-600 p-2">
                                    Título
                                </th>
                                <th className="border border-gray-600 p-2">
                                    Temática
                                </th>
                                <th className="border border-gray-600 p-2">
                                    Docente
                                </th>
                                <th className="border border-gray-600 p-2">
                                    Fecha límite
                                </th>
                                <th className="border border-gray-600 p-2">
                                    Material
                                </th>
                                <th className="border border-gray-600 p-2">
                                    Estado
                                </th>
                                <th className="border border-gray-600 p-2">
                                    Mi entrega
                                </th>
                                <th className="border border-gray-600 p-2">
                                    Acción
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {actividades.map((act) => {
                                const tipoMaterial = getTipoArchivo(
                                    act.archivo_material,
                                    act.extension_original
                                );
                                const tipoEntrega = getTipoArchivo(
                                    act.archivo_entrega,
                                    act.extension_original_entrega
                                );

                                return (
                                    <tr
                                        key={act.id}
                                        className="hover:bg-gray-700"
                                    >
                                        <td className="border border-gray-600 p-2">
                                            {act.titulo}
                                        </td>
                                        <td className="border border-gray-600 p-2">
                                            {act.tematica_nombre}
                                        </td>
                                        <td className="border border-gray-600 p-2">
                                            {act.docente_nombre}
                                        </td>
                                        <td
                                            className={`border border-gray-600 p-2 ${
                                                new Date(act.fecha_limite) <
                                                new Date()
                                                    ? "text-red-400"
                                                    : ""
                                            }`}
                                        >
                                            {act.fecha_limite || "-"}
                                        </td>
                                        <td className="border border-gray-600 p-2">
                                            {act.archivo_material ? (
                                                <div className="flex items-center gap-2">
                                                    <span>
                                                        {getIconoTipo(
                                                            tipoMaterial
                                                        )}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            manejarArchivo(
                                                                act.id,
                                                                act.archivo_material,
                                                                tipoMaterial,
                                                                false
                                                            )
                                                        }
                                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                                    >
                                                        {getTextoBoton(
                                                            tipoMaterial
                                                        )}
                                                    </button>
                                                    <span className="text-xs text-gray-400">
                                                        {act.nombre_archivo_original ||
                                                            act.archivo_material
                                                                .split("/")
                                                                .pop()}
                                                    </span>
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="border border-gray-600 p-2">
                                            {act.texto_entrega ||
                                            act.archivo_entrega ? (
                                                <span className="text-green-400">
                                                    ✅ Entregado
                                                </span>
                                            ) : (
                                                <span className="text-yellow-400">
                                                    ⏳ Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="border border-gray-600 p-2">
                                            {act.archivo_entrega ? (
                                                <div className="flex items-center gap-2">
                                                    <span>
                                                        {getIconoTipo(
                                                            tipoEntrega
                                                        )}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            manejarArchivo(
                                                                act.id,
                                                                act.archivo_entrega,
                                                                tipoEntrega,
                                                                true
                                                            )
                                                        }
                                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                                    >
                                                        {getTextoBoton(
                                                            tipoEntrega
                                                        )}
                                                    </button>
                                                    <span className="text-xs text-gray-400">
                                                        {act.nombre_archivo_original_entrega ||
                                                            act.archivo_entrega
                                                                .split("/")
                                                                .pop()}
                                                    </span>
                                                </div>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td className="border border-gray-600 p-2">
                                            <button
                                                className="admin-btn text-sm px-3 py-1"
                                                onClick={() =>
                                                    seleccionarActividad(act)
                                                }
                                            >
                                                📝 Entregar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {actividadSeleccionada && (
                    <div className="admin-card p-6 mb-6">
                        <h3 className="text-lg font-semibold mb-4">
                            📝 Enviar entrega: {actividadSeleccionada.titulo}
                        </h3>

                        {actividadSeleccionada.descripcion && (
                            <div className="p-3 bg-gray-800 rounded mb-4">
                                <strong>📋 Descripción:</strong>
                                <p className="mt-2">
                                    {actividadSeleccionada.descripcion}
                                </p>
                            </div>
                        )}

                        {actividadSeleccionada.archivo_material && (
                            <div className="p-3 bg-gray-800 rounded mb-4">
                                <strong>📎 Material del docente:</strong>
                                <div className="flex items-center gap-2 mt-2">
                                    <span>
                                        {getIconoTipo(
                                            getTipoArchivo(
                                                actividadSeleccionada.archivo_material,
                                                actividadSeleccionada.extension_original
                                            )
                                        )}
                                    </span>
                                    <button
                                        onClick={() =>
                                            manejarArchivo(
                                                actividadSeleccionada.id,
                                                actividadSeleccionada.archivo_material,
                                                getTipoArchivo(
                                                    actividadSeleccionada.archivo_material,
                                                    actividadSeleccionada.extension_original
                                                ),
                                                false
                                            )
                                        }
                                        className="text-blue-400 hover:text-blue-300"
                                    >
                                        {getTextoBoton(
                                            getTipoArchivo(
                                                actividadSeleccionada.archivo_material,
                                                actividadSeleccionada.extension_original
                                            )
                                        )}
                                    </button>
                                    <span className="text-xs text-gray-400">
                                        {actividadSeleccionada.nombre_archivo_original ||
                                            actividadSeleccionada.archivo_material
                                                .split("/")
                                                .pop()}
                                    </span>
                                </div>
                            </div>
                        )}

                        <form
                            onSubmit={enviarEntrega}
                            className="flex flex-col gap-4"
                        >
                            <div>
                                <label className="block mb-2 font-semibold">
                                    📝 Texto de entrega:
                                </label>
                                <textarea
                                    value={textoEntrega}
                                    onChange={(e) =>
                                        setTextoEntrega(e.target.value)
                                    }
                                    rows={4}
                                    className="admin-textarea"
                                    placeholder="Escribe tu respuesta aquí..."
                                />
                            </div>

                            <div>
                                <label className="block mb-2 font-semibold">
                                    📎 Archivo (opcional):
                                </label>
                                <input
                                    type="file"
                                    onChange={handleArchivoChange}
                                    className="admin-input"
                                />
                                {actividadSeleccionada.archivo_entrega && (
                                    <div className="mt-3 p-3 bg-gray-800 rounded">
                                        <p className="text-sm mb-2">
                                            📌 Archivo entregado previamente:
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span>
                                                {getIconoTipo(
                                                    getTipoArchivo(
                                                        actividadSeleccionada.archivo_entrega,
                                                        actividadSeleccionada.extension_original_entrega
                                                    )
                                                )}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    manejarArchivo(
                                                        actividadSeleccionada.id,
                                                        actividadSeleccionada.archivo_entrega,
                                                        getTipoArchivo(
                                                            actividadSeleccionada.archivo_entrega,
                                                            actividadSeleccionada.extension_original_entrega
                                                        ),
                                                        true
                                                    )
                                                }
                                                className="text-blue-400 hover:text-blue-300"
                                            >
                                                {getTextoBoton(
                                                    getTipoArchivo(
                                                        actividadSeleccionada.archivo_entrega,
                                                        actividadSeleccionada.extension_original_entrega
                                                    )
                                                )}
                                            </button>
                                            <span className="text-xs text-gray-400">
                                                {actividadSeleccionada.nombre_archivo_original_entrega ||
                                                    actividadSeleccionada.archivo_entrega
                                                        .split("/")
                                                        .pop()}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="admin-btn flex-1"
                                >
                                    🚀 Enviar Entrega
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setActividadSeleccionada(null)
                                    }
                                    className="admin-btn admin-btn-danger flex-1"
                                >
                                    ❌ Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActividadAsignada;
