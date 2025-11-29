// src/layouts/LayoutPublic.jsx
import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import AuthUser from "../pageauth/AuthUser";
import "../styles/juegos.css";  // Estilos del navbar

// 🧩 Componentes que ya tenías
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const LayoutPublic = () => {
    const { getToken, getRol } = AuthUser();

    // 🔒 Si ya hay sesión activa, redirigir al panel correspondiente
    if (getToken()) {
        if (getRol() === "admin") return <Navigate to="/admin" replace />;
        if (getRol() === "docente") return <Navigate to="/docente" replace />;
        if (getRol() === "estudiante")
            return <Navigate to="/estudiante" replace />;
    }

    // 🧱 Si no está logueado, mostrar el layout público
    return (
        <>
            <Navbar />

                <div className="juego-container" style={{ paddingTop: "2rem", height: "100vh" }}>

                {/* HEADER PRINCIPAL */}
                <div className="juego-header">
                    <h2 className="juego-title">📘 Trilenium System International</h2>
                    <p className="juego-subtitle">
                        Plataforma Web Gamificada orientada a potenciar el aprendizaje lógico–matemático
                        mediante actividades interactivas, retroalimentación automática y un sistema
                        de progreso dinámico.
                    </p>
                </div>

                {/* SECCIÓN 1 */}
                <div className="game-area">
                    <h3 className="operation-text" style={{ fontSize: "2rem" }}>
                        🎯 Objetivo del Proyecto
                    </h3>
                    <p className="juego-subtitle">
                        Proporcionar una experiencia educativa moderna que combine gamificación, ejercicios
                        interactivos y seguimiento académico automatizado para mejorar las competencias
                        matemáticas de los estudiantes.
                    </p>
                </div>

                {/* ==============================
                   SECCIÓN 2 - PROCESOS (EDITADA)
                   ============================== */}
                <div className="game-area">
                    <h3 className="operation-text" style={{ fontSize: "2rem" }}>
                        ⚙️ Procesos Automatizados
                    </h3>

                    <ul className="juego-subtitle" style={{ lineHeight: "1.8" }}>
                        <li><strong>Proceso Automatizados</strong></li>
                    </ul>

                    {/* PROCESOS ESTRATÉGICOS */}
                    <h4 className="operation-text" style={{ marginTop: "1rem" }}>
                        🔹 Procesos Estratégicos
                    </h4>
                    <ul className="juego-subtitle" style={{ lineHeight: "1.8" }}>
                        <li>PE-001: Evaluación Diagnóstica de Competencias Iniciales</li>
                        <li>PE-002: Análisis y Reporte de Evaluación Diagnóstica</li>
                        <li>PE-003: Gestión Estratégica del Rendimiento Estudiantil</li>
                    </ul>

                    {/* PROCESOS MISIONALES */}
                    <h4 className="operation-text" style={{ marginTop: "1rem" }}>
                        🔹 Procesos Misionales
                    </h4>
                    <ul className="juego-subtitle" style={{ lineHeight: "1.8" }}>
                        <li>PM-001: Gestión de Actividades Interactivas</li>
                        <li>PM-002: Retroalimentación Inmediata del Estudiante</li>
                        <li>PM-003: Seguimiento y Monitoreo Académico</li>
                    </ul>

                    {/* PROCESOS DE APOYO */}
                    <h4 className="operation-text" style={{ marginTop: "1rem" }}>
                        🔹 Procesos de Apoyo
                    </h4>
                    <ul className="juego-subtitle" style={{ lineHeight: "1.8" }}>
                        <li>PA-001: Gestión de Usuarios y Roles del Sistema</li>
                        <li>PA-002: Administración de Reportes y Registros</li>
                        <li>PA-003: Mantenimiento y Soporte Técnico</li>
                    </ul>
                </div>

                {/* SECCIÓN 3 */}
                <div className="badges-section">
                    <h3 className="badges-title">🧩 Funcionalidades Clave</h3>

                    <div className="badges-grid">
                        <div className="badge-card">
                            <span className="badge-emoji">🎮</span>
                            <h4 className="badge-name">Juegos Interactivos</h4>
                            <p className="badge-description">
                                Actividades de razonamiento, operaciones básicas y desafíos lógicos.
                            </p>
                        </div>

                        <div className="badge-card">
                            <span className="badge-emoji">⭐</span>
                            <h4 className="badge-name">Gamificación</h4>
                            <p className="badge-description">
                                Niveles, puntos, insignias y recompensas motivadoras.
                            </p>
                        </div>

                        <div className="badge-card">
                            <span className="badge-emoji">📊</span>
                            <h4 className="badge-name">Reportes Inteligentes</h4>
                            <p className="badge-description">
                                Métricas detalladas del rendimiento académico.
                            </p>
                        </div>

                        <div className="badge-card">
                            <span className="badge-emoji">👨‍🏫</span>
                            <h4 className="badge-name">Gestión Docente</h4>
                            <p className="badge-description">
                                Supervisión, seguimiento y retroalimentación directa.
                            </p>
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 4 */}
                <div className="game-area">
                    <h3 className="operation-text" style={{ fontSize: "2rem" }}>
                        🛠️ Tecnologías Implementadas
                    </h3>

                    <ul className="juego-subtitle" style={{ lineHeight: "1.8" }}>
                        <li><strong>React.js</strong> – interfaz flexible, rápida y modular.</li>
                        <li><strong>Laravel API</strong> – backend sólido y seguro.</li>
                        <li><strong>MySQL</strong> – manejo estructurado de datos.</li>
                        <li><strong>SCRUM + DevOps</strong> – desarrollo iterativo y despliegue continuo.</li>
                    </ul>
                </div>

                {/* SECCIÓN 5 */}
                <div className="game-area">
                    <h3 className="operation-text" style={{ fontSize: "2rem" }}>
                        👥 Roles del Sistema
                    </h3>

                    <ul className="juego-subtitle" style={{ lineHeight: "1.8" }}>
                        <li><strong>Administradores:</strong> gestión del sistema y usuarios.</li>
                        <li><strong>Docentes:</strong> evaluación, actividades y progresos.</li>
                        <li><strong>Estudiantes:</strong> participación en actividades y juegos educativos.</li>
                    </ul>
                </div>

                {/* SECCIÓN FINAL */}
                <div className="badges-section" style={{ textAlign: "center" }}>
                    <h3 className="badges-title">🏁 Beneficios del Proyecto</h3>
                    <p className="juego-subtitle" style={{ fontSize: "1.2rem" }}>
                        Mejora del rendimiento académico mediante una experiencia motivadora.
                    </p>
                    <p className="juego-subtitle" style={{ fontStyle: "italic", marginTop: "1rem" }}>
                        “Tecnología y gamificación al servicio del aprendizaje significativo.”
                    </p>
                </div>
            </div>

            <main className="container py-4">
                <Outlet />
            </main>

            <Footer />
        </>       


    );
}

export default LayoutPublic;
