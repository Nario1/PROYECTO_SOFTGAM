import React, { useState, useEffect } from "react";
import Config from "../Config";

const ReportesAdmin = () => {
    const [reportes, setReportes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchReportes = async () => {
            try {
                const response = await Config.ExportUso();
                setReportes(response.data.data);
            } catch (err) {
                console.error(err);
                setError("Error al cargar los reportes.");
            } finally {
                setLoading(false);
            }
        };

        fetchReportes();
    }, []);

    if (loading) return <div>Cargando reportes...</div>;
    if (error) return <div className="text-danger">{error}</div>;

    return (
        <div>
            <h2>Reportes de Uso</h2>
            <pre>{JSON.stringify(reportes, null, 2)}</pre>
        </div>
    );
};

export default ReportesAdmin;
