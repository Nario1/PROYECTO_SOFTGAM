import React, { useEffect, useState } from "react";
import Config from "../Config";
import { Link, useNavigate } from "react-router-dom";
import "../styles/admin.css"; // <--- Aquí importas tu CSS

const UserAll = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [estadisticas, setEstadisticas] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const response = await Config.GetUserAll();
                if (response.data.success) {
                    setUsuarios(response.data.data.usuarios);
                    setEstadisticas(response.data.data.estadisticas);
                } else {
                    setError("No se pudieron cargar los usuarios.");
                }
            } catch (err) {
                console.error(err);
                setError("Error al obtener usuarios desde el servidor.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsuarios();
    }, []);

    if (loading)
        return <div className="text-center mt-5">Cargando usuarios...</div>;
    if (error)
        return <div className="text-center mt-5 text-danger">{error}</div>;

    return (
        <div className="admin-container">
            <div className="admin-content">
                {/* Header */}
                <div className="admin-header d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2>Gestión de Usuarios</h2>
                        <button
                            className="admin-btn mt-2"
                            onClick={() => navigate("/admin")}
                            style={{ padding: "5px 12px", fontSize: "0.85rem" }}
                        >
                            Volver al Panel
                        </button>
                    </div>
                    <Link to="/admin/usuarios/crear" className="admin-btn">
                        Registrar Nuevo Usuario
                    </Link>
                </div>

                {/* Estadísticas */}
                <div className="row mb-4 text-center">
                    {["total", "estudiantes", "docentes", "admins"].map(
                        (key) => (
                            <div className="col-md-3" key={key}>
                                <div className="admin-card p-3">
                                    <h5>
                                        {key.charAt(0).toUpperCase() +
                                            key.slice(1)}
                                    </h5>
                                    <p className="h4">
                                        {estadisticas[key] || 0}
                                    </p>
                                </div>
                            </div>
                        )
                    )}
                </div>

                {/* Tabla de usuarios con scroll */}
                <div
                    className="table-container"
                    style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                        borderRadius: "15px",
                        padding: "1rem",
                        background: "rgba(0,0,0,0.3)",
                    }}
                >
                    <table className="table table-striped table-hover shadow-sm">
                        <thead className="thead-dark">
                            <tr>
                                <th>ID</th>
                                <th>DNI</th>
                                <th>Nombre</th>
                                <th>Apellido</th>
                                <th>Rol</th>
                                <th>Creado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.id}</td>
                                    <td>{user.dni}</td>
                                    <td>{user.nombre}</td>
                                    <td>{user.apellido}</td>
                                    <td>
                                        <span
                                            className={`badge ${
                                                user.rol === "admin"
                                                    ? "bg-danger"
                                                    : user.rol === "docente"
                                                    ? "bg-info"
                                                    : "bg-success"
                                            }`}
                                        >
                                            {user.rol}
                                        </span>
                                    </td>
                                    <td>
                                        {new Date(
                                            user.created_at
                                        ).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <Link
                                            to={`/admin/usuarios/${user.id}`}
                                            className="admin-btn"
                                            style={{
                                                padding: "5px 12px",
                                                fontSize: "0.8rem",
                                            }}
                                        >
                                            Administrar
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserAll;
