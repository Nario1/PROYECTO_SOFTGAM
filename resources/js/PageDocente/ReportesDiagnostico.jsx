// ReportesDiagnostico.jsx
import React, { useEffect, useState } from "react";
import API from "../Config";

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

            if (res.data && res.data.data && res.data.data.length > 0) {
                setReportes(res.data.data);
            } else {
                setReportes([]);
            }
        } catch (err) {
            console.error("Error al obtener reportes:", err);
            setError("Error al obtener reportes del servidor.");
        } finally {
            setLoading(false);
        }
    };

    if (loading)
        return (
            <p className="text-center mt-10 text-gray-600">
                Cargando reportes...
            </p>
        );

    if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

    if (!reportes.length)
        return (
            <p className="text-center mt-10 text-gray-600">
                No hay resultados de pruebas diagnósticas aún.
            </p>
        );

    return (
        <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
                📊 Reportes de Pruebas Diagnósticas
            </h1>

            <div className="overflow-x-auto border rounded shadow">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="py-3 px-6 border text-left">#</th>
                            <th className="py-3 px-6 border text-left">
                                Estudiante
                            </th>
                            <th className="py-3 px-6 border text-left">
                                Prueba
                            </th>
                            <th className="py-3 px-6 border text-center">
                                Puntaje
                            </th>
                            <th className="py-3 px-6 border text-center">
                                Categoría
                            </th>
                            <th className="py-3 px-6 border text-center">
                                Fecha
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportes.map((r, index) => (
                            <tr
                                key={r.id}
                                className={
                                    index % 2 === 0 ? "bg-gray-50" : "bg-white"
                                }
                            >
                                <td className="py-3 px-6 border">
                                    {index + 1}
                                </td>
                                <td className="py-3 px-6 border">
                                    {r.estudiante?.nombre ?? "-"}
                                </td>
                                <td className="py-3 px-6 border">
                                    {r.prueba?.titulo ?? "-"}
                                </td>
                                <td className="py-3 px-6 border text-center">
                                    {r.puntaje ?? 0}{" "}
                                    {/* Muestra los aciertos reales */}
                                </td>
                                <td className="py-3 px-6 border text-center">
                                    {r.categoria ?? "-"}
                                </td>
                                <td className="py-3 px-6 border text-center">
                                    {r.fecha
                                        ? new Date(r.fecha).toLocaleDateString()
                                        : "-"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportesDiagnostico;
