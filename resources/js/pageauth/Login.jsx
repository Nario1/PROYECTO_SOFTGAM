import React, { useState, useEffect } from "react";
import Config from "../Config";
import AuthUser from "./AuthUser";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css"; // Asegúrate de importar tu CSS

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
                    if (rol === "admin") navigate("/admin", { replace: true });
                    else if (rol === "docente")
                        navigate("/docente", { replace: true });
                    else navigate("/estudiante", { replace: true });
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
        <div className="login-container">
            <div className="login-card">
                <h1>Iniciar Sesión</h1>

                {/* 🔹 Alertas visuales */}
                {alerta && (
                    <div className={`alert alert-${alerta.tipo}`}>
                        {alerta.mensaje}
                    </div>
                )}

                <form onSubmit={submitLogin}>
                    <input
                        type="text"
                        placeholder="DNI"
                        value={dni}
                        onChange={handleDniChange}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={handlePasswordChange}
                        required
                    />
                    <button type="submit" className="btn-login">
                        Ingresar
                    </button>
                </form>

                <div className="register-text">
                    <p>¿Primera vez aquí?</p>
                    <button
                        className="btn-register"
                        onClick={() => navigate("/register")}
                    >
                        Regístrate
                    </button>
                </div>

                <p className="login-footer">© 2025 Plataforma Educativa</p>
            </div>
        </div>
    );
};

export default Login;
