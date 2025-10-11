import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import AuthUser from "../pageauth/AuthUser";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LayoutAdmin = () => {
    const { getRol } = AuthUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (getRol() !== "admin") {
            navigate("/login");
        }
    }, []);
    return (
        <div>
            <h1>ADMIN</h1>
            <Navbar />
            <Outlet />
            <Footer />
        </div>
    );
};

export default LayoutAdmin;
