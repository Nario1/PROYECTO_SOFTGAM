import React from "react";
import { Outlet } from "react-router-dom";
import AuthUser from "./AuthUser";
import { Navigate } from "react-router-dom";

const ProtectedRoutes = () => {
    const { getToken } = AuthUser();
    if (!getToken()) {
        return <Navigate to="/login" />;
    }
    return <Outlet />;
};

export default ProtectedRoutes;
