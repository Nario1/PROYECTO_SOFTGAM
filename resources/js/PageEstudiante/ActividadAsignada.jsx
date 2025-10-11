import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";
import SidebarEstudiante from "./SidebarEstudiante"; // Asegúrate que exista
import "../styles/docente.css"; // estilos generales

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
            {/* Sidebar */}
            <SidebarEstudiante />

            {/* Contenido principal */}
            <div
                className="admin-content flex-grow-1 overflow-y-auto p-6"
                style={{ maxHeight: "calc(100vh - 2rem)" }}
            >
                <h2 className="text-2xl font-bold text-white mb-4">
                    Mis Actividades Asignadas
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

                <div className="overflow-x-auto mb-6">
                    <table className="min-w-full bg-black text-white border border-gray-600">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="py-2 px-4 border border-gray-600">
                                    Título
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Temática
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Docente
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Fecha límite
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Material
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Estado entrega
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Archivo entregado
                                </th>
                                <th className="py-2 px-4 border border-gray-600">
                                    Acción
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {actividades.map((act) => (
                                <tr key={act.id} className="hover:bg-gray-900">
                                    <td className="py-2 px-4 border border-gray-600">
                                        {act.titulo}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-600">
                                        {act.tematica_nombre}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-600">
                                        {act.docente_nombre}
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
                                        {act.archivo_material ? (
                                            <a
                                                href={`${window.location.origin}/storage/${act.archivo_material}`}
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
                                        {act.texto_entrega ||
                                        act.archivo_entrega
                                            ? "Entregado"
                                            : "Pendiente"}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-600">
                                        {act.archivo_entrega ? (
                                            <a
                                                href={
                                                    act.archivo_url ||
                                                    `${window.location.origin}/storage/${act.archivo_entrega}`
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 underline"
                                            >
                                                {act.archivo_entrega}
                                            </a>
                                        ) : (
                                            "-"
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border border-gray-600">
                                        <button
                                            className="admin-btn text-sm"
                                            onClick={() =>
                                                seleccionarActividad(act)
                                            }
                                        >
                                            Entregar / Ver
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {actividadSeleccionada && (
                    <div className="admin-card p-6 mb-6">
                        <h3 className="text-lg font-semibold mb-4">
                            Enviar entrega: {actividadSeleccionada.titulo}
                        </h3>

                        {actividadSeleccionada.descripcion && (
                            <div className="p-3 bg-gray-800 rounded mb-4">
                                <strong>Descripción:</strong>
                                <p>{actividadSeleccionada.descripcion}</p>
                            </div>
                        )}

                        <form
                            onSubmit={enviarEntrega}
                            className="flex flex-col gap-4"
                        >
                            <div>
                                <label>Texto de entrega:</label>
                                <textarea
                                    value={textoEntrega}
                                    onChange={(e) =>
                                        setTextoEntrega(e.target.value)
                                    }
                                    rows={4}
                                    className="admin-textarea"
                                />
                            </div>
                            <div>
                                <label>Archivo (opcional):</label>
                                <input
                                    type="file"
                                    onChange={handleArchivoChange}
                                    className="admin-input"
                                />
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
                                            className="text-blue-500 underline"
                                        >
                                            {
                                                actividadSeleccionada.archivo_entrega
                                            }
                                        </a>
                                    </p>
                                )}
                            </div>
                            <button type="submit" className="admin-btn w-full">
                                Enviar Entrega
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActividadAsignada;
