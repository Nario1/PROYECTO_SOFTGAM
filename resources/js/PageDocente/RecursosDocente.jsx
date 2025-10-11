import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";

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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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
            const res = await Config.CambiarVisibilidadRecurso(
                id,
                visible ? 1 : 0
            );
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
        <div className="container mt-4">
            <h2>📘 Recursos del Docente</h2>

            {mensaje && (
                <p
                    style={{
                        color:
                            mensaje.tipo === "error"
                                ? "red"
                                : mensaje.tipo === "success"
                                ? "green"
                                : "blue",
                        fontWeight: "bold",
                    }}
                >
                    {mensaje.texto}
                </p>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} style={{ marginBottom: "25px" }}>
                <div>
                    <label>Título:</label>
                    <input
                        type="text"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Descripción:</label>
                    <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label>Temática:</label>
                    <select
                        name="tematica_id"
                        value={formData.tematica_id}
                        onChange={handleChange}
                    >
                        <option value="">-- Seleccionar Temática --</option>
                        {tematicas.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Nueva temática:</label>
                    <input
                        type="text"
                        name="nueva_tematica"
                        value={formData.nueva_tematica}
                        onChange={handleChange}
                        placeholder="Escribe nueva temática"
                    />
                    <button
                        type="button"
                        onClick={handleCrearTematica}
                        disabled={loadingTematica}
                    >
                        {loadingTematica ? "Creando..." : "Crear"}
                    </button>
                </div>

                {formData.tipo === "enlace" ? (
                    <div>
                        <label>Enlace:</label>
                        <input
                            type="url"
                            name="enlace"
                            value={formData.enlace}
                            onChange={handleChange}
                            placeholder="https://..."
                        />
                    </div>
                ) : (
                    <div>
                        <label>Archivo:</label>
                        <input type="file" onChange={handleFileChange} />
                    </div>
                )}

                {preview && formData.tipo === "imagen" && (
                    <div>
                        <p>Vista previa:</p>
                        <img
                            src={preview}
                            alt="preview"
                            style={{ maxWidth: "200px", borderRadius: "8px" }}
                        />
                    </div>
                )}

                <button type="submit">Subir Recurso</button>
            </form>

            {/* Tabla */}
            <h3>Mis Recursos</h3>
            {recursos.length === 0 ? (
                <p>No has subido recursos todavía.</p>
            ) : (
                <table border="1" cellPadding="8" width="100%">
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Temática</th>
                            <th>Tipo</th>
                            <th>Archivo / Enlace</th>
                            <th>Visible</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recursos.map((r) => (
                            <tr key={r.id}>
                                <td>{r.titulo}</td>
                                <td>{r.tematica?.nombre || "-"}</td>
                                <td>{r.tipo}</td>
                                <td>
                                    {r.tipo === "enlace" ? (
                                        <a
                                            href={r.url_recurso}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Ver enlace
                                        </a>
                                    ) : r.archivo_path ? (
                                        <a
                                            href={`${window.location.origin}/storage/${r.archivo_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Ver archivo
                                        </a>
                                    ) : (
                                        "-"
                                    )}
                                </td>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={
                                            r.visible_estudiantes === 1 ||
                                            r.visible_estudiantes === true
                                        }
                                        onChange={(e) =>
                                            cambiarVisibilidad(
                                                r.id,
                                                e.target.checked
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <button
                                        onClick={() => eliminarRecurso(r.id)}
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default RecursosDocente;
