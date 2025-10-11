import React, { useEffect, useState } from "react";
import AuthUser from "../pageauth/AuthUser";
import Config from "../Config";

const AsistenciaEstudiante = () => {
    const { getUserId } = AuthUser();
    const studentId = getUserId();

    const [asistencias, setAsistencias] = useState([]);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        const fetchAsistencias = async () => {
            if (!studentId) {
                setMensaje("No se encontró el ID del estudiante.");
                return;
            }

            try {
                const res = await Config.GetAsistenciaByEstudiante(studentId);

                // 🧠 Validamos que res.data.data sea un array
                if (res.data && Array.isArray(res.data.data)) {
                    setAsistencias(res.data.data);
                    setMensaje("");
                } else if (Array.isArray(res.data)) {
                    setAsistencias(res.data);
                    setMensaje("");
                } else {
                    console.warn(
                        "⚠️ Respuesta inesperada del servidor:",
                        res.data
                    );
                    setMensaje("No hay asistencias registradas.");
                }
            } catch (error) {
                console.error("❌ Error al obtener asistencias:", error);
                setMensaje("Error al cargar asistencias.");
            }
        };

        fetchAsistencias();
    }, [studentId]);

    return (
        <div className="asistencia-estudiante" style={{ padding: "20px" }}>
            <h2>📋 Mi Asistencia</h2>

            {mensaje && (
                <p style={{ color: "red", fontWeight: "bold" }}>{mensaje}</p>
            )}

            {!mensaje && asistencias.length === 0 && (
                <p>No tienes registros de asistencia.</p>
            )}

            {asistencias.length > 0 && (
                <table
                    border="1"
                    cellPadding="8"
                    style={{
                        width: "100%",
                        marginTop: "20px",
                        borderCollapse: "collapse",
                        textAlign: "center",
                    }}
                >
                    <thead style={{ background: "#f2f2f2" }}>
                        <tr>
                            <th>Fecha</th>
                            <th>Docente</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {asistencias.map((asistencia) => (
                            <tr key={asistencia.id}>
                                <td>{asistencia.fecha}</td>
                                <td>{asistencia.docente_nombre || "—"}</td>
                                <td
                                    style={{
                                        color:
                                            asistencia.estado === "Presente"
                                                ? "green"
                                                : "red",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {asistencia.estado}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AsistenciaEstudiante;
