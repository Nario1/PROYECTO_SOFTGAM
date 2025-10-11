import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";
import "../styles/docente.css"; // estilos generales
import SidebarDocente from "./SidebarDocente"; // 🔹 Sidebar añadido

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            archivo_material: e.target.files[0],
        }));
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
        <div className="admin-container">
            <SidebarDocente /> {/* 🔹 Sidebar fijo añadido */}
            <div
                className="admin-content flex flex-col gap-6 overflow-y-auto"
                style={{ maxHeight: "100vh" }}
            >
                <h2 className="text-2xl font-bold mb-4">
                    Actividades del Docente
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

                <button
                    onClick={() => {
                        setMostrarFormulario(!mostrarFormulario);
                        setActividadSeleccionada(null);
                        setVerEntregas(false);
                    }}
                    className="admin-btn"
                >
                    {mostrarFormulario ? "Cancelar" : "Agregar Nueva Actividad"}
                </button>

                {/* Formulario */}
                {mostrarFormulario && (
                    <div className="admin-card">
                        <h3 className="text-lg font-semibold mb-4">
                            {actividadSeleccionada
                                ? "Editar Actividad"
                                : "Nueva Actividad"}
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
                                    {loadingTematica ? "Creando..." : "Crear"}
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
                            {formData.archivo_existente &&
                                !formData.archivo_material && (
                                    <p>
                                        Archivo actual:{" "}
                                        <a
                                            href={`${window.location.origin}/storage/${formData.archivo_existente}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 underline"
                                        >
                                            Abrir / Descargar
                                        </a>
                                    </p>
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
                                Asignar a todos
                            </button>

                            <button type="submit" className="admin-btn w-full">
                                {actividadSeleccionada
                                    ? "Actualizar"
                                    : "Crear y Asignar"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Lista de actividades */}
                <div className="admin-card overflow-x-auto overflow-y-auto max-h-[60vh]">
                    <table className="min-w-full bg-black text-white">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="py-2 px-4 border border-gray-600">
                                    Título
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Temática
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Fecha límite
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Estudiantes asignados
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Material
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {actividades.map((act) => (
                                <tr
                                    key={act.id}
                                    className="hover:bg-gray-900 transition"
                                >
                                    <td className="py-2 px-4 border border-gray-600">
                                        {act.titulo}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-600">
                                        {act.tematica_nombre}
                                    </td>
                                    <td
                                        className={`py-2 px-4 border border-gray-600 ${
                                            new Date(act.fecha_limite) <
                                            new Date()
                                                ? "text-danger"
                                                : ""
                                        }`}
                                    >
                                        {act.fecha_limite || "-"}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-600">
                                        {act.estudiantes_count || 0}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-600">
                                        {act.archivo_material ? (
                                            <a
                                                href={`${window.location.origin}/storage/${act.archivo_material}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 underline"
                                            >
                                                Abrir / Descargar
                                            </a>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-600 flex gap-1 flex-wrap">
                                        <button
                                            onClick={() => editarActividad(act)}
                                            className="admin-btn text-sm"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() =>
                                                eliminarActividad(act.id)
                                            }
                                            className="admin-btn admin-btn-danger text-sm"
                                        >
                                            Eliminar
                                        </button>
                                        <button
                                            onClick={() => mostrarEntregas(act)}
                                            className="admin-btn text-sm"
                                        >
                                            Ver entregas
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modal de entregas */}
                {verEntregas && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-16 z-50 overflow-auto">
                        <div className="admin-card w-full max-w-3xl p-6 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
                            <h3 className="text-lg font-semibold mb-4">
                                Entregas de: {actividadSeleccionada.titulo}
                            </h3>
                            <table className="min-w-full bg-black text-white">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="py-2 px-4 border border-gray-600">
                                            Estudiante
                                        </th>
                                        <th className="py-2 px-4 border border-gray-600">
                                            Texto de entrega
                                        </th>
                                        <th className="py-2 px-4 border border-gray-600">
                                            Archivo
                                        </th>
                                        <th className="py-2 px-4 border border-gray-600">
                                            Fecha de entrega
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {entregas.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-2 px-4 border border-gray-600 text-center"
                                            >
                                                No hay entregas todavía
                                            </td>
                                        </tr>
                                    ) : (
                                        entregas.map((e) => (
                                            <tr key={e.id}>
                                                <td className="py-2 px-4 border border-gray-600">
                                                    {e.estudiante_nombre}
                                                </td>
                                                <td className="py-2 px-4 border border-gray-600">
                                                    {e.texto_entrega || "-"}
                                                </td>
                                                <td className="py-2 px-4 border border-gray-600">
                                                    {e.archivo_entrega ? (
                                                        <a
                                                            href={`/storage/${e.archivo_entrega}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-500 underline"
                                                        >
                                                            Descargar
                                                        </a>
                                                    ) : (
                                                        "-"
                                                    )}
                                                </td>
                                                <td className="py-2 px-4 border border-gray-600">
                                                    {e.fecha_entrega || "-"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AsignarActividad;
