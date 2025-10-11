// ReportesDiagnostico.jsx
import React, { useEffect, useState } from "react";
import API from "../Config";
import "../styles/docente.css";
import SidebarDocente from "./SidebarDocente"; // 👈 Sidebar añadido

const ReportesDiagnostico = () => {
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReportes();
    }, []);

    const fetchReportes = async () => {
        try {
            const res = await API.GetReportesDiagnostico();
            if (res.data?.data?.length > 0) setReportes(res.data.data);
            else setReportes([]);
        } catch (err) {
            console.error("Error al obtener reportes:", err);
            setError("Error al obtener reportes del servidor.");
        } finally {
            setLoading(false);
        }
    };

    if (loading)
        return (
            <p className="text-center mt-10 text-gray-400">
                Cargando reportes...
            </p>
        );

    if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

    if (!reportes.length)
        return (
            <p className="text-center mt-10 text-gray-400">
                No hay resultados de pruebas diagnósticas aún.
            </p>
        );

    return (
        <div className="admin-container d-flex" style={{ minHeight: "100vh" }}>
            {/* Sidebar fijo */}
            <SidebarDocente />

            {/* Contenido principal */}
            <div
                className="admin-content flex flex-col gap-6 p-6 overflow-y-auto flex-grow"
                style={{ maxHeight: "100vh" }}
            >
                <h1 className="text-3xl font-bold mb-8 text-center text-white">
                    📊 Reportes de Pruebas Diagnósticas
                </h1>

                <div className="admin-card p-4 overflow-auto max-h-[70vh]">
                    <table className="min-w-full bg-black text-white">
                        <thead className="bg-gray-900 sticky top-0">
                            <tr>
                                <th className="py-3 px-6 border border-gray-700 text-left">
                                    #
                                </th>
                                <th className="py-3 px-6 border border-gray-700 text-left">
                                    Estudiante
                                </th>
                                <th className="py-3 px-6 border border-gray-700 text-left">
                                    Prueba
                                </th>
                                <th className="py-3 px-6 border border-gray-700 text-center">
                                    Puntaje
                                </th>
                                <th className="py-3 px-6 border border-gray-700 text-center">
                                    Categoría
                                </th>
                                <th className="py-3 px-6 border border-gray-700 text-center">
                                    Fecha
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportes.map((r, index) => (
                                <tr
                                    key={r.id}
                                    className={
                                        index % 2 === 0
                                            ? "bg-gray-800"
                                            : "bg-gray-700"
                                    }
                                >
                                    <td className="py-3 px-6 border border-gray-600">
                                        {index + 1}
                                    </td>
                                    <td className="py-3 px-6 border border-gray-600">
                                        {r.estudiante?.nombre ?? "-"}
                                    </td>
                                    <td className="py-3 px-6 border border-gray-600">
                                        {r.prueba?.titulo ?? "-"}
                                    </td>
                                    <td className="py-3 px-6 border border-gray-600 text-center">
                                        {r.puntaje ?? 0}
                                    </td>
                                    <td className="py-3 px-6 border border-gray-600 text-center">
                                        {r.categoria ?? "-"}
                                    </td>
                                    <td className="py-3 px-6 border border-gray-600 text-center">
                                        {r.fecha
                                            ? new Date(
                                                  r.fecha
                                              ).toLocaleDateString()
                                            : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="text-right mt-4">
                    <button
                        onClick={() => window.history.back()}
                        className="admin-btn"
                    >
                        ← Volver al panel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportesDiagnostico;
