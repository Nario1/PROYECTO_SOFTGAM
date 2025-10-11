import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";

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

    // Cargar temáticas, estudiantes y actividades del docente
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

    // Manejar inputs
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

    // Crear o actualizar actividad
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
            tematica_id: actividad.tematica_id?.toString() || "", // ✅ Convertir a string
            nueva_tematica: "",
            fecha_limite: actividad.fecha_limite,
            archivo_material: null,
            archivo_existente: actividad.archivo_material || null,
            estudiantes_ids: actividad.estudiantes_ids?.map(String) || [], // también convertir IDs de estudiantes a string
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

    const descargarArchivo = async (actividad) => {
        if (!actividad.archivo_material) return;
        try {
            const res = await Config.DescargarArchivo(actividad.id);
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
                "download",
                actividad.archivo_material.split("/").pop()
            );
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Error al descargar archivo:", err);
            alert("Error al descargar archivo");
        }
    };

    return (
        <div className="asignar-actividad">
            <h2>Actividades del Docente</h2>

            {mensaje && (
                <p
                    style={{
                        color: mensaje.tipo === "error" ? "red" : "green",
                        fontWeight: "bold",
                    }}
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
            >
                {mostrarFormulario ? "Cancelar" : "Agregar Nueva Actividad"}
            </button>

            {/* Formulario */}
            {mostrarFormulario && (
                <div
                    style={{
                        marginTop: "20px",
                        border: "1px solid #ccc",
                        padding: "20px",
                    }}
                >
                    <h3>
                        {actividadSeleccionada
                            ? "Editar Actividad"
                            : "Nueva Actividad"}
                    </h3>
                    <form onSubmit={handleSubmit}>
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
                            ></textarea>
                        </div>
                        <div>
                            <label>Temática:</label>
                            <select
                                name="tematica_id"
                                value={formData.tematica_id} // ya es string desde editarActividad
                                onChange={handleChange}
                            >
                                <option value="">
                                    -- Seleccionar Temática --
                                </option>
                                {tematicas.map((t) => (
                                    <option key={t.id} value={t.id.toString()}>
                                        {" "}
                                        {/* ✅ Convertir value a string */}
                                        {t.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label>Crear nueva temática:</label>
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
                        <div>
                            <label>Fecha límite:</label>
                            <input
                                type="date"
                                name="fecha_limite"
                                value={formData.fecha_limite}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label>Archivo (opcional):</label>
                            <input type="file" onChange={handleFileChange} />
                            {formData.archivo_existente &&
                                !formData.archivo_material && (
                                    <p>
                                        Archivo actual:{" "}
                                        <a
                                            href={`${window.location.origin}/storage/${formData.archivo_existente}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Abrir / Descargar
                                        </a>
                                    </p>
                                )}
                        </div>

                        <div>
                            <label>Asignar a estudiantes:</label>
                            <select
                                multiple
                                value={formData.estudiantes_ids}
                                onChange={handleSelectEstudiante}
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
                            <br />
                            <button type="button" onClick={handleAsignarTodos}>
                                Asignar a todos
                            </button>
                        </div>
                        <button type="submit">
                            {actividadSeleccionada
                                ? "Actualizar"
                                : "Crear y Asignar"}
                        </button>
                    </form>
                </div>
            )}

            {/* Lista de actividades */}
            <table
                border="1"
                cellPadding="8"
                style={{ width: "100%", marginTop: "20px" }}
            >
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Temática</th>
                        <th>Fecha límite</th>
                        <th>Estudiantes asignados</th>
                        <th>Material</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {actividades.map((act) => (
                        <tr key={act.id}>
                            <td>{act.titulo}</td>
                            <td>{act.tematica_nombre}</td>
                            <td
                                style={{
                                    color:
                                        new Date(act.fecha_limite) < new Date()
                                            ? "red"
                                            : "black",
                                }}
                            >
                                {act.fecha_limite || "-"}
                            </td>
                            <td>{act.estudiantes_count || 0}</td>
                            <td>
                                {act.archivo_material ? (
                                    <a
                                        href={`${window.location.origin}/storage/${act.archivo_material}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Abrir / Descargar
                                    </a>
                                ) : (
                                    "-"
                                )}
                            </td>
                            <td>
                                <button onClick={() => editarActividad(act)}>
                                    Editar
                                </button>
                                <button
                                    onClick={() => eliminarActividad(act.id)}
                                >
                                    Eliminar
                                </button>
                                <button onClick={() => mostrarEntregas(act)}>
                                    Ver entregas
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Ver entregas */}
            {verEntregas && (
                <div
                    style={{
                        marginTop: "30px",
                        border: "1px solid #ccc",
                        padding: "20px",
                    }}
                >
                    <h3>Entregas de: {actividadSeleccionada.titulo}</h3>
                    <table border="1" cellPadding="8" style={{ width: "100%" }}>
                        <thead>
                            <tr>
                                <th>Estudiante</th>
                                <th>Texto de entrega</th>
                                <th>Archivo</th>
                                <th>Fecha de entrega</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entregas.length === 0 ? (
                                <tr>
                                    <td colSpan={4}>No hay entregas todavía</td>
                                </tr>
                            ) : (
                                entregas.map((e) => (
                                    <tr key={e.id}>
                                        <td>{e.estudiante_nombre}</td>
                                        <td>{e.texto_entrega || "-"}</td>
                                        <td>
                                            {e.archivo_entrega ? (
                                                <a
                                                    href={`/storage/${e.archivo_entrega}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Descargar
                                                </a>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td>{e.fecha_entrega || "-"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AsignarActividad;
