import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";

const CaliRetroEstudiante = () => {
    const { getUserId } = AuthUser();
    const estudianteId = getUserId();

    const [retroalimentaciones, setRetroalimentaciones] = useState([]);
    const [mensaje, setMensaje] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await Config.GetRetroalimentacionesPorEstudiante(
                    estudianteId
                );
                if (res.data.success) {
                    const datos = Array.isArray(res.data.data)
                        ? res.data.data
                        : [];
                    setRetroalimentaciones(datos);
                } else {
                    setRetroalimentaciones([]);
                }
            } catch (err) {
                console.error("❌ Error:", err);
                setMensaje({
                    tipo: "error",
                    texto: "Error al cargar calificaciones",
                });
            }
        })();
    }, [estudianteId]);

    return (
        <div className="container mt-4">
            <h2 className="mb-3">
                📘 Mis Calificaciones y Retroalimentaciones
            </h2>

            {mensaje && (
                <div
                    className={`alert ${
                        mensaje.tipo === "error"
                            ? "alert-danger"
                            : "alert-success"
                    }`}
                >
                    {mensaje.texto}
                </div>
            )}

            <table className="table table-bordered table-striped">
                <thead className="table-dark">
                    <tr>
                        <th>Actividad</th>
                        <th>Docente</th>
                        <th>Fecha Entrega</th>
                        <th>Calificación</th>
                        <th>Retroalimentación</th>
                    </tr>
                </thead>
                <tbody>
                    {retroalimentaciones.length > 0 ? (
                        retroalimentaciones.map((r) => (
                            <tr key={`retro-${r.id}`}>
                                <td>{r.actividad_titulo}</td>
                                <td>{r.docente_nombre}</td>
                                <td>{r.fecha_entrega || "-"}</td>
                                <td>
                                    {r.calificacion !== null
                                        ? r.calificacion
                                        : "⏳ Pendiente"}
                                </td>
                                <td>
                                    {r.retroalimentacion !== null
                                        ? r.retroalimentacion
                                        : "Sin comentarios"}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="text-center">
                                No tienes calificaciones aún.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CaliRetroEstudiante;
