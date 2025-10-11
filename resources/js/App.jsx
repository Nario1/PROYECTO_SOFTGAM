import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts
import LayoutAdmin from "./layouts/LayoutAdmin";
import LayoutDocente from "./layouts/LayoutDocente";
import LayoutEstudiante from "./layouts/LayoutEstudiante";
import LayoutPublic from "./layouts/LayoutPublic";

// Pages públicas
import Login from "./pageauth/Login";
import Register from "./pageauth/Register";
import NotFound from "./pagepublic/NotFound";

// Pages privadas
import PanelAdmin from "./pageadmin/PanelAdmin";
import PanelDocente from "./pagedocente/PanelDocente";
import PanelEstudiante from "./pageestudiante/PanelEstudiante";

// Rutas protegidas
import ProtectedRoutes from "./pageauth/ProtectedRoutes";

// Admin - Usuarios
import UserAll from "./pageadmin/UserAll";
import CRUDAdmin from "./pageadmin/CRUDAdmin";
import CrearUsuario from "./pageadmin/CrearUsuario";

// ✅ Importar las nuevas páginas
import UsoAdmin from "./pageadmin/UsoAdmin";
import ReportesAdmin from "./pageadmin/ReportesAdmin";

// App - Estudiante
import DashboardEstudiante from "./PageEstudiante/PerfilEstudiante";
import JuegosEstudiante from "./pageestudiante/JuegoEstudiante";
import JuegoPatrones from "./pageestudiante/JuegoPatrones";
import DiagnosticoEstudiante from "./pageestudiante/DiagnosticoEstudiante";
import ActividadAsignada from "./pageestudiante/ActividadAsignada";
import JuegoSumaResta from "./pageestudiante/JuegoSumaResta";
import AsistenciaEstudiante from "./pageestudiante/AsistenciaEstudiante";

// App - Estudiante
import CaliRetroEstudiante from "./pageestudiante/CaliRetroEstudiante";

// app - Docente
import DiagnosticoDocente from "./pagedocente/DiagnosticoDocente";
import ReportesDiagnostico from "./PageDocente/ReportesDiagnostico";
import AsignarActividad from "./PageDocente/AsignarActividad";
import CaliRetroDocente from "./PageDocente/CaliRetroDocente";
import AsistenciaDocente from "./PageDocente/AsistenciaDocente";
import RecursosDocente from "./PageDocente/RecursosDocente";
import RecursosEstudiante from "./PageEstudiante/RecursosEstudiante";

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<LayoutPublic />}>
                    <Route path="login" element={<Login />} />
                    <Route path="register" element={<Register />} />
                    <Route path="/*" element={<NotFound />} />
                </Route>

                {/* Rutas protegidas */}
                <Route element={<ProtectedRoutes />}>
                    {/* Estudiante */}
                    <Route path="/estudiante" element={<LayoutEstudiante />}>
                        <Route index element={<PanelEstudiante />} />
                        <Route
                            path="perfil"
                            element={<DashboardEstudiante />}
                        />
                        <Route path="juegos" element={<JuegosEstudiante />} />
                        <Route
                            path="juegos/patrones"
                            element={<JuegoPatrones />}
                        />
                        <Route
                            path="juegos/sumayresta"
                            element={<JuegoSumaResta />}
                        />

                        {/* ✅ Nueva ruta: Prueba Diagnóstica */}
                        <Route
                            path="diagnostico"
                            element={<DiagnosticoEstudiante />}
                        />
                        <Route
                            path="/estudiante/actividades"
                            element={<ActividadAsignada />}
                        />
                        {/* ✅ Nueva ruta: Calificaciones y Retroalimentación */}
                        <Route
                            path="calificaciones"
                            element={<CaliRetroEstudiante />}
                        />
                        <Route
                            path="asistencia"
                            element={<AsistenciaEstudiante />}
                        />
                        <Route
                            path="recursos"
                            element={<RecursosEstudiante />}
                        />
                    </Route>

                    {/* Docente */}
                    <Route path="/docente" element={<LayoutDocente />}>
                        <Route index element={<PanelDocente />} />
                        {/* PM-001: Caracterización Académica del Estudiante */}
                        <Route
                            path="diagnostico"
                            element={<DiagnosticoDocente />}
                        />

                        {/* PM-003: Seguimiento y Evaluación del Progreso Estudiantil */}
                        <Route
                            path="reportes-diagnostico"
                            element={<ReportesDiagnostico />}
                        />
                        {/* PM-004: Asignación de Actividades Académicas */}
                        <Route
                            path="asignar-actividad"
                            element={<AsignarActividad />}
                        />
                        {/* ✅ Nueva ruta: Calificación y Retroalimentación */}
                        <Route
                            path="cali-retro"
                            element={<CaliRetroDocente />}
                        />
                        <Route
                            path="asistencia"
                            element={<AsistenciaDocente />}
                        />
                        <Route path="recursos" element={<RecursosDocente />} />
                    </Route>

                    {/* Admin */}
                    <Route path="/admin" element={<LayoutAdmin />}>
                        <Route index element={<PanelAdmin />} />
                        {/* Usuarios */}
                        <Route path="usuarios" element={<UserAll />} />
                        <Route
                            path="usuarios/crear"
                            element={<CrearUsuario />}
                        />
                        <Route path="usuarios/:id" element={<CRUDAdmin />} />
                        <Route
                            path="usuarios/:id/edit"
                            element={<CRUDAdmin />}
                        />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default App;

if (document.getElementById("root")) {
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
