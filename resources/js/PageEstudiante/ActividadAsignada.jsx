import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";

const ActividadAsignada = () => {
    const { getUserId } = AuthUser();
    const studentId = getUserId();

    const [actividades, setActividades] = useState([]);
    const [mensaje, setMensaje] = useState(null);
    const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
    const [textoEntrega, setTextoEntrega] = useState("");
    const [archivoEntrega, setArchivoEntrega] = useState(null);

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

    // Seleccionar actividad para entrega
    const seleccionarActividad = (actividad) => {
        setActividadSeleccionada(actividad);
        setTextoEntrega(actividad.texto_entrega || "");
        setArchivoEntrega(null);
        setMensaje(null);
    };

    // Manejar archivo de entrega
    const handleArchivoChange = (e) => {
        setArchivoEntrega(e.target.files[0]);
    };

    // Enviar entrega
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

                // Actualizar actividad localmente
                const updatedActividades = actividades.map((act) =>
                    act.id === actividadSeleccionada.id
                        ? {
                              ...act,
                              texto_entrega: textoEntrega,
                              archivo_entrega:
                                  archivoEntrega?.name || act.archivo_entrega,
                              archivo_url:
                                  res.data.data.archivo_url || act.archivo_url,
                              asignacion_id: res.data.data.asignacion_id, // importante para descarga
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
        <div className="actividad-asignada">
            <h2>Mis Actividades Asignadas</h2>

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

            <table
                border="1"
                cellPadding="8"
                style={{ width: "100%", marginTop: "20px" }}
            >
                <thead>
                    <tr>
                        <th>Título</th>
                        <th>Temática</th>
                        <th>Docente</th>
                        <th>Fecha límite</th>
                        <th>Material</th>
                        <th>Estado entrega</th>
                        <th>Archivo entregado</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {actividades.map((act) => (
                        <tr key={act.id}>
                            <td>{act.titulo}</td>
                            <td>{act.tematica_nombre}</td>
                            <td>{act.docente_nombre}</td>
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
                            <td>
                                {act.archivo_material ? (
                                    <a
                                        href={`${window.location.origin}/storage/${act.archivo_material}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Descargar
                                    </a>
                                ) : (
                                    "-"
                                )}
                            </td>
                            <td>
                                {act.texto_entrega || act.archivo_entrega
                                    ? "Entregado"
                                    : "Pendiente"}
                            </td>
                            <td>
                                {act.archivo_entrega ? (
                                    <a
                                        href={
                                            act.archivo_url ||
                                            `${window.location.origin}/storage/${act.archivo_entrega}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {act.archivo_entrega}
                                    </a>
                                ) : (
                                    "-"
                                )}
                            </td>
                            <td>
                                <button
                                    onClick={() => seleccionarActividad(act)}
                                >
                                    Entregar / Ver
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {actividadSeleccionada && (
                <div
                    style={{
                        marginTop: "30px",
                        border: "1px solid #ccc",
                        padding: "20px",
                    }}
                >
                    <h3>Enviar entrega: {actividadSeleccionada.titulo}</h3>

                    {actividadSeleccionada.descripcion && (
                        <div
                            style={{
                                marginBottom: "15px",
                                padding: "10px",
                                background: "#f9f9f9",
                                borderRadius: "5px",
                            }}
                        >
                            <strong>Descripción:</strong>
                            <p>{actividadSeleccionada.descripcion}</p>
                        </div>
                    )}

                    <form onSubmit={enviarEntrega}>
                        <div style={{ marginBottom: "10px" }}>
                            <label>Texto de entrega:</label>
                            <textarea
                                value={textoEntrega}
                                onChange={(e) =>
                                    setTextoEntrega(e.target.value)
                                }
                                rows={4}
                                style={{ width: "100%" }}
                            />
                        </div>
                        <div style={{ marginBottom: "10px" }}>
                            <label>Archivo (opcional):</label>
                            <input type="file" onChange={handleArchivoChange} />
                            {actividadSeleccionada.archivo_entrega && (
                                <p>
                                    Archivo entregado previamente:{" "}
                                    <a
                                        href={
                                            actividadSeleccionada.archivo_url ||
                                            `${window.location.origin}/storage/${actividadSeleccionada.archivo_entrega}`
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {actividadSeleccionada.archivo_entrega}
                                    </a>
                                </p>
                            )}
                        </div>
                        <button type="submit">Enviar Entrega</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ActividadAsignada;
