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
    const [message, setMessage] = useState({ type: "", text: "" }); // <-- alertas dentro de la app

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

    const handleChange = (e) => {
        const { name, value } = e.target;

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

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (formError) return;

        try {
            const response = await Config.UpdateUser(id, formData);
            if (response.data.success) {
                setUser({
                    ...user,
                    ...formData,
                    updated_at: new Date().toISOString(),
                });
                setEditMode(false);
                setMessage({
                    type: "success",
                    text: "Usuario actualizado correctamente ✅",
                });

                // Ocultar mensaje después de 3s
                setTimeout(() => setMessage({ type: "", text: "" }), 3000);
            } else {
                setMessage({
                    type: "error",
                    text: "No se pudo actualizar el usuario ❌",
                });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: "error", text: "Error al actualizar usuario." });
        }
    };

    const handleDelete = async () => {
        if (window.confirm("¿Seguro que deseas eliminar este usuario?")) {
            try {
                await Config.DeleteUser(id);
                setMessage({ type: "success", text: "Usuario eliminado ✅" });
                setTimeout(() => navigate("/admin/usuarios"), 1500); // redirige después de 1.5s
            } catch (err) {
                console.error(err);
                setMessage({
                    type: "error",
                    text: "Error al eliminar el usuario.",
                });
            }
        }
    };

    if (loading) return <div className="mt-5 text-center">Cargando...</div>;
    if (error)
        return <div className="mt-5 text-danger text-center">{error}</div>;
    if (!user) return null;

    return (
        <div className="admin-container">
            <div
                className="admin-content"
                style={{
                    maxWidth: "800px",
                    margin: "0 auto",
                    padding: "3rem 2rem",
                }}
            >
                <h2 className="mb-4 text-center">Administrar Usuario</h2>

                {/* Mensaje dentro de la app */}
                {message.text && (
                    <div
                        className={`admin-alert mb-4 ${
                            message.type === "success"
                                ? "alert-success"
                                : "alert-error"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                {!editMode ? (
                    <>
                        <div
                            className="admin-card p-5 mb-4"
                            style={{ fontSize: "1.1rem" }}
                        >
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

                        <div className="d-flex justify-content-center mb-4">
                            <button
                                className="admin-btn me-2"
                                style={{
                                    fontSize: "1rem",
                                    padding: "12px 25px",
                                }}
                                onClick={() => setEditMode(true)}
                            >
                                Editar
                            </button>
                            <button
                                className="admin-btn bg-danger"
                                style={{
                                    fontSize: "1rem",
                                    padding: "12px 25px",
                                }}
                                onClick={handleDelete}
                            >
                                Eliminar
                            </button>
                        </div>
                    </>
                ) : (
                    <form
                        onSubmit={handleUpdate}
                        className="admin-card p-5 shadow-sm"
                        style={{ fontSize: "1.1rem" }}
                    >
                        {formError && (
                            <div className="admin-alert alert-error mb-3">
                                {formError}
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="form-label">DNI</label>
                            <input
                                type="text"
                                name="dni"
                                className="form-control"
                                value={formData.dni}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Nombre</label>
                            <input
                                type="text"
                                name="nombre"
                                className="form-control"
                                value={formData.nombre}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Apellido</label>
                            <input
                                type="text"
                                name="apellido"
                                className="form-control"
                                value={formData.apellido}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Rol</label>
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

                        <div className="d-flex justify-content-center">
                            <button
                                type="submit"
                                className="admin-btn me-2"
                                style={{
                                    fontSize: "1rem",
                                    padding: "12px 25px",
                                }}
                            >
                                Guardar
                            </button>
                            <button
                                type="button"
                                className="admin-btn bg-secondary"
                                style={{
                                    fontSize: "1rem",
                                    padding: "12px 25px",
                                }}
                                onClick={() => setEditMode(false)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CRUDAdmin;
