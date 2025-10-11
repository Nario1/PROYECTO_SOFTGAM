import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "../pageauth/AuthUser";

const RecursosEstudiante = () => {
    const { getUserId } = AuthUser();
    const studentId = getUserId();

    const [recursos, setRecursos] = useState([]);
    const [mensaje, setMensaje] = useState(null);
    const [loading, setLoading] = useState(false);

    // Cargar recursos visibles para el estudiante
    useEffect(() => {
        const fetchRecursos = async () => {
            setLoading(true);
            try {
                const res = await Config.GetRecursosParaEstudiantes(); // ruta estudiante
                if (res.data?.data) {
                    setRecursos(res.data.data);
                } else {
                    setRecursos([]);
                }
            } catch (err) {
                console.error("❌ Error al cargar recursos:", err);
                setMensaje({
                    tipo: "error",
                    texto: "Error al cargar recursos",
                });
            } finally {
                setLoading(false);
            }
        };
        fetchRecursos();
    }, [studentId]);

    return (
        <div className="recursos-estudiante">
            <h2>📚 Recursos Disponibles</h2>

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

            {loading ? (
                <p>Cargando recursos...</p>
            ) : recursos.length === 0 ? (
                <p>No hay recursos disponibles.</p>
            ) : (
                <table border="1" cellPadding="8" style={{ width: "100%" }}>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Descripción</th>
                            <th>Docente</th>
                            <th>Temática</th>
                            <th>Fecha Publicación</th>
                            <th>Archivo / Enlace</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recursos.map((r) => (
                            <tr key={r.id}>
                                <td>{r.titulo}</td>
                                <td>{r.descripcion || "-"}</td>
                                <td>
                                    {r.docente
                                        ? `${r.docente.nombre} ${r.docente.apellido}`
                                        : "-"}
                                </td>
                                <td>{r.tematica?.nombre || "-"}</td>
                                <td>{r.fecha_publicacion || "-"}</td>
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
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default RecursosEstudiante;
