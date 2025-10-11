// CRUDAdmin.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Config from "../Config";

const CRUDAdmin = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        dni: "",
        nombre: "",
        apellido: "",
        rol: "",
    });
    const [formError, setFormError] = useState("");

    // Cargar usuario
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await Config.GetUserById(id);
                if (response.data.success) {
                    const u = response.data.data;
                    setUser(u);
                    setFormData({
                        dni: u.dni,
                        nombre: u.nombre,
                        apellido: u.apellido,
                        rol: u.rol,
                    });
                } else {
                    setError("No se pudo cargar el usuario.");
                }
            } catch (err) {
                console.error(err);
                setError("Error al obtener el usuario.");
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [id]);

    // Validación en tiempo real
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Validaciones
        if (name === "dni") {
            if (!/^\d*$/.test(value)) {
                setFormError("El DNI solo debe contener números.");
            } else if (value.length > 8) {
                setFormError("El DNI no puede tener más de 8 dígitos.");
            } else {
                setFormError("");
            }
        } else if (name === "nombre" || name === "apellido") {
            if (!/^[a-zA-ZáéíóúÁÉÍÓÚ\s]*$/.test(value)) {
                setFormError(
                    `${
                        name.charAt(0).toUpperCase() + name.slice(1)
                    } solo debe contener letras.`
                );
            } else {
                setFormError("");
            }
        }

        setFormData({ ...formData, [name]: value });
    };

    // Guardar cambios
    const handleUpdate = async (e) => {
        e.preventDefault();
        if (formError) return; // bloquea submit si hay error en tiempo real

        try {
            const response = await Config.UpdateUser(id, formData);
            if (response.data.success) {
                alert("Usuario actualizado correctamente ✅");
                setUser({
                    ...user,
                    ...formData,
                    updated_at: new Date().toISOString(),
                });
                setEditMode(false);
            } else {
                alert("No se pudo actualizar el usuario ❌");
            }
        } catch (err) {
            console.error(err);
            setError("Error al actualizar usuario.");
        }
    };

    // Eliminar
    const handleDelete = async () => {
        if (window.confirm("¿Seguro que deseas eliminar este usuario?")) {
            try {
                await Config.DeleteUser(id);
                alert("Usuario eliminado ✅");
                navigate("/admin/usuarios");
            } catch (err) {
                console.error(err);
                setError("Error al eliminar el usuario.");
            }
        }
    };

    if (loading) return <div className="mt-5 text-center">Cargando...</div>;
    if (error)
        return <div className="mt-5 text-danger text-center">{error}</div>;
    if (!user) return null;

    return (
        <div className="container mt-4">
            <h2>Administrar Usuario</h2>

            {!editMode ? (
                <>
                    <div className="card shadow-sm p-3">
                        <p>
                            <strong>ID:</strong> {user.id}
                        </p>
                        <p>
                            <strong>DNI:</strong> {user.dni}
                        </p>
                        <p>
                            <strong>Nombre:</strong> {user.nombre}
                        </p>
                        <p>
                            <strong>Apellido:</strong> {user.apellido}
                        </p>
                        <p>
                            <strong>Rol:</strong> {user.rol}
                        </p>
                        <p>
                            <strong>Creado:</strong>{" "}
                            {new Date(user.created_at).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="mt-3">
                        <button
                            className="btn btn-warning me-2"
                            onClick={() => setEditMode(true)}
                        >
                            Editar
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={handleDelete}
                        >
                            Eliminar
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <form
                        onSubmit={handleUpdate}
                        className="card p-3 shadow-sm"
                    >
                        {formError && (
                            <div className="text-danger mb-2">{formError}</div>
                        )}

                        <div className="mb-3">
                            <label>DNI</label>
                            <input
                                type="text"
                                name="dni"
                                className="form-control"
                                value={formData.dni}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label>Nombre</label>
                            <input
                                type="text"
                                name="nombre"
                                className="form-control"
                                value={formData.nombre}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label>Apellido</label>
                            <input
                                type="text"
                                name="apellido"
                                className="form-control"
                                value={formData.apellido}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label>Rol</label>
                            <select
                                name="rol"
                                className="form-control"
                                value={formData.rol}
                                onChange={handleChange}
                            >
                                <option value="estudiante">Estudiante</option>
                                <option value="docente">Docente</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-success me-2">
                            Guardar
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setEditMode(false)}
                        >
                            Cancelar
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default CRUDAdmin;
