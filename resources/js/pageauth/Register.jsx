import React, { useEffect, useState } from "react";
import Config from "../Config";
import AuthUser from "./AuthUser";
import { useNavigate } from "react-router-dom";

const Register = () => {
    const { getToken } = AuthUser();
    const [dni, setDni] = useState("");
    const [nombre, setNombre] = useState("");
    const [apellido, setApellido] = useState("");
    const [password, setPassword] = useState("");
    const [rol, setRol] = useState("");
    const [alerta, setAlerta] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (getToken()) navigate("/");
    }, []);

    const mostrarAlerta = (tipo, mensaje) => {
        setAlerta({ tipo, mensaje });
        setTimeout(() => setAlerta(null), 4000);
    };

    // 🔹 Validaciones en tiempo real
    const handleDniChange = (e) => {
        const valor = e.target.value;
        if (!/^\d*$/.test(valor)) {
            mostrarAlerta("danger", "El DNI solo debe contener números.");
            return;
        }
        if (valor.length > 8) {
            mostrarAlerta("danger", "El DNI no puede tener más de 8 dígitos.");
            return;
        }
        setDni(valor);
    };

    const handleNombreChange = (e) => {
        const valor = e.target.value;
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚ\s]*$/.test(valor)) {
            mostrarAlerta("danger", "El nombre solo debe contener letras.");
            return;
        }
        setNombre(valor);
    };

    const handleApellidoChange = (e) => {
        const valor = e.target.value;
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚ\s]*$/.test(valor)) {
            mostrarAlerta("danger", "El apellido solo debe contener letras.");
            return;
        }
        setApellido(valor);
    };

    const handlePasswordChange = (e) => {
        const valor = e.target.value;
        if (valor.length > 0 && valor.length < 6) {
            mostrarAlerta(
                "warning",
                "La contraseña debe tener al menos 6 caracteres."
            );
        }
        setPassword(valor);
    };

    const validarFinal = () => {
        if (dni.length !== 8) {
            mostrarAlerta("danger", "El DNI debe tener exactamente 8 dígitos.");
            return false;
        }
        if (!nombre.trim() || !apellido.trim()) {
            mostrarAlerta(
                "danger",
                "Completa todos los campos de nombre y apellido."
            );
            return false;
        }
        if (password.length < 6) {
            mostrarAlerta(
                "danger",
                "La contraseña debe tener al menos 6 caracteres."
            );
            return false;
        }
        if (!rol) {
            mostrarAlerta("danger", "Selecciona un rol.");
            return false;
        }
        return true;
    };

    const submitRegister = async (e) => {
        e.preventDefault();
        if (!validarFinal()) return;

        Config.GetRegister({
            dni,
            nombre,
            apellido,
            password,
            password_confirmation: password,
            rol,
        })
            .then(({ data }) => {
                if (data.success) {
                    mostrarAlerta(
                        "success",
                        "Registro exitoso. Redirigiendo al login..."
                    );
                    setTimeout(() => navigate("/login"), 1500);
                } else {
                    mostrarAlerta(
                        "danger",
                        data.message || "Error al registrarse."
                    );
                }
            })
            .catch(() => {
                mostrarAlerta("danger", "No se pudo conectar con el servidor.");
            });
    };

    return (
        <div
            className="container"
            style={{ maxWidth: "450px", marginTop: "50px" }}
        >
            <h1 className="text-center mb-3">REGISTRO</h1>

            {/* 🔹 Alerta general */}
            {alerta && (
                <div
                    className={`alert alert-${alerta.tipo}`}
                    role="alert"
                    style={{ textAlign: "center" }}
                >
                    {alerta.mensaje}
                </div>
            )}

            <form onSubmit={submitRegister}>
                <input
                    type="text"
                    placeholder="DNI (8 dígitos)"
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
                    placeholder="Contraseña (mínimo 6 caracteres)"
                    className="form-control mb-2"
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
                    <option value="">Selecciona un rol</option>
                    <option value="estudiante">Estudiante</option>
                    <option value="docente">Docente</option>
                    <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn btn-primary w-100">
                    Registrar
                </button>
            </form>
        </div>
    );
};

export default Register;
