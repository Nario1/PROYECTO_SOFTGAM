    <?php

    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Route;
    use App\Http\Controllers\Api\AuthController;
    use App\Http\Controllers\Api\JuegoController;
    use App\Http\Controllers\Api\ActividadController;
    use App\Http\Controllers\Api\TematicaController;
    use App\Http\Controllers\Api\PuntoController;
    use App\Http\Controllers\Api\NivelController;
    use App\Http\Controllers\Api\InsigniaController;
    use App\Http\Controllers\Api\PruebaDiagnosticaController;
    use App\Http\Controllers\Api\DatosUsoController;
    use App\Http\Controllers\Api\JugadaController;
    use App\Http\Controllers\Api\PruebaController;
    use App\Http\Controllers\Api\RetroalimentacionController;
    use App\Http\Controllers\Api\AsistenciaController;
    use App\Http\Controllers\Api\RecursoController;



    /*
    |--------------------------------------------------------------------------
    | API Routes
    |--------------------------------------------------------------------------
    */

    // Rutas públicas de autenticación (sin middleware auth:sanctum)
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
    });

    // Rutas protegidas de autenticación (requieren token)
    Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
    });

    /*
    |--------------------------------------------------------------------------
    | RUTAS DE JUEGOS - Diferenciadas por ROL
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->prefix('juegos')->group(function () {
        
        // PANEL PRINCIPAL - Cambia según rol (estudiante/docente/admin)
        Route::get('/', [JuegoController::class, 'index']);
        
        // VER DETALLES DE JUEGO ESPECÍFICO - Todos los roles
        Route::get('/{id}', [JuegoController::class, 'show']);
        
        // FUNCIONES PARA DOCENTES
        Route::get('/estudiantes/asignacion', [JuegoController::class, 'getEstudiantesParaAsignacion']);
        Route::post('/asignar', [JuegoController::class, 'asignarJuego']);
        
        // GESTIÓN DE JUEGOS - Solo ADMIN
        Route::post('/', [JuegoController::class, 'store']); // Crear juego
        Route::put('/{id}', [JuegoController::class, 'update']); // Editar juego
        Route::delete('/{id}', [JuegoController::class, 'destroy']); // Eliminar juego
        
        // REPORTES Y ESTADÍSTICAS - Solo ADMIN
        Route::get('/admin/reportes', [JuegoController::class, 'getReportesCompletos']);
        Route::get('/admin/estadisticas', [JuegoController::class, 'getEstadisticasCompletas']);

        //PROGRESO
        Route::get('/progreso/{user_id}/{juego_id}', [JugadaController::class, 'getProgreso']);
    });

        /*
    |--------------------------------------------------------------------------
    | RUTAS DE ACTIVIDADES - Diferenciadas por ROL
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->prefix('actividades')->group(function () {
        
        // ⚠️ RUTAS ESPECÍFICAS PRIMERO (antes de /{id})
        Route::get('/descargar/{id}', [ActividadController::class, 'descargarArchivo']);
        Route::get('/descargar-entrega/{id}', [ActividadController::class, 'descargarEntrega']);
        Route::get('/estudiante/{id}', [ActividadController::class, 'getActividadesParaEstudiante']);
        Route::get('/docente/{id}', [ActividadController::class, 'getActividadesParaDocente']);
        Route::get('/{actividadId}/entregas', [ActividadController::class, 'getEntregasActividad']);

        // RUTAS GENERALES
        Route::get('/', [ActividadController::class, 'index']);
        Route::post('/', [ActividadController::class, 'store']);
        Route::post('/completar', [ActividadController::class, 'complete']);
        Route::post('/asignar', [ActividadController::class, 'assignToStudent']);
        
        // /{id} AL FINAL (después de todas las rutas específicas)
        Route::get('/{id}', [ActividadController::class, 'show']);
        Route::put('/{id}', [ActividadController::class, 'update']);
        Route::delete('/{id}', [ActividadController::class, 'destroy']);

        /* --------------------------------------------------------------------
        RUTAS PARA RETROALIMENTACIÓN
        --------------------------------------------------------------------*/
        Route::post('/{actividadId}/retroalimentacion', [RetroalimentacionController::class, 'store']);
        Route::put('/{actividadId}/retroalimentacion/{estudianteId}', [RetroalimentacionController::class, 'update']);
        Route::delete('/{actividadId}/retroalimentacion/{estudianteId}', [RetroalimentacionController::class, 'destroy']);
        Route::get('/{actividadId}/retroalimentacion/{estudianteId}', [RetroalimentacionController::class, 'getByEstudiante']);
        Route::get('/estudiante/{estudianteId}/retroalimentaciones', [RetroalimentacionController::class, 'getEstudianteRetro']);
    });




    /*
    |--------------------------------------------------------------------------
    | RUTAS DE TEMÁTICAS - Diferenciadas por ROL
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->prefix('tematicas')->group(function () {

        Route::get('/', [TematicaController::class, 'index']);        // Listar todas las temáticas (rol diferenciado)
        Route::get('/{id}', [TematicaController::class, 'show']);    // Ver detalle de una temática específica

        // CRUD de temáticas - Solo ADMIN
        Route::post('/', [TematicaController::class, 'store']);       // Crear nueva temática
        Route::put('/{id}', [TematicaController::class, 'update']);  // Editar temática existente
        Route::delete('/{id}', [TematicaController::class, 'destroy']); // Eliminar temática

        // Obtener contenido de la temática
        Route::get('/{id}/juegos', [TematicaController::class, 'getJuegos']);           // Obtener juegos de la temática
        Route::get('/{id}/actividades', [TematicaController::class, 'getActividades']); // Obtener actividades de la temática (opcional filtro por dificultad)
    });
    /*
    |--------------------------------------------------------------------------
    | RUTAS DE PUNTOS Y GAMIFICACIÓN
    |--------------------------------------------------------------------------
    |
    | Estas rutas permiten gestionar el sistema de puntos de los estudiantes:
    | otorgar, restar, consultar totales, historial, ranking, top estudiantes
    | y estadísticas generales del sistema. 
    |
    */
    Route::middleware('auth:sanctum')->prefix('puntos')->group(function () {

        // OTORGAR puntos a un estudiante (docentes/admin)
        Route::post('/add', [PuntoController::class, 'addPoints']); 

        // RESTAR puntos a un estudiante (penalizaciones)
        Route::post('/subtract', [PuntoController::class, 'subtractPoints']); 

        // CONSULTAR puntos totales y progreso de nivel de un estudiante
        Route::get('/{userId}/total', [PuntoController::class, 'getPoints']); 

        // CONSULTAR historial de transacciones de puntos de un estudiante
        // con filtros opcionales (fecha, solo_ganancias, solo_perdidas)
        Route::get('/{userId}/historial', [PuntoController::class, 'getHistory']); 

        // LEADERBOARD general de estudiantes (ordenado por puntos)
        Route::get('/leaderboard', [PuntoController::class, 'getLeaderboard']); 

        // TOP estudiantes en un período (todo, semana, mes)
        Route::get('/top', [PuntoController::class, 'getTopStudents']); 

        // ESTADÍSTICAS generales del sistema de puntos
        // (solo accesible a admin y docentes)
        Route::get('/stats/system', [PuntoController::class, 'getSystemStats']); 
    });


    /*
    |--------------------------------------------------------------------------
    | GESTIÓN DE USUARIOS - Solo ADMIN
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->prefix('admin/usuarios')->group(function () {
        Route::get('/{id}', [JuegoController::class, 'getUsuarioById']); 
        Route::get('/', [JuegoController::class, 'getUsuarios']); // Listar usuarios
        Route::post('/', [JuegoController::class, 'crearUsuario']); // Crear usuario
        Route::put('/{id}', [JuegoController::class, 'actualizarUsuario']); // Editar usuario
        Route::delete('/{id}', [JuegoController::class, 'eliminarUsuario']); // Eliminar usuario
        Route::post('/{id}/reset-password', [JuegoController::class, 'resetearPassword']); // Reset password
    });
    /*
    |--------------------------------------------------------------------------
    | RUTA PARA OBTENER ESTUDIANTES - Docentes/Admin
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->get('/usuarios/estudiantes', [ActividadController::class, 'getEstudiantes']);


    /*
    |--------------------------------------------------------------------------
    | RUTAS DE NIVELES - Diferenciadas por ROL
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->prefix('niveles')->group(function () {

        // LISTADO PRINCIPAL DE NIVELES (diferenciado por rol)
        Route::get('/', [App\Http\Controllers\Api\NivelController::class, 'index']);

        // DETALLE DE UN NIVEL
        Route::get('/{id}', [App\Http\Controllers\Api\NivelController::class, 'show']);

        // CRUD DE NIVELES - Solo ADMIN
        Route::post('/', [App\Http\Controllers\Api\NivelController::class, 'store']);   // Crear nivel
        Route::put('/{id}', [App\Http\Controllers\Api\NivelController::class, 'update']); // Editar nivel
        Route::delete('/{id}', [App\Http\Controllers\Api\NivelController::class, 'destroy']); // Eliminar nivel

        // ASIGNACIÓN MANUAL DE NIVELES - Solo ADMIN
        Route::post('/assign', [App\Http\Controllers\Api\NivelController::class, 'assignLevel']);

        // VERIFICAR PROGRESO Y SUBIR NIVEL - Estudiantes/Admin
        Route::get('/check/{userId}', [App\Http\Controllers\Api\NivelController::class, 'checkLevelUp']);

        // OBTENER ESTUDIANTES POR NIVEL - Docentes/Admin
        Route::get('/{id}/students', [App\Http\Controllers\Api\NivelController::class, 'getStudentsByLevel']);
    });
    /*
    |-------------------------------------------------------------------------- 
    | RUTAS DE INSIGNIAS - Diferenciadas por ROL 
    |-------------------------------------------------------------------------- 
    */
    Route::middleware('auth:sanctum')->prefix('insignias')->group(function () {
        Route::get('/', [InsigniaController::class, 'index']); // Listar todas las insignias
        Route::get('/{id}', [InsigniaController::class, 'show']); // Ver detalle de una insignia específica

        // CRUD de insignias - Solo Admin/Docente
        Route::post('/', [InsigniaController::class, 'store']); 
        Route::put('/{id}', [InsigniaController::class, 'update']); 
        Route::delete('/{id}', [InsigniaController::class, 'destroy']); 

        // Recalcular asignaciones cuando se cambia criterio
        Route::post('/{id}/recalcular', [InsigniaController::class, 'recalcularAsignaciones']); 

        // Analizar estadísticas y rendimiento de insignias
        Route::get('/analisis/tipos', [InsigniaController::class, 'analizarTipos']); 
        Route::get('/analisis/criterios', [InsigniaController::class, 'analizarEficaciaCriterios']); 
        Route::get('/analisis/codiciadas', [InsigniaController::class, 'obtenerInsigniasMasCodiciadas']); 
        Route::get('/{id}/rendimiento', [InsigniaController::class, 'evaluarRendimiento']); 
        Route::get('/{id}/promedio-mensual', [InsigniaController::class, 'calcularPromedioMensual']); 

        // Asignación manual
        Route::post('/assign', [InsigniaController::class, 'assignBadge']);
        // Revocar insignia
        Route::post('/revoke', [InsigniaController::class, 'revokeBadge']);

        // ✅ Obtener insignias del estudiante autenticado
        Route::get('/student/{studentId}', [InsigniaController::class, 'getByStudent']);

        // ✅ Autoasignar insignias según criterios
        Route::post('/autoasignar/{studentId}', [InsigniaController::class, 'checkCriteria']);
    });

    /*
    |--------------------------------------------------------------------------
    | RUTAS DE PRUEBAS DIAGNÓSTICAS
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->prefix('pruebas-diagnosticas')->group(function () {
        Route::get('/reportes-diagnostico', [PruebaDiagnosticaController::class, 'getReportes']);

        Route::get('/estadisticas', [PruebaDiagnosticaController::class, 'getStatistics']); 
        // ✅ Obtener todas las pruebas maestras (solo admin/docente)
        Route::get('/pruebas', [PruebaDiagnosticaController::class, 'getAllPruebas']);

        // Listar todas las pruebas (solo admin y docente)
        Route::get('/', [PruebaDiagnosticaController::class, 'index']); 

        // Detalle de prueba diagnóstica
        Route::get('/{id}', [PruebaDiagnosticaController::class, 'show']); 
        Route::delete('/{id}', [PruebaDiagnosticaController::class, 'destroyPrueba']);
        // Registrar resultado de prueba
        Route::post('/', [PruebaDiagnosticaController::class, 'store']); 

        // Pruebas realizadas por estudiante
        Route::get('/estudiante/{userId}', [PruebaDiagnosticaController::class, 'getByStudent']); 

        // Asignar categoría según puntaje
        Route::post('/{userId}/assign-category', [PruebaDiagnosticaController::class, 'assignCategory']); 

        // Recomendaciones
        Route::get('/{userId}/recommendations', [PruebaDiagnosticaController::class, 'getRecommendations']); 

        // Estadísticas generales
        Route::post('/pruebas', [PruebaDiagnosticaController::class, 'storePrueba']);

        Route::get('/{id}/preguntas', [PruebaDiagnosticaController::class, 'getPreguntas']);
        Route::get('/pruebas/{id}/preguntas', [PruebaDiagnosticaController::class, 'getPreguntas']);

        // Agregar pregunta
        Route::post('/{id}/preguntas', [PruebaDiagnosticaController::class, 'storePregunta']);

        // Obtener preguntas
        Route::get('/{id}/preguntas', [PruebaDiagnosticaController::class, 'getPreguntas']);
            




        // Editar pregunta
        Route::put('/preguntas/{id}', [PruebaDiagnosticaController::class, 'updatePregunta']);

        // Eliminar pregunta
        Route::delete('/preguntas/{id}', [PruebaDiagnosticaController::class, 'destroyPregunta']);

        Route::post('/guardar-respuestas/{prueba_id}', [PruebaDiagnosticaController::class, 'enviarRespuestas']);
        // Obtener todos los resultados de pruebas diagnósticas (para docentes)

        
    });


    
    /*
    |--------------------------------------------------------------------------
    | RUTAS DE DATOS DE USO / ANALYTICS
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->prefix('datos-uso')->group(function () {
        Route::get('/export', [DatosUsoController::class, 'exportUsageData']); // Exportar datos para ML
        Route::post('/log', [DatosUsoController::class, 'logSession']); // Registrar sesión de uso
        Route::get('/{userId}', [DatosUsoController::class, 'getUsage']); // Historial de uso de estudiante
        Route::get('/{userId}/stats', [DatosUsoController::class, 'getUsageStats']); // Estadísticas de uso
        Route::get('/estadisticas-diarias', [DatosUsoController::class, 'getDailyStats']); // Estadísticas diarias del sistema
        Route::get('/engagement', [DatosUsoController::class, 'getEngagementMetrics']); // Métricas de participación
        Route::get('/export-csv', [DatosUsoController::class, 'exportUsageCSV']); // CSV
    });
    /*
    |--------------------------------------------------------------------------
    | RUTAS DE JUGADAS / SESIONES DE JUEGO
    |--------------------------------------------------------------------------
    */
    Route::middleware('auth:sanctum')->prefix('jugadas')->group(function () {
        Route::post('/start', [JugadaController::class, 'start']); // Iniciar nueva jugada
        Route::post('/finish', [JugadaController::class, 'finish']); // Finalizar jugada con puntos
        Route::post('/pause', [JugadaController::class, 'pause']); // Pausar jugada
        Route::post('/resume', [JugadaController::class, 'resume']); // Reanudar jugada pausada
        Route::get('/estudiante/{userId}', [JugadaController::class, 'getByStudent']); // Historial de jugadas por estudiante
        Route::get('/juego/{juegoId}', [JugadaController::class, 'getByJuego']); // Todas las jugadas de un juego
        Route::get('/estudiante/{userId}/activas', [JugadaController::class, 'getActiveGames']); // Juegos activos/pausados
        Route::get('/juego/{juegoId}/estadisticas', [JugadaController::class, 'getGameStats']); // Estadísticas de un juego
    });

    Route::prefix('asistencias')->group(function () {
        Route::get('/', [AsistenciaController::class, 'index']); // Listar todas
        Route::post('/', [AsistenciaController::class, 'store']); // Registrar nueva
        Route::put('/{id}', [AsistenciaController::class, 'update']); // Actualizar
        Route::get('/estudiante/{id}', [AsistenciaController::class, 'show']); // Por estudiante
    });
    
    Route::middleware('auth:sanctum')->prefix('recursos')->group(function () {

            // 🔹 Recursos (Docente)
        Route::get('/docente/{docente_id}', [RecursoController::class, 'getByDocente']);
        Route::get('/', [RecursoController::class, 'index']);
        Route::post('/', [RecursoController::class, 'store']);
        Route::delete('/{id}', [RecursoController::class, 'destroy']);
        Route::post('/{id}/visibilidad', [RecursoController::class, 'cambiarVisibilidad']);


        // 🔹 Recursos (Estudiante)
        Route::get('/estudiantes', [RecursoController::class, 'getParaEstudiantes']); // listar recursos visibles para estudiantes

        // 🔹 Descargar recurso


    });
    Route::get('recursos/descargar/{id}', [RecursoController::class, 'descargar']);


    // Ruta por defecto para verificar que la API funciona
    Route::get('/test', function () {
        return response()->json([
            'success' => true,
            'message' => 'API funcionando correctamente',
            'timestamp' => now()
        ]);
    });