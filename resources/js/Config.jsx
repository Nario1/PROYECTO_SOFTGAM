// Config.jsx
import axios from "axios";

const base_api_url = "/api";

export default {
    // 🔹 Auth
    GetRegister: (userData) =>
        axios.post(`${base_api_url}/auth/register`, userData),
    GetLogin: (credentials) =>
        axios.post(`${base_api_url}/auth/login`, credentials),

    // 🔹 Users (Admin)
    GetUserAll: () =>
        axios.get(`${base_api_url}/admin/usuarios`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    GetUserById: (id) =>
        axios.get(`${base_api_url}/admin/usuarios/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    UpdateUser: (id, data) =>
        axios.put(`${base_api_url}/admin/usuarios/${id}`, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    DeleteUser: (id) =>
        axios.delete(`${base_api_url}/admin/usuarios/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    // 🔹 Datos de uso
    LogUso: (userId, data) =>
        axios.post(
            `${base_api_url}/datos-uso/log`,
            {
                user_id: userId,
                tiempo_sesion: data.tiempo_sesion,
                actividades_completadas: data.actividades_completadas,
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),
    ExportUso: () =>
        axios.get(`${base_api_url}/datos-uso/export`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    // 🔹 Dashboard estudiante Y JUEGO
    GetPuntosEstudiante: (userId) =>
        axios.get(`${base_api_url}/puntos/${userId}/total`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    GetNivelEstudiante: (userId) =>
        axios.get(`${base_api_url}/niveles/check/${userId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    GetInsigniasEstudiante: (userId) =>
        axios.get(`${base_api_url}/insignias/student/${userId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    CheckInsignias: (userId) =>
        axios.post(`${base_api_url}/insignias/autoasignar/${userId}`, null, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    // 🔹 Sistema de Puntos
    AddPuntos: (userId, cantidad, motivo) =>
        axios.post(
            `${base_api_url}/puntos/add`,
            {
                user_id: userId,
                cantidad: cantidad,
                motivo: motivo,
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),

    // 🔹 Juegos
    GetJuegos: () =>
        axios.get(`${base_api_url}/juegos`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    GetJuego: (juegoId) =>
        axios.get(`${base_api_url}/juegos/${juegoId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    // 🔹 Jugadas
    StartJugada: (userId, juegoId) =>
        axios.post(
            `${base_api_url}/jugadas/start`,
            {
                user_id: userId,
                juego_id: juegoId,
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),
    FinishJugada: (jugadaId, puntos) =>
        axios.post(
            `${base_api_url}/jugadas/finish`,
            {
                jugada_id: jugadaId,
                puntos_obtenidos: puntos,
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),
    GetJugadasActivas: (userId) =>
        axios.get(`${base_api_url}/jugadas/estudiante/${userId}/activas`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    // 🔹 Pruebas diagnósticas
    // 🔹 Pruebas diagnósticas
    AddPruebaDiagnostica: (data) =>
        axios.post(`${base_api_url}/pruebas-diagnosticas/pruebas`, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    getAllPruebasDiagnosticas: () =>
        axios.get(`${base_api_url}/pruebas-diagnosticas/pruebas`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    getPruebaById: (id) =>
        axios.get(`${base_api_url}/pruebas-diagnosticas/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    assignCategoria: (userId, data) =>
        axios.post(
            `${base_api_url}/pruebas-diagnosticas/${userId}/assign-category`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),
    getRecomendaciones: (userId) =>
        axios.get(
            `${base_api_url}/pruebas-diagnosticas/${userId}/recommendations`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),

    // 🔹 Pruebas diagnósticas - preguntas
    // 🔹 Pruebas diagnósticas - preguntas
    GetPreguntas: (pruebaId) =>
        axios.get(
            `${base_api_url}/pruebas-diagnosticas/${pruebaId}/preguntas`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),
    AddPregunta: (pruebaId, data) =>
        axios.post(
            `${base_api_url}/pruebas-diagnosticas/${pruebaId}/preguntas`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),
    DeletePregunta: (preguntaId) =>
        axios.delete(
            `${base_api_url}/pruebas-diagnosticas/preguntas/${preguntaId}`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),

    UpdatePregunta: (preguntaId, data) =>
        axios.put(`${base_api_url}/preguntas/${preguntaId}`, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    //respeysarts
    EnviarRespuestas: (pruebaId, data) =>
        axios.post(
            `${base_api_url}/pruebas-diagnosticas/guardar-respuestas/${pruebaId}`,
            {
                prueba_id: pruebaId,
                ...data, // {respuestas, categoria, puntaje}
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),
    // 🔹 Pruebas diagnósticas - reportes
    GetReportesDiagnostico: () =>
        axios.get(`${base_api_url}/pruebas-diagnosticas/reportes-diagnostico`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    GetEstadisticasDiagnostico: () =>
        axios.get(`${base_api_url}/pruebas-diagnosticas/estadisticas`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    // 🔹 Estudiantes (para asignaciones)
    GetEstudiantes: () =>
        axios.get(`${base_api_url}/usuarios/estudiantes`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    // 🔹 Eliminar una prueba diagnóstica
    DeletePruebaDiagnostica: function (id) {
        if (!id) throw new Error("ID de la prueba es requerido");

        return axios.delete(`${base_api_url}/pruebas-diagnosticas/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
    },

    // 🔹 Asignaciones de actividades
    GetAsignaciones: () =>
        axios.get(`${base_api_url}/actividades/asignaciones`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    GetAsignacionesEstudiante: (studentId) =>
        axios.get(
            `${base_api_url}/actividades/estudiante/${studentId}/asignaciones`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),

    UpdateAsignacion: (asignacionId, data) =>
        axios.put(
            `${base_api_url}/actividades/asignaciones/${asignacionId}`,
            data,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),

    DeleteAsignacion: (asignacionId) =>
        axios.delete(
            `${base_api_url}/actividades/asignaciones/${asignacionId}`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),

    // 🔹 Temáticas
    GetTematicas: () =>
        axios.get(`${base_api_url}/tematicas`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    //crear actividad
    CrearActividad: (data, isFormData = false) => {
        return axios.post(`${base_api_url}/actividades`, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                ...(isFormData && { "Content-Type": "multipart/form-data" }),
            },
        });
    },
    // asignar actividad a un estudiante
    // asignar actividad a un estudiante
    AssignActividad: (data) => {
        return axios.post(`${base_api_url}/actividades/asignar`, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
    },

    // crear nueva teamtica
    CrearTematica: (data) => {
        return axios.post(`${base_api_url}/tematicas`, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
    },
    CrearYAsignarActividad: (actividadFormData, isFormData = true) => {
        return axios.post(
            `${base_api_url}/actividades/asignar`,
            actividadFormData,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    ...(isFormData && {
                        "Content-Type": "multipart/form-data",
                    }),
                },
            }
        );
    },
    // Obtener actividades asignadas al estudiante logueado
    // Obtener actividades asignadas a un estudiante
    GetActividadesAsignadas: async (studentId) => {
        if (!studentId) throw new Error("studentId es requerido");
        try {
            return await axios.get(
                `${base_api_url}/actividades/estudiante/${studentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );
        } catch (err) {
            console.error("❌ Error en GetActividadesAsignadas:", err);
            throw err;
        }
    },
    // Obtener actividades creadas por un docente
    GetActividadesDocente: async (docenteId) => {
        if (!docenteId) throw new Error("docenteId es requerido");
        try {
            return await axios.get(
                `${base_api_url}/actividades/docente/${docenteId}`, // <-- asegúrate que esta ruta exista en tu API
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );
        } catch (err) {
            console.error("❌ Error en GetActividadesDocente:", err);
            throw err;
        }
    },

    // Enviar entrega de actividad
    EnviarEntrega: async (formData) => {
        try {
            return await axios.post(
                `${base_api_url}/actividades/completar`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );
        } catch (err) {
            console.error("Error en EnviarEntrega:", err);
            throw err;
        }
    },
    // 🔹 Actividades - actualizar actividad
    ActualizarActividad: (id, formData, isFormData = true) => {
        return axios.post(`${base_api_url}/actividades/${id}`, formData, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                ...(isFormData && { "Content-Type": "multipart/form-data" }),
            },
            params: { _method: "PUT" }, // Laravel espera _method=PUT en POST
        });
    },
    EliminarActividad: (id) => {
        return axios.delete(`${base_api_url}/actividades/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
    },
    // 🔹 Entregas de actividades
    GetEntregasActividad: (actividadId) => {
        if (!actividadId) throw new Error("actividadId es requerido");
        return axios.get(
            `${base_api_url}/actividades/${actividadId}/entregas`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );
    },
    // Obtener entregas de una actividad
    GetEntregasActividad: (actividadId) =>
        axios.get(`${base_api_url}/actividades/${actividadId}/entregas`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    // Retroalimentación
    // 🔹 Retroalimentación del docente
    // 🔹 Guardar retroalimentación (crear o actualizar)
    GuardarRetroalimentacion: function (actividadId, data) {
        if (!actividadId) throw new Error("actividadId es requerido");
        return axios.post(
            `${base_api_url}/actividades/${actividadId}/retroalimentacion`,
            {
                calificacion: data.calificacion,
                retroalimentacion: data.retroalimentacion,
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );
    },

    // 🔹 Actualizar retroalimentación existente
    ActualizarRetroalimentacion: function (actividadId, estudianteId, data) {
        if (!actividadId || !estudianteId)
            throw new Error("actividadId y estudianteId son requeridos");
        return axios.put(
            `${base_api_url}/actividades/${actividadId}/retroalimentacion/${estudianteId}`,
            {
                calificacion: data.calificacion,
                retroalimentacion: data.retroalimentacion,
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );
    },

    // 🔹 Eliminar retroalimentación
    EliminarRetroalimentacion: function (actividadId, estudianteId) {
        if (!actividadId || !estudianteId)
            throw new Error("actividadId y estudianteId son requeridos");
        return axios.delete(
            `${base_api_url}/actividades/${actividadId}/retroalimentacion/${estudianteId}`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );
    },

    // 🔹 Obtener retroalimentación de un estudiante para una actividad
    GetRetroalimentacion: function (actividadId, estudianteId) {
        if (!actividadId || !estudianteId)
            throw new Error("actividadId y estudianteId son requeridos");
        return axios.get(
            `${base_api_url}/actividades/${actividadId}/retroalimentacion/${estudianteId}`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );
    },
    // 🔹 Obtener todas las retroalimentaciones de un estudiante
    GetRetroalimentacionesPorEstudiante: function (estudianteId) {
        if (!estudianteId) throw new Error("estudianteId es requerido");
        return axios.get(
            `${base_api_url}/actividades/estudiante/${estudianteId}/retroalimentaciones`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        );
    },
    // 🔹 Asistencia Académica
    AddAsistencia: (data) =>
        axios.post(`${base_api_url}/asistencias`, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    GetAsistencias: () =>
        axios.get(`${base_api_url}/asistencias`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    GetAsistenciaByEstudiante: (id) =>
        axios.get(`${base_api_url}/asistencias/estudiante/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    UpdateAsistencia: (id, data) =>
        axios.put(`${base_api_url}/asistencias/${id}`, data, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    DeleteAsistencia: (id) =>
        axios.delete(`${base_api_url}/asistencias/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),
    // Obtener todos los recursos (visibles para todos)
    GetRecursos: () =>
        axios.get(`${base_api_url}/recursos`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    // Obtener un recurso por ID
    GetRecursoById: (id) => {
        if (!id) throw new Error("id de recurso es requerido");
        return axios.get(`${base_api_url}/recursos/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
    },

    // Obtener todos los recursos de un docente
    GetRecursosDocente: (docenteId) => {
        if (!docenteId) throw new Error("docenteId es requerido");
        return axios.get(`${base_api_url}/recursos/docente/${docenteId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
    },

    // Obtener recursos por temática
    GetRecursosPorTematica: (tematicaId) => {
        if (!tematicaId) throw new Error("tematicaId es requerido");
        return axios.get(`${base_api_url}/recursos/tematica/${tematicaId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
    },

    // Subir un nuevo recurso (solo docentes)
    AddRecurso: (formData) =>
        axios.post(`${base_api_url}/recursos`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }),

    // Eliminar recurso (solo docentes)
    EliminarRecurso: (id) => {
        if (!id) throw new Error("id de recurso es requerido");
        return axios.delete(`${base_api_url}/recursos/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
    },

    // Descargar archivo de recurso
    DescargarRecurso: (id) => {
        if (!id) throw new Error("id de recurso es requerido");
        return axios.get(`${base_api_url}/recursos/descargar/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            responseType: "blob", // importante para archivos
        });
    },

    CambiarVisibilidadRecurso: (id, visible) =>
        axios.post(
            `${base_api_url}/${id}/visibilidad`,
            { visible }, // se envía el valor (true o false)
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            }
        ),
    // Obtener todos los recursos visibles para estudiantes (opcionalmente por temática)
    // Obtener todos los recursos visibles para estudiantes
    GetRecursosParaEstudiantes: () => {
        const url = `${base_api_url}/recursos/estudiantes`; // Ajusta según tu ruta real
        return axios.get(url, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
    },
    // Descargar archivo de recurso
    DescargarArchivo: (id) => {
        if (!id) throw new Error("id de recurso es requerido");
        return axios.get(`${base_api_url}/actividades/descargar/${id}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            responseType: "blob", // importante para archivos
        });
    },
    DescargarEntrega: (id) => {
        if (!id) throw new Error("id de recurso es requerido");
        return axios.get(
            `${base_api_url}/actividades/descargar-entrega/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                responseType: "blob", // importante para archivos
            }
        );
    },
};
