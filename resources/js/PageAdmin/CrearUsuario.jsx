import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Config from "../Config";
import "../styles/admin.css"; // estilos del panel

const CrearUsuario = () => {
    const navigate = useNavigate();
    const [dni, setDni] = useState("");
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [password, setPassword] = useState("");
    const [rol, setRol] = useState("estudiante");
    const [error, setError] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" }); // <-- alerta dentro de la app

    const handleDniChange = (e) => {
        const valor = e.target.value;
        if (!/^\d*$/.test(valor)) {
            setError("El DNI solo debe contener números.");
            return;
        }
        if (valor.length > 8) {
            setError("El DNI no puede tener más de 8 dígitos.");
            return;
        }
        setError("");
        setDni(valor);
    };

    const handleNombreChange = (e) => {
        const valor = e.target.value;
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚ\s]*$/.test(valor)) {
            setError("El nombre solo debe contener letras.");
            return;
        }
        setError("");
        setNombre(valor);
    };

    const handleApellidoChange = (e) => {
        const valor = e.target.value;
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚ\s]*$/.test(valor)) {
            setError("El apellido solo debe contener letras.");
            return;
        }
        setError("");
        setApellido(valor);
    };

    const handlePasswordChange = (e) => {
        const valor = e.target.value;
        if (valor.length > 0 && valor.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
        } else {
            setError("");
        }
        setPassword(valor);
    };

    const submitCrearUsuario = async (e) => {
        e.preventDefault();
        if (error) return;

        try {
            const response = await Config.GetRegister({
                dni,
                nombre,
                apellido,
                password,
                password_confirmation: password,
                rol,
            });

            if (response.data.success) {
                // Mostrar mensaje dentro de la app
                setMessage({
                    type: "success",
                    text: "Usuario creado correctamente ✅",
                });

                // Desaparecer después de 3 segundos y redirigir
                setTimeout(() => {
                    setMessage({ type: "", text: "" });
                    navigate("/admin/usuarios");
                }, 3000);
            } else {
                setError(
                    response.data.message || "No se pudo crear el usuario."
                );
            }
        } catch (err) {
            console.error(err);
            setError("Error al crear el usuario.");
        }
    };

    return (
        <div
            className="admin-container"
            style={{ justifyContent: "center", alignItems: "center" }}
        >
            <div
                className="admin-content"
                style={{ maxWidth: "500px", width: "100%" }}
            >
                <h2 className="text-center mb-4">Registrar Nuevo Usuario</h2>

                {/* Mensaje dentro de la app */}
                {message.text && (
                    <div
                        className={`admin-alert mb-3 ${
                            message.type === "success"
                                ? "alert-success"
                                : "alert-error"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                {error && (
                    <div className="admin-alert alert-error mb-3">{error}</div>
                )}

                <form
                    onSubmit={submitCrearUsuario}
                    className="admin-card p-4 shadow-sm"
                >
                    <input
                        type="text"
                        placeholder="DNI"
                        className="form-control mb-3"
                        value={dni}
                        onChange={handleDniChange}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Nombre"
                        className="form-control mb-3"
                        value={nombre}
                        onChange={handleNombreChange}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Apellido"
                        className="form-control mb-3"
                        value={apellido}
                        onChange={handleApellidoChange}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="form-control mb-3"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                    />
                    <select
                        className="form-control mb-3"
                        value={rol}
                        onChange={(e) => setRol(e.target.value)}
                        required
                    >
                        <option value="estudiante">Estudiante</option>
                        <option value="docente">Docente</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button type="submit" className="admin-btn w-100 mb-2">
                        Crear Usuario
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary w-100"
                        onClick={() => navigate("/admin/usuarios")}
                    >
                        Cancelar
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CrearUsuario;
