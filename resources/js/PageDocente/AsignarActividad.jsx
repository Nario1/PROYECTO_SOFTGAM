import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";
import "../styles/docente.css";
import SidebarDocente from "./SidebarDocente";

const AsignarActividad = () => {
    const { getUserId } = AuthUser();
    const docenteId = getUserId();

    const [tematicas, setTematicas] = useState([]);
    const [estudiantes, setEstudiantes] = useState([]);
    const [actividades, setActividades] = useState([]);
    const [mensaje, setMensaje] = useState(null);
    const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
    const [formData, setFormData] = useState({
        titulo: "",
        descripcion: "",
        tematica_id: "",
        nueva_tematica: "",
        fecha_limite: "",
        archivo_material: null,
        estudiantes_ids: [],
    });
    const [loadingTematica, setLoadingTematica] = useState(false);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [verEntregas, setVerEntregas] = useState(false);
    const [entregas, setEntregas] = useState([]);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resTematicas = await Config.GetTematicas();
                if (resTematicas.data?.success)
                    setTematicas(resTematicas.data.data.tematicas || []);

                const resEstudiantes = await Config.GetEstudiantes();
                if (resEstudiantes.data?.success)
                    setEstudiantes(resEstudiantes.data.data || []);

                const resActividades = await Config.GetActividadesDocente(
                    docenteId
                );
                if (resActividades.data?.success)
                    setActividades(resActividades.data.data.actividades || []);
            } catch (err) {
                console.error("❌ Error cargando datos:", err);
                setMensaje({ tipo: "error", texto: "Error al cargar datos" });
            }
        };
        fetchData();
    }, [docenteId]);

    // 🔹 FUNCIÓN PARA OBTENER EL TIPO DE ARCHIVO - IGUAL QUE RecursosDocente
    const getTipoArchivo = (archivoPath, extensionOriginal = null) => {
        if (!archivoPath) return "otros";

        // Primero intentar con extensión original si existe
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

    // 🔥 FUNCIÓN PRINCIPAL PARA MANEJAR ARCHIVOS - IGUAL QUE RecursosDocente
    const manejarArchivo = async (
        actividadId,
        archivoPath,
        tipo,
        esEntrega = false,
        estudianteId = null // ✅ NUEVO PARÁMETRO
    ) => {
        if (!archivoPath) {
            setMensaje({ tipo: "error", texto: "No hay archivo disponible" });
            return;
        }

        try {
            let response;
            if (esEntrega) {
                // ✅ Si es entrega y viene estudianteId (docente), usar el método con estudiante
                if (estudianteId) {
                    response = await Config.DescargarEntregaConEstudiante(
                        actividadId,
                        estudianteId
                    );
                } else {
                    // Si no viene estudianteId (estudiante descargando su propia entrega)
                    response = await Config.DescargarEntrega(actividadId);
                }
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

    // 🔹 FUNCIÓN PARA DETERMINAR ÍCONO SEGÚN TIPO - IGUAL QUE RecursosDocente
    const getIconoTipo = (tipo) => {
        const iconos = {
            documento: "📄",
            imagen: "🖼️",
            video: "🎥",
            otros: "📦",
        };
        return iconos[tipo] || "📁";
    };

    // 🔹 FUNCIÓN PARA DETERMINAR TEXTO DEL BOTÓN - IGUAL QUE RecursosDocente
    const getTextoBoton = (tipo) => {
        return tipo === "imagen" || tipo === "video"
            ? "👁️ Ver"
            : "📥 Descargar";
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData((prev) => ({
            ...prev,
            archivo_material: file,
        }));

        // Preview para imágenes
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const handleSelectEstudiante = (e) => {
        const selected = Array.from(
            e.target.selectedOptions,
            (opt) => opt.value
        );
        setFormData((prev) => ({ ...prev, estudiantes_ids: selected }));
    };

    const handleAsignarTodos = () => {
        const todosIds = estudiantes.map((e) => String(e.id));
        setFormData((prev) => ({ ...prev, estudiantes_ids: todosIds }));
    };

    const handleCrearTematica = async () => {
        const nombre = formData.nueva_tematica.trim();
        if (!nombre) return;

        setLoadingTematica(true);
        setMensaje({ tipo: "info", texto: "Creando temática..." });

        try {
            const res = await Config.CrearTematica({ nombre });
            if (res.data?.success) {
                const resTemas = await Config.GetTematicas();
                if (resTemas.data?.success) {
                    setTematicas(resTemas.data.data.tematicas || []);
                    const nueva = res.data.data;
                    setFormData((prev) => ({
                        ...prev,
                        tematica_id: nueva.id,
                        nueva_tematica: "",
                    }));
                    setMensaje({
                        tipo: "success",
                        texto: "Temática creada y seleccionada",
                    });
                }
            } else {
                setMensaje({
                    tipo: "error",
                    texto: res.data.message || "Error al crear temática",
                });
            }
        } catch (err) {
            console.error("❌ Error al crear temática:", err);
            setMensaje({
                tipo: "error",
                texto: err.response?.data?.message || "Error al crear temática",
            });
        } finally {
            setLoadingTematica(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.tematica_id)
            return setMensaje({
                tipo: "error",
                texto: "Debe seleccionar una temática",
            });
        if (!formData.titulo.trim())
            return setMensaje({
                tipo: "error",
                texto: "Debe ingresar un título",
            });

        try {
            const form = new FormData();
            form.append("titulo", formData.titulo);
            form.append("descripcion", formData.descripcion);
            form.append("tematica_id", formData.tematica_id);
            form.append("fecha_limite", formData.fecha_limite || "");
            if (formData.archivo_material)
                form.append("archivo_material", formData.archivo_material);
            formData.estudiantes_ids.forEach((id, index) =>
                form.append(`estudiantes_ids[${index}]`, id)
            );

            let res;
            if (actividadSeleccionada) {
                res = await Config.ActualizarActividad(
                    actividadSeleccionada.id,
                    form,
                    true
                );
            } else {
                res = await Config.CrearActividad(form, true);
            }

            if (res.data.success) {
                setMensaje({
                    tipo: "success",
                    texto: actividadSeleccionada
                        ? "Actividad actualizada"
                        : "Actividad creada correctamente",
                });
                setFormData({
                    titulo: "",
                    descripcion: "",
                    tematica_id: "",
                    nueva_tematica: "",
                    fecha_limite: "",
                    archivo_material: null,
                    estudiantes_ids: [],
                });
                setActividadSeleccionada(null);
                setMostrarFormulario(false);
                setPreview(null);

                const resActividades = await Config.GetActividadesDocente(
                    docenteId
                );
                if (resActividades.data?.success)
                    setActividades(resActividades.data.data.actividades || []);
            } else {
                setMensaje({
                    tipo: "error",
                    texto: res.data.message || "Error al guardar actividad",
                });
            }
        } catch (err) {
            console.error("❌ Error al guardar actividad:", err);
            setMensaje({ tipo: "error", texto: "Error al guardar actividad" });
        }
    };

    const editarActividad = (actividad) => {
        setActividadSeleccionada(actividad);
        setFormData({
            titulo: actividad.titulo,
            descripcion: actividad.descripcion,
            tematica_id: actividad.tematica_id?.toString() || "",
            nueva_tematica: "",
            fecha_limite: actividad.fecha_limite,
            archivo_material: null,
            archivo_existente: actividad.archivo_material || null,
            estudiantes_ids: actividad.estudiantes_ids?.map(String) || [],
        });
        setPreview(actividad.archivo_material || null);
        setMostrarFormulario(true);
        setVerEntregas(false);
    };

    const eliminarActividad = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta actividad?"))
            return;
        try {
            const res = await Config.EliminarActividad(id);
            if (res.data.success) {
                setActividades(actividades.filter((act) => act.id !== id));
                setMensaje({
                    tipo: "success",
                    texto: "Actividad eliminada correctamente",
                });
            } else {
                setMensaje({
                    tipo: "error",
                    texto: res.data.message || "Error al eliminar",
                });
            }
        } catch (err) {
            console.error("❌ Error al eliminar actividad:", err);
            setMensaje({ tipo: "error", texto: "Error al eliminar actividad" });
        }
    };

    const mostrarEntregas = async (actividad) => {
        try {
            const res = await Config.GetEntregasActividad(actividad.id);
            if (res.data.success) {
                setEntregas(res.data.data.entregas || []);
                setActividadSeleccionada(actividad);
                setVerEntregas(true);
                setMostrarFormulario(false);
            }
        } catch (err) {
            console.error("❌ Error al obtener entregas:", err);
            setMensaje({ tipo: "error", texto: "Error al obtener entregas" });
        }
    };

    return (
        <div className="admin-container d-flex" style={{ minHeight: "100vh" }}>
            <SidebarDocente />
            <div
                className="admin-content overflow-y-auto flex flex-col gap-6 p-6"
                style={{ maxHeight: "100vh", flexGrow: 1 }}
            >
                <h2 className="text-2xl font-bold mb-4">
                    📝 Actividades del Docente
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

                <button
                    onClick={() => {
                        setMostrarFormulario(!mostrarFormulario);
                        setActividadSeleccionada(null);
                        setVerEntregas(false);
                        setPreview(null);
                    }}
                    className="admin-btn"
                >
                    {mostrarFormulario
                        ? "❌ Cancelar"
                        : "➕ Agregar Nueva Actividad"}
                </button>

                {/* Formulario */}
                {mostrarFormulario && (
                    <div className="admin-card">
                        <h3 className="text-lg font-semibold mb-4">
                            {actividadSeleccionada
                                ? "✏️ Editar Actividad"
                                : "📝 Nueva Actividad"}
                        </h3>
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4"
                        >
                            <input
                                type="text"
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleChange}
                                placeholder="Título"
                                className="admin-input"
                                required
                            />
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                placeholder="Descripción"
                                className="admin-textarea"
                            />
                            <select
                                name="tematica_id"
                                value={formData.tematica_id}
                                onChange={handleChange}
                                className="admin-input"
                            >
                                <option value="">
                                    -- Seleccionar Temática --
                                </option>
                                {tematicas.map((t) => (
                                    <option key={t.id} value={t.id.toString()}>
                                        {t.nombre}
                                    </option>
                                ))}
                            </select>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="nueva_tematica"
                                    value={formData.nueva_tematica}
                                    onChange={handleChange}
                                    placeholder="Escribe nueva temática"
                                    className="admin-input flex-1"
                                />
                                <button
                                    type="button"
                                    onClick={handleCrearTematica}
                                    className="admin-btn"
                                    disabled={loadingTematica}
                                >
                                    {loadingTematica
                                        ? "⏳ Creando..."
                                        : "📁 Crear"}
                                </button>
                            </div>

                            <input
                                type="date"
                                name="fecha_limite"
                                value={formData.fecha_limite}
                                onChange={handleChange}
                                className="admin-input"
                            />

                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="admin-input"
                            />

                            {preview &&
                                getTipoArchivo(
                                    formData.archivo_existente ||
                                        (formData.archivo_material
                                            ? formData.archivo_material.name
                                            : "")
                                ) === "imagen" && (
                                    <img
                                        src={preview}
                                        alt="preview"
                                        className="max-w-xs rounded"
                                    />
                                )}

                            {formData.archivo_existente &&
                                !formData.archivo_material && (
                                    <div className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                                        <span className="text-sm">
                                            {getIconoTipo(
                                                getTipoArchivo(
                                                    formData.archivo_existente,
                                                    actividadSeleccionada?.extension_original
                                                )
                                            )}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                manejarArchivo(
                                                    actividadSeleccionada.id,
                                                    formData.archivo_existente,
                                                    getTipoArchivo(
                                                        formData.archivo_existente,
                                                        actividadSeleccionada?.extension_original
                                                    ),
                                                    false
                                                )
                                            }
                                            className="text-blue-400 hover:text-blue-300"
                                        >
                                            {getTextoBoton(
                                                getTipoArchivo(
                                                    formData.archivo_existente,
                                                    actividadSeleccionada?.extension_original
                                                )
                                            )}{" "}
                                            archivo
                                        </button>
                                        <span className="text-xs text-gray-400">
                                            {actividadSeleccionada?.nombre_archivo_original ||
                                                formData.archivo_existente
                                                    .split("/")
                                                    .pop()}
                                        </span>
                                    </div>
                                )}

                            <select
                                multiple
                                value={formData.estudiantes_ids}
                                onChange={handleSelectEstudiante}
                                className="admin-input"
                            >
                                {estudiantes.map((est) => (
                                    <option key={est.id} value={est.id}>
                                        {est.name ||
                                            est.nombre ||
                                            est.email ||
                                            `Estudiante #${est.id}`}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleAsignarTodos}
                                className="admin-btn w-full"
                            >
                                👥 Asignar a todos
                            </button>

                            <button type="submit" className="admin-btn w-full">
                                {actividadSeleccionada
                                    ? "💾 Actualizar"
                                    : "🚀 Crear y Asignar"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Lista de actividades */}
                <div className="admin-card overflow-x-auto">
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
                                    Fecha límite
                                </th>
                                <th className="border border-gray-600 p-2">
                                    Estudiantes
                                </th>
                                <th className="border border-gray-600 p-2">
                                    Archivo
                                </th>
                                <th className="border border-gray-600 p-2">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {actividades.map((act) => {
                                const tipoArchivo = getTipoArchivo(
                                    act.archivo_material,
                                    act.extension_original
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
                                        <td className="border border-gray-600 p-2 text-center">
                                            {act.estudiantes_count || 0}
                                        </td>
                                        <td className="border border-gray-600 p-2">
                                            {act.archivo_material ? (
                                                <div className="flex items-center gap-2">
                                                    <span>
                                                        {getIconoTipo(
                                                            tipoArchivo
                                                        )}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            manejarArchivo(
                                                                act.id, // ← ID de la actividad actual
                                                                act.archivo_material, // ← Archivo material
                                                                tipoArchivo, // ← Tipo detectado
                                                                false // ← NO es entrega
                                                            )
                                                        }
                                                        className="text-blue-400 hover:text-blue-300"
                                                    >
                                                        {getTextoBoton(
                                                            tipoArchivo
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
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={() =>
                                                        editarActividad(act)
                                                    }
                                                    className="admin-btn text-sm px-2 py-1"
                                                >
                                                    ✏️ Editar
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        eliminarActividad(
                                                            act.id
                                                        )
                                                    }
                                                    className="admin-btn admin-btn-danger text-sm px-2 py-1"
                                                >
                                                    🗑️ Eliminar
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        mostrarEntregas(act)
                                                    }
                                                    className="admin-btn text-sm px-2 py-1"
                                                >
                                                    📋 Ver entregas
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Modal de entregas - CORREGIDO */}
                {verEntregas && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-16 z-50 overflow-auto">
                        <div className="admin-card w-full max-w-3xl p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
                            <h3 className="text-lg font-semibold mb-4">
                                📋 Entregas de: {actividadSeleccionada.titulo}
                            </h3>
                            <table className="w-full border-collapse border border-gray-300 text-white">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="border border-gray-600 p-2">
                                            Estudiante
                                        </th>
                                        <th className="border border-gray-600 p-2">
                                            Texto de entrega
                                        </th>
                                        <th className="border border-gray-600 p-2">
                                            Archivo
                                        </th>
                                        <th className="border border-gray-600 p-2">
                                            Fecha de entrega
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entregas.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="border border-gray-600 p-2 text-center"
                                            >
                                                No hay entregas todavía
                                            </td>
                                        </tr>
                                    ) : (
                                        entregas.map((e, index) => {
                                            const tipoArchivo = getTipoArchivo(
                                                e.archivo_entrega,
                                                e.extension_original_entrega
                                            );

                                            return (
                                                <tr key={index}>
                                                    <td className="border border-gray-600 p-2">
                                                        {e.estudiante_nombre}
                                                    </td>
                                                    <td className="border border-gray-600 p-2">
                                                        {e.texto_entrega || "-"}
                                                    </td>
                                                    <td className="border border-gray-600 p-2">
                                                        {e.archivo_entrega ? (
                                                            <div className="flex items-center gap-2">
                                                                <span>
                                                                    {getIconoTipo(
                                                                        tipoArchivo
                                                                    )}
                                                                </span>
                                                                <button
                                                                    onClick={() =>
                                                                        manejarArchivo(
                                                                            actividadSeleccionada.id,
                                                                            e.archivo_entrega,
                                                                            tipoArchivo,
                                                                            true,
                                                                            e.estudiante_id // ✅ ENVIAR estudiante_id
                                                                        )
                                                                    }
                                                                    className="text-blue-400 hover:text-blue-300"
                                                                >
                                                                    {getTextoBoton(
                                                                        tipoArchivo
                                                                    )}
                                                                </button>
                                                                <span className="text-xs text-gray-400">
                                                                    {e.nombre_archivo_original_entrega ||
                                                                        e.archivo_entrega
                                                                            .split(
                                                                                "/"
                                                                            )
                                                                            .pop()}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </td>
                                                    <td className="border border-gray-600 p-2">
                                                        {e.fecha_entrega || "-"}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                            <button
                                onClick={() => setVerEntregas(false)}
                                className="admin-btn mt-4"
                            >
                                ❌ Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AsignarActividad;
