import React, { useState, useEffect } from "react";
import Config from "../Config";
import AuthUser from "./AuthUser";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const { getToken, saveToken } = AuthUser();
    const [dni, setDni] = useState("");
    const [password, setPassword] = useState("");
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

    const validarCampos = () => {
        if (dni.length !== 8) {
            mostrarAlerta("danger", "El DNI debe tener exactamente 8 dígitos.");
            return false;
        }
        if (password.length < 6) {
            mostrarAlerta(
                "danger",
                "La contraseña debe tener al menos 6 caracteres."
            );
            return false;
        }
        return true;
    };

    const submitLogin = async (e) => {
        e.preventDefault();

        if (!validarCampos()) return;

        Config.GetLogin({ dni, password })
            .then(({ data }) => {
                if (data.success) {
                    saveToken(data.data.token, data.data.user);

                    const rol = data.data.user.rol;
                    if (rol === "admin") navigate("/admin");
                    else if (rol === "docente") navigate("/docente");
                    else navigate("/estudiante");
                } else {
                    mostrarAlerta(
                        "danger",
                        data.message || "Credenciales incorrectas."
                    );
                }
            })
            .catch((error) => {
                if (error.response) {
                    mostrarAlerta("danger", error.response.data.message);
                } else {
                    mostrarAlerta(
                        "danger",
                        "Error inesperado al iniciar sesión."
                    );
                }
            });
    };

    return (
        <div
            className="container"
            style={{ maxWidth: "400px", marginTop: "50px" }}
        >
            <h1 className="text-center">LOGIN</h1>

            {/* 🔹 Alerta visible arriba del formulario */}
            {alerta && (
                <div
                    className={`alert alert-${alerta.tipo}`}
                    role="alert"
                    style={{ textAlign: "center" }}
                >
                    {alerta.mensaje}
                </div>
            )}

            <form onSubmit={submitLogin}>
                <input
                    type="text"
                    placeholder="DNI"
                    className="form-control mb-2"
                    value={dni}
                    onChange={handleDniChange}
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
                <button type="submit" className="btn btn-success w-100 mb-3">
                    Ingresar
                </button>
            </form>

            <div className="text-center">
                <p>¿Primera vez aquí?</p>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate("/register")}
                >
                    Regístrate
                </button>
            </div>
        </div>
    );
};

export default Login;
