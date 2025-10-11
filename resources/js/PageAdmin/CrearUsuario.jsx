// CrearUsuario.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Config from "../Config";

const CrearUsuario = () => {
    const navigate = useNavigate();
    const [dni, setDni] = React.useState("");
    const [nombre, setNombre] = React.useState("");
    const [apellido, setApellido] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [rol, setRol] = React.useState("estudiante");
    const [error, setError] = React.useState("");

    // 🔹 Validación en tiempo real
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
        if (error) return; // bloquea envío si hay error en tiempo real

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
                alert("Usuario creado correctamente ✅");
                navigate("/admin/usuarios");
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
        <div className="container mt-4">
            <h2 className="text-center mb-4">Registrar Nuevo Usuario</h2>
            {error && <div className="text-danger mb-3">{error}</div>}
            <form onSubmit={submitCrearUsuario} className="card p-3 shadow-sm">
                <input
                    type="text"
                    placeholder="DNI"
                    className="form-control mb-2"
                    value={dni}
                    onChange={handleDniChange}
                    required
                />
                <input
                    type="text"
                    placeholder="Nombre"
                    className="form-control mb-2"
                    value={nombre}
                    onChange={handleNombreChange}
                    required
                />
                <input
                    type="text"
                    placeholder="Apellido"
                    className="form-control mb-2"
                    value={apellido}
                    onChange={handleApellidoChange}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="form-control mb-2"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                />
                <select
                    className="form-control mb-2"
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    required
                >
                    <option value="estudiante">Estudiante</option>
                    <option value="docente">Docente</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn btn-success w-100 mb-2">
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
    );
};

export default CrearUsuario;
