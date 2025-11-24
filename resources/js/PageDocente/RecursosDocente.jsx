import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";
import SidebarDocente from "./SidebarDocente";
import "../styles/docente.css";

const RecursosDocente = () => {
    const { getUserId } = AuthUser();
    const docenteId = getUserId();

    const [tematicas, setTematicas] = useState([]);
    const [recursos, setRecursos] = useState([]);
    const [mensaje, setMensaje] = useState(null);
    const [loadingTematica, setLoadingTematica] = useState(false);
    const [preview, setPreview] = useState(null);

    const [formData, setFormData] = useState({
        titulo: "",
        descripcion: "",
        tematica_id: "",
        nueva_tematica: "",
        tipo: "",
        archivo: null,
        enlace: "",
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!docenteId) return;
            try {
                const resTematicas = await Config.GetTematicas();
                setTematicas(resTematicas.data?.data?.tematicas || []);
                const resRecursos = await Config.GetRecursosDocente(docenteId);
                setRecursos(resRecursos.data?.data || []);
            } catch (err) {
                console.error(err);
                setMensaje({ tipo: "error", texto: "Error al cargar datos" });
            }
        };
        fetchData();
    }, [docenteId]);

    const handleChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData({ ...formData, archivo: file });

        if (file) {
            const reader = new FileReader();
            reader.onload = () => setPreview(reader.result);
            reader.readAsDataURL(file);

            const ext = file.name.split(".").pop().toLowerCase();
            let tipo = "otros";
            if (["pdf", "doc", "docx", "txt"].includes(ext)) tipo = "documento";
            else if (["mp4", "mov", "avi", "mkv"].includes(ext)) tipo = "video";
            else if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext))
                tipo = "imagen";
            setFormData((prev) => ({ ...prev, tipo }));
        } else {
            setPreview(null);
            setFormData((prev) => ({ ...prev, tipo: "" }));
        }
    };

    const handleCrearTematica = async () => {
        const nombre = formData.nueva_tematica.trim();
        if (!nombre) return;
        setLoadingTematica(true);
        setMensaje({ tipo: "info", texto: "Creando temática..." });
        try {
            const res = await Config.CrearTematica({ nombre });
            if (res.data?.success) {
                const nueva = res.data.data;
                const resTemas = await Config.GetTematicas();
                setTematicas(resTemas.data?.data?.tematicas || []);
                setFormData({
                    ...formData,
                    tematica_id: nueva.id,
                    nueva_tematica: "",
                });
                setMensaje({
                    tipo: "success",
                    texto: "Temática creada y seleccionada",
                });
            } else {
                setMensaje({
                    tipo: "error",
                    texto: res.data.message || "Error al crear temática",
                });
            }
        } catch (err) {
            console.error(err);
            setMensaje({ tipo: "error", texto: "Error al crear temática" });
        } finally {
            setLoadingTematica(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (
            !formData.tematica_id ||
            !formData.titulo.trim() ||
            (!formData.tipo && !formData.enlace)
        ) {
            setMensaje({
                tipo: "error",
                texto: "Complete todos los campos obligatorios",
            });
            return;
        }

        try {
            const form = new FormData();
            form.append("titulo", formData.titulo);
            form.append("descripcion", formData.descripcion);
            form.append("tematica_id", formData.tematica_id);
            form.append("tipo", formData.tipo);
            form.append("docente_id", docenteId);
            form.append("url_recurso", formData.enlace || "");
            if (formData.archivo) form.append("archivo", formData.archivo);

            const res = await Config.AddRecurso(form);
            if (res.data?.success) {
                setMensaje({
                    tipo: "success",
                    texto: "Recurso subido correctamente",
                });
                setFormData({
                    titulo: "",
                    descripcion: "",
                    tematica_id: "",
                    nueva_tematica: "",
                    tipo: "",
                    archivo: null,
                    enlace: "",
                });
                setPreview(null);

                const resRecursos = await Config.GetRecursosDocente(docenteId);
                setRecursos(resRecursos.data?.data || []);
            } else {
                setMensaje({
                    tipo: "error",
                    texto: res.data.message || "Error al subir recurso",
                });
            }
        } catch (err) {
            console.error(err);
            setMensaje({ tipo: "error", texto: "Error al subir recurso" });
        }
    };

    // 🔹 FUNCIÓN PARA ABRIR ARCHIVO EN NUEVA PESTAÑA
    const abrirArchivo = (archivoPath, tipo) => {
        if (!archivoPath) {
            setMensaje({ tipo: "error", texto: "No hay archivo para abrir" });
            return;
        }

        // Abrir en nueva pestaña
        window.open(archivoPath, "_blank", "noopener,noreferrer");

        setMensaje({
            tipo: "success",
            texto: `Archivo ${tipo} abierto en nueva pestaña`,
        });
    };

    const eliminarRecurso = async (id) => {
        if (!window.confirm("¿Deseas eliminar este recurso?")) return;
        try {
            const res = await Config.EliminarRecurso(id);
            if (res.data?.success) {
                setRecursos(recursos.filter((r) => r.id !== id));
                setMensaje({
                    tipo: "success",
                    texto: "Recurso eliminado correctamente",
                });
            } else {
                setMensaje({
                    tipo: "error",
                    texto: res.data.message || "Error al eliminar recurso",
                });
            }
        } catch (err) {
            console.error(err);
            setMensaje({ tipo: "error", texto: "Error al eliminar recurso" });
        }
    };

    const cambiarVisibilidad = async (id, visible) => {
        try {
            const res = await Config.CambiarVisibilidadRecurso(id, {
                visible: visible ? 1 : 0,
            });

            if (res.data.success) {
                setRecursos((prev) =>
                    prev.map((r) =>
                        r.id === id
                            ? { ...r, visible_estudiantes: visible ? 1 : 0 }
                            : r
                    )
                );
                setMensaje({
                    tipo: "success",
                    texto: "Visibilidad actualizada correctamente",
                });
            }
        } catch (err) {
            console.error(err);
            setMensaje({
                tipo: "error",
                texto: "Error al actualizar visibilidad",
            });
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
                    📘 Recursos del Docente
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

                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                        type="text"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        placeholder="Título"
                        required
                        className="admin-input"
                    />
                    <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        placeholder="Descripción"
                        className="admin-input"
                    />
                    <select
                        name="tematica_id"
                        value={formData.tematica_id}
                        onChange={handleChange}
                        className="admin-input"
                    >
                        <option value="">-- Seleccionar Temática --</option>
                        {tematicas.map((t) => (
                            <option key={t.id} value={t.id}>
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
                            placeholder="Nueva temática"
                            className="admin-input flex-1"
                        />
                        <button
                            type="button"
                            onClick={handleCrearTematica}
                            disabled={loadingTematica}
                            className="admin-btn"
                        >
                            {loadingTematica ? "Creando..." : "Crear"}
                        </button>
                    </div>

                    {formData.tipo === "enlace" ? (
                        <input
                            type="url"
                            name="enlace"
                            value={formData.enlace}
                            onChange={handleChange}
                            placeholder="Enlace"
                            className="admin-input"
                        />
                    ) : (
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="admin-input"
                        />
                    )}

                    {preview && formData.tipo === "imagen" && (
                        <img
                            src={preview}
                            alt="preview"
                            className="max-w-xs rounded"
                        />
                    )}

                    <button type="submit" className="admin-btn w-full">
                        Subir Recurso
                    </button>
                </form>

                <h3 className="mt-6 mb-2">Mis Recursos</h3>
                {recursos.length === 0 ? (
                    <p>No has subido recursos todavía.</p>
                ) : (
                    <div
                        className="overflow-y-auto border border-gray-600 rounded"
                        style={{
                            maxHeight: "400px",
                            marginBottom: "2rem",
                            paddingBottom: "1rem",
                        }}
                    >
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
                                        Tipo
                                    </th>
                                    <th className="border border-gray-600 p-2">
                                        Archivo / Enlace
                                    </th>
                                    <th className="border border-gray-600 p-2">
                                        Visible
                                    </th>
                                    <th className="border border-gray-600 p-2">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {recursos.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="hover:bg-gray-700"
                                    >
                                        <td className="border border-gray-600 p-2">
                                            {r.titulo}
                                        </td>
                                        <td className="border border-gray-600 p-2">
                                            {r.tematica?.nombre || "-"}
                                        </td>
                                        <td className="border border-gray-600 p-2">
                                            {r.tipo}
                                        </td>
                                        <td className="border border-gray-600 p-2">
                                            {r.tipo === "enlace" ? (
                                                <a
                                                    href={r.url_recurso}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300"
                                                >
                                                    🔗 Ver enlace
                                                </a>
                                            ) : r.archivo_path ? (
                                                <div className="flex flex-col gap-1">
                                                    {/* 🔥 BOTÓN PARA ABRIR EN NUEVA PESTAÑA */}
                                                    <button
                                                        onClick={() =>
                                                            abrirArchivo(
                                                                r.archivo_path,
                                                                r.tipo
                                                            )
                                                        }
                                                        className="text-blue-400 hover:text-blue-300 text-left"
                                                    >
                                                        📂 Abrir archivo
                                                    </button>
                                                    <span className="text-xs text-gray-400">
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
                                        <td className="border border-gray-600 p-2 text-center">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    r.visible_estudiantes ===
                                                        1 ||
                                                    r.visible_estudiantes ===
                                                        true
                                                }
                                                onChange={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    cambiarVisibilidad(
                                                        r.id,
                                                        e.target.checked
                                                    );
                                                }}
                                            />
                                        </td>
                                        <td className="border border-gray-600 p-2 text-center">
                                            <button
                                                onClick={() =>
                                                    eliminarRecurso(r.id)
                                                }
                                                className="admin-btn admin-btn-danger px-2 py-1"
                                            >
                                                Eliminar
                                            </button>
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

export default RecursosDocente;
