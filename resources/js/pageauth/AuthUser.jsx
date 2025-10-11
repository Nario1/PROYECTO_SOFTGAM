import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthUser = () => {
    const navigate = useNavigate();

    // Obtener token desde localStorage
    const getToken = () => {
        return localStorage.getItem("token");
    };

    // Obtener usuario desde localStorage
    const getUser = () => {
        const userString = localStorage.getItem("user");
        return userString ? JSON.parse(userString) : null;
    };

    // Obtener ID del usuario
    const getUserId = () => {
        const user = getUser();
        return user?.id || null;
    };

    // Obtener rol del usuario
    const getRol = () => {
        const user = getUser();
        return user?.rol;
    };
    // Nuevo: Obtener nombre del usuario
    const getUserName = () => {
        const user = getUser();
        return user?.name || user?.nombre || "Usuario"; // Ajusta según el campo que tengas en tu JSON
    };

    const [token, setTokenState] = useState(getToken());
    const [user, setUserState] = useState(getUser());
    const [rol, setRolState] = useState(getRol());

    // Guardar token y usuario en localStorage
    const saveToken = (token, user) => {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("userId", user.id); // 👈 guardar ID por separado

        setTokenState(token);
        setUserState(user);
        setRolState(user.rol);

        // Redirección según rol
        if (user.rol === "admin") navigate("/admin");
        else if (user.rol === "docente") navigate("/docente");
        else navigate("/estudiante");
    };

    // Logout
    const logout = () => {
        localStorage.clear();
        setTokenState(null);
        setUserState(null);
        setRolState(null);
        navigate("/login");
    };

    return {
        token,
        user,
        rol,
        getToken,
        getUser,
        getUserId, // 👈 nuevo getter
        getRol,
        getUserName, // 👈 Agregado
        saveToken,
        logout,
    };
};

export default AuthUser;
