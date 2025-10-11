// UserAll.jsx
import React, { useEffect, useState } from "react";
import Config from "../Config";
import { Link } from "react-router-dom";

const UserAll = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [estadisticas, setEstadisticas] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestión de Usuarios</h2>
                <Link to="/admin/usuarios/crear" className="btn btn-success">
                    Registrar Nuevo Usuario
                </Link>
            </div>

            {/* Estadísticas */}
            <div className="row mb-4 text-center">
                {["total", "estudiantes", "docentes", "admins"].map((key) => (
                    <div className="col-md-3" key={key}>
                        <div className="card bg-light shadow-sm">
                            <div className="card-body">
                                <h5>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </h5>
                                <p className="h4">{estadisticas[key] || 0}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabla de usuarios */}
            <table className="table table-striped table-hover shadow-sm">
                <thead className="thead-dark">
                    <tr>
                        <th>ID</th>
                        <th>DNI</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Rol</th>
                        <th>Total Jugadas</th>
                        <th>Última Actividad</th>
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
                            <td>{user.total_jugadas || 0}</td>
                            <td>{user.ultima_actividad || "Sin actividad"}</td>
                            <td>
                                {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td>
                                <Link
                                    to={`/admin/usuarios/${user.id}`}
                                    className="btn btn-sm btn-primary"
                                >
                                    Administrar
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserAll;
