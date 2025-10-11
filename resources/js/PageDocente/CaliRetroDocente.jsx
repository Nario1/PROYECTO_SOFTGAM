import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";

const CaliRetroDocente = () => {
    const { getUserId } = AuthUser();
    const docenteId = getUserId();

    const [actividades, setActividades] = useState([]);
    const [entregas, setEntregas] = useState([]);
    const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [mostrarEntregas, setMostrarEntregas] = useState(false);

    // Cargar actividades del docente
    useEffect(() => {
        (async function fetchActividades() {
            try {
                const res = await Config.GetActividadesDocente(docenteId);
                if (res.data.success) {
                    const acts = Array.isArray(res.data.data)
                        ? res.data.data
                        : res.data.data?.actividades || [];
                    setActividades(acts);
                } else {
                    setActividades([]);
                }
            } catch (err) {
                console.error(err);
                setMensaje({
                    tipo: "error",
                    texto: "Error al cargar actividades",
                });
                setActividades([]);
            }
        })();
    }, [docenteId]);

    // Mostrar entregas de una actividad
    const handleVerEntregas = async (actividad) => {
        try {
            const res = await Config.GetEntregasActividad(actividad.id);
            if (res.data.success) {
                const ents = Array.isArray(res.data.data)
                    ? res.data.data
                    : res.data.data?.entregas || [];
                setEntregas(ents);
                setActividadSeleccionada(actividad);
                setMostrarEntregas(true);
            } else {
                setEntregas([]);
            }
        } catch (err) {
            console.error(err);
            setMensaje({ tipo: "error", texto: "Error al obtener entregas" });
            setEntregas([]);
        }
    };

    // Guardar calificación y retroalimentación
    const handleGuardarRetro = async (ent) => {
        if (ent.calificacion === "" || ent.calificacion === null) {
            return setMensaje({
                tipo: "error",
                texto: "Ingresa una calificación",
            });
        }

        try {
            await Config.ActualizarRetroalimentacion(
                actividadSeleccionada.id,
                ent.estudiante_id,
                {
                    calificacion: ent.calificacion,
                    retroalimentacion: ent.retroalimentacion || "",
                }
            );

            setMensaje({
                tipo: "success",
                texto: "Retroalimentación guardada correctamente",
            });

            // Actualizar estado local
            setEntregas((prev) =>
                prev.map((e) => (e.id === ent.id ? { ...e, ...ent } : e))
            );

            // Limpiar mensaje después de 3s
            setTimeout(() => setMensaje(null), 3000);
        } catch (err) {
            console.error(err);
            setMensaje({
                tipo: "error",
                texto: "Error al guardar retroalimentación",
            });
        }
    };

    // Manejar cambios en calificación o retroalimentación
    const handleChange = (e, entregaId) => {
        const { name, value } = e.target;
        setEntregas((prev) =>
            prev.map((ent) =>
                ent.id === entregaId ? { ...ent, [name]: value } : ent
            )
        );
    };

    return (
        <div>
            <h2>Calificación y Retroalimentación</h2>

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

            {/* Lista de actividades */}
            <table
                border="1"
                cellPadding="8"
                style={{ width: "100%", marginBottom: "20px" }}
            >
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Temática</th>
                        <th>Fecha límite</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {actividades.length > 0 ? (
                        actividades.map((act) => (
                            <tr key={`act-${act.id}`}>
                                <td>{act.titulo}</td>
                                <td>{act.tematica_nombre || "-"}</td>
                                <td
                                    style={{
                                        color:
                                            new Date(act.fecha_limite) <
                                            new Date()
                                                ? "red"
                                                : "black",
                                    }}
                                >
                                    {act.fecha_limite || "-"}
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleVerEntregas(act)}
                                    >
                                        Ver Entregas
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4}>No hay actividades disponibles</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Lista de entregas */}
            {mostrarEntregas && (
                <div>
                    <h3>Entregas de: {actividadSeleccionada?.titulo}</h3>
                    <table border="1" cellPadding="8" style={{ width: "100%" }}>
                        <thead>
                            <tr>
                                <th>Estudiante</th>
                                <th>Texto de entrega</th>
                                <th>Archivo</th>
                                <th>Fecha de entrega</th>
                                <th>Calificación</th>
                                <th>Retroalimentación</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entregas.length > 0 ? (
                                entregas.map((ent) => (
                                    <tr key={`ent-${ent.id}`}>
                                        <td>{ent.estudiante_nombre}</td>
                                        <td>{ent.texto_entrega || "-"}</td>
                                        <td>
                                            {ent.archivo_entrega ? (
                                                <a
                                                    href={`/storage/${ent.archivo_entrega}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Descargar
                                                </a>
                                            ) : (
                                                "-"
                                            )}
                                        </td>
                                        <td>{ent.fecha_entrega || "-"}</td>
                                        <td>
                                            <input
                                                type="number"
                                                name="calificacion"
                                                value={ent.calificacion || ""}
                                                onChange={(e) =>
                                                    handleChange(e, ent.id)
                                                }
                                            />
                                        </td>
                                        <td>
                                            <textarea
                                                name="retroalimentacion"
                                                value={
                                                    ent.retroalimentacion || ""
                                                }
                                                onChange={(e) =>
                                                    handleChange(e, ent.id)
                                                }
                                            />
                                        </td>
                                        <td>
                                            <button
                                                onClick={() =>
                                                    handleGuardarRetro(ent)
                                                }
                                            >
                                                Guardar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7}>No hay entregas todavía</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CaliRetroDocente;
