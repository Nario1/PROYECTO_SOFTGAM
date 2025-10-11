<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class InsigniaController extends Controller
{
    /**
     * Listar todas las insignias - Diferenciado por rol
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            switch ($user->rol) {
                case 'estudiante':
                    return $this->getInsigniasParaEstudiante($user);
                case 'docente':
                    return $this->getInsigniasParaDocente($user);
                case 'admin':
                    return $this->getInsigniasParaAdmin($user);
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Rol no válido'
                    ], 403);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener insignias',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vista de insignias para ESTUDIANTE - Con estado de obtención
     */
    private function getInsigniasParaEstudiante($user)
    {
        // Obtener todas las insignias
        $insignias = DB::table('insignias')->get();

        // Obtener insignias ya obtenidas por el estudiante
        $insigniasObtenidas = DB::table('estudiante_insignias')
            ->where('user_id', $user->id)
            ->pluck('insignia_id')
            ->toArray();

        // Obtener datos actuales del estudiante para verificar criterios
        $datosEstudiante = $this->obtenerDatosEstudiante($user->id);

        $insigniasConEstado = $insignias->map(function($insignia) use ($insigniasObtenidas, $datosEstudiante, $user) {
            $obtenida = in_array($insignia->id, $insigniasObtenidas);
            $cumpleCriterios = $this->verificarCriteriosInsignia($insignia->id, $insignia->criterio, $datosEstudiante);

            // Obtener fecha de obtención si la tiene
            $fechaObtencion = null;
            if ($obtenida) {
                $fechaObtencion = DB::table('estudiante_insignias')
                    ->where('user_id', $user->id)
                    ->where('insignia_id', $insignia->id)
                    ->value('fecha');
            }

            return [
                'id' => $insignia->id,
                'nombre' => $insignia->nombre,
                'descripcion' => $insignia->descripcion,
                'criterio' => $insignia->criterio,
                'estado' => [
                    'obtenida' => $obtenida,
                    'disponible' => $cumpleCriterios && !$obtenida,
                    'bloqueada' => !$cumpleCriterios && !$obtenida,
                    'puede_obtener' => $cumpleCriterios && !$obtenida
                ],
                'fecha_obtencion' => $fechaObtencion,
                'progreso_criterio' => $this->calcularProgresoCriterio($insignia->criterio, $datosEstudiante)
            ];
        });

        // Verificar si puede obtener insignias nuevas ahora
        $insigniasDisponibles = $insigniasConEstado->where('estado.puede_obtener', true);

        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'estudiante',
                'insignias' => $insigniasConEstado->sortByDesc('estado.obtenida')->values(),
                'resumen' => [
                    'total_insignias' => $insignias->count(),
                    'insignias_obtenidas' => count($insigniasObtenidas),
                    'insignias_disponibles' => $insigniasDisponibles->count(),
                    'porcentaje_completitud' => $insignias->count() > 0 ? 
                        round((count($insigniasObtenidas) / $insignias->count()) * 100, 1) : 0
                ],
                'datos_estudiante' => [
                    'nivel_actual' => $datosEstudiante['nivel_actual'],
                    'puntos_totales' => $datosEstudiante['puntos_totales'],
                    'total_jugadas' => $datosEstudiante['total_jugadas']
                ],
                'nuevas_disponibles' => $insigniasDisponibles->values()
            ]
        ]);
    }

    /**
     * Vista de insignias para DOCENTE - Con estadísticas de estudiantes
     */
    private function getInsigniasParaDocente($user)
    {
        $insignias = DB::table('insignias')
            ->leftJoin('estudiante_insignias', 'insignias.id', '=', 'estudiante_insignias.insignia_id')
            ->leftJoin('users', 'estudiante_insignias.user_id', '=', 'users.id')
            ->select(
                'insignias.*',
                DB::raw('COUNT(DISTINCT estudiante_insignias.user_id) as estudiantes_con_insignia'),
                DB::raw('COUNT(CASE WHEN estudiante_insignias.fecha >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as obtenidas_esta_semana')
            )
            ->groupBy('insignias.id', 'insignias.nombre', 'insignias.descripcion', 'insignias.criterio', 'insignias.created_at', 'insignias.updated_at')
            ->orderBy('estudiantes_con_insignia', 'desc')
            ->get();

        // Obtener estudiantes más activos en insignias
        $estudiantesDestacados = DB::table('users')
            ->join('estudiante_insignias', 'users.id', '=', 'estudiante_insignias.user_id')
            ->where('users.rol', 'estudiante')
            ->select(
                'users.nombre',
                'users.apellido',
                DB::raw('COUNT(*) as total_insignias'),
                DB::raw('MAX(estudiante_insignias.fecha) as ultima_insignia')
            )
            ->groupBy('users.id', 'users.nombre', 'users.apellido')
            ->orderBy('total_insignias', 'desc')
            ->limit(10)
            ->get();

        $insigniasParaDocente = $insignias->map(function($insignia) {
            // Analizar la dificultad de la insignia
            $dificultad = $this->analizarDificultadInsignia($insignia->criterio);
            $popularidad = $this->calcularPopularidadInsignia($insignia->estudiantes_con_insignia);

            return [
                'id' => $insignia->id,
                'nombre' => $insignia->nombre,
                'descripcion' => $insignia->descripcion,
                'criterio' => $insignia->criterio,
                'estadisticas' => [
                    'estudiantes_con_insignia' => $insignia->estudiantes_con_insignia,
                    'obtenidas_esta_semana' => $insignia->obtenidas_esta_semana,
                    'dificultad_estimada' => $dificultad,
                    'popularidad' => $popularidad,
                    'tasa_obtencion' => $this->calcularTasaObtencion($insignia->id)
                ],
                'analisis' => [
                    'es_popular' => $popularidad === 'alta',
                    'es_dificil' => $dificultad === 'alta',
                    'necesita_atencion' => $insignia->estudiantes_con_insignia == 0,
                    'trending' => $insignia->obtenidas_esta_semana > 0
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'docente',
                'insignias' => $insigniasParaDocente,
                'estudiantes_destacados' => $estudiantesDestacados,
                'resumen_docente' => [
                    'total_insignias_sistema' => $insignias->count(),
                    'insignias_populares' => $insigniasParaDocente->where('analisis.es_popular', true)->count(),
                    'insignias_sin_obtener' => $insigniasParaDocente->where('analisis.necesita_atencion', true)->count(),
                    'insignias_trending' => $insigniasParaDocente->where('analisis.trending', true)->count()
                ]
            ]
        ]);
    }

    /**
     * Vista de insignias para ADMIN - Gestión completa
     */
    private function getInsigniasParaAdmin($user)
    {
        $insignias = DB::table('insignias')
            ->leftJoin('estudiante_insignias', 'insignias.id', '=', 'estudiante_insignias.insignia_id')
            ->select(
                'insignias.*',
                DB::raw('COUNT(estudiante_insignias.user_id) as total_otorgadas'),
                DB::raw('COUNT(DISTINCT estudiante_insignias.user_id) as estudiantes_unicos'),
                DB::raw('MIN(estudiante_insignias.fecha) as primera_obtencion'),
                DB::raw('MAX(estudiante_insignias.fecha) as ultima_obtencion'),
                DB::raw('COUNT(CASE WHEN estudiante_insignias.fecha >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as obtenidas_ultimo_mes')
            )
            ->groupBy('insignias.id', 'insignias.nombre', 'insignias.descripcion', 'insignias.criterio', 'insignias.created_at', 'insignias.updated_at')
            ->orderBy('insignias.created_at', 'desc')
            ->get();

        // Análisis del sistema de insignias
        $analisisSistema = [
            'distribucion_por_tipo' => $this->analizarTiposInsignias(),
            'eficacia_criterios' => $this->analizarEficaciaCriterios(),
            'estudiantes_sin_insignias' => DB::table('users')
                ->where('rol', 'estudiante')
                ->whereNotIn('id', function($query) {
                    $query->select('user_id')->from('estudiante_insignias');
                })
                ->count(),
            'insignias_mas_codiciadas' => $this->obtenerInsigniasMasCodiciadas()
        ];

        $insigniasCompletas = $insignias->map(function($insignia) {
            $criteriosAnalisis = $this->analizarCriterioDetallado($insignia->criterio);
            $rendimiento = $this->evaluarRendimientoInsignia($insignia);

            return [
                'id' => $insignia->id,
                'nombre' => $insignia->nombre,
                'descripcion' => $insignia->descripcion,
                'criterio' => $insignia->criterio,
                'created_at' => $insignia->created_at,
                'estadisticas_completas' => [
                    'total_otorgadas' => $insignia->total_otorgadas,
                    'estudiantes_unicos' => $insignia->estudiantes_unicos,
                    'obtenidas_ultimo_mes' => $insignia->obtenidas_ultimo_mes,
                    'primera_obtencion' => $insignia->primera_obtencion,
                    'ultima_obtencion' => $insignia->ultima_obtencion,
                    'promedio_mensual' => $this->calcularPromedioMensual($insignia->id)
                ],
                'analisis_criterio' => $criteriosAnalisis,
                'rendimiento' => $rendimiento,
                'estado_salud' => [
                    'activa' => $insignia->total_otorgadas > 0,
                    'balanceada' => $rendimiento['tasa_obtencion'] >= 10 && $rendimiento['tasa_obtencion'] <= 80,
                    'muy_facil' => $rendimiento['tasa_obtencion'] > 80,
                    'muy_dificil' => $rendimiento['tasa_obtencion'] < 5,
                    'necesita_revision' => $insignia->total_otorgadas == 0 && 
                                         now()->diffInDays($insignia->created_at) > 30
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'admin',
                'insignias' => $insigniasCompletas,
                'analisis_sistema' => $analisisSistema,
                'metricas_globales' => [
                    'total_insignias' => $insignias->count(),
                    'insignias_activas' => $insigniasCompletas->where('estado_salud.activa', true)->count(),
                    'insignias_balanceadas' => $insigniasCompletas->where('estado_salud.balanceada', true)->count(),
                    'insignias_problematicas' => $insigniasCompletas->where('estado_salud.necesita_revision', true)->count(),
                    'total_otorgamientos' => $insignias->sum('total_otorgadas')
                ],
                'permisos' => [
                    'puede_crear' => true,
                    'puede_editar' => true,
                    'puede_eliminar' => true,
                    'puede_otorgar_manual' => true,
                    'puede_revocar' => true
                ]
            ]
        ]);
    }

    /**
     * Mostrar insignia específica con detalles
     */
    public function show($id, Request $request)
    {
        try {
            $user = $request->user();

            $insignia = DB::table('insignias')->where('id', $id)->first();

            if (!$insignia) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insignia no encontrada'
                ], 404);
            }

            // Extraer el criterio (ejemplo: "nivel:5") y obtener puntos requeridos
            $puntosRequeridos = 0;
            if (preg_match('/nivel:(\d+)/', $insignia->criterio, $matches)) {
                $nivel = (int)$matches[1];
                // Aquí defines la lógica de puntos por nivel
                $puntosRequeridos = $nivel * 60; // ejemplo: nivel 5 = 300 puntos
            }

            // Obtener estudiantes que cumplen el criterio de puntos
            $estudiantesConInsignia = DB::table('estudiante_insignias')
                ->join('users', 'estudiante_insignias.user_id', '=', 'users.id')
                ->leftJoin(DB::raw('(
                    SELECT user_id, SUM(cantidad) as total_puntos 
                    FROM puntos 
                    GROUP BY user_id
                ) as puntos_totales'), 'users.id', '=', 'puntos_totales.user_id')
                ->where('estudiante_insignias.insignia_id', $id)
                ->where('puntos_totales.total_puntos', '>=', $puntosRequeridos) // filtrar por puntos
                ->select(
                    'users.id',
                    'users.nombre',
                    'users.apellido',
                    'estudiante_insignias.fecha',
                    'puntos_totales.total_puntos'
                )
                ->orderBy('estudiante_insignias.fecha', 'desc')
                ->get();

            $response = [
                'id' => $insignia->id,
                'nombre' => $insignia->nombre,
                'descripcion' => $insignia->descripcion,
                'criterio' => $insignia->criterio,
                'created_at' => $insignia->created_at,
                'estudiantes_con_insignia' => $estudiantesConInsignia->map(function($estudiante) {
                    return [
                        'id' => $estudiante->id,
                        'nombre' => $estudiante->nombre . ' ' . $estudiante->apellido,
                        'fecha_obtencion' => $estudiante->fecha,
                        'puntos_cuando_obtuvo' => $estudiante->total_puntos ?? 0,
                        'dias_desde_obtencion' => now()->diffInDays($estudiante->fecha)
                    ];
                }),
                'estadisticas' => [
                    'total_otorgadas' => $estudiantesConInsignia->count(),
                    'primera_obtencion' => $estudiantesConInsignia->min('fecha'),
                    'ultima_obtencion' => $estudiantesConInsignia->max('fecha'),
                    'promedio_puntos_obtencion' => $estudiantesConInsignia->avg('total_puntos') ?? 0
                ]
            ];

            // Información personalizada para estudiante logueado
            if ($user->rol === 'estudiante') {
                $laHaObtenido = $estudiantesConInsignia->contains('id', $user->id);
                $datosEstudiante = $this->obtenerDatosEstudiante($user->id);
                $cumpleCriterios = $this->verificarCriteriosInsignia($id, $insignia->criterio, $datosEstudiante);

                $response['mi_estado'] = [
                    'la_tengo' => $laHaObtenido,
                    'puedo_obtenerla' => $cumpleCriterios && !$laHaObtenido,
                    'fecha_obtencion' => $laHaObtenido ? 
                        $estudiantesConInsignia->where('id', $user->id)->first()->fecha : null,
                    'progreso_criterio' => $this->calcularProgresoCriterio($insignia->criterio, $datosEstudiante)
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $response
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener insignia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nueva insignia - Solo ADMIN
     */
    public function store(Request $request)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden crear insignias'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:50|unique:insignias',
            'descripcion' => 'nullable|string',
            'criterio' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Validar que el criterio sea válido
            $criterioValido = $this->validarCriterio($request->criterio);
            if (!$criterioValido['valido']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Criterio inválido: ' . $criterioValido['error']
                ], 400);
            }

            $insigniaId = DB::table('insignias')->insertGetId([
                'nombre' => $request->nombre,
                'descripcion' => $request->descripcion,
                'criterio' => $request->criterio,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Verificar estudiantes que ya califican para esta insignia
            $estudiantesCalificados = $this->verificarEstudiantesCalificados($insigniaId, $request->criterio);

            return response()->json([
                'success' => true,
                'message' => 'Insignia creada exitosamente',
                'data' => [
                    'insignia_id' => $insigniaId,
                    'nombre' => $request->nombre,
                    'criterio' => $request->criterio,
                    'estudiantes_ya_califican' => count($estudiantesCalificados),
                    'se_otorgara_automaticamente' => count($estudiantesCalificados) > 0
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear insignia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar insignia - Solo ADMIN
     */
    public function update(Request $request, $id)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden editar insignias'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:50|unique:insignias,nombre,' . $id,
            'descripcion' => 'nullable|string',
            'criterio' => 'sometimes|required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Si se cambia el criterio, validarlo
            if ($request->has('criterio')) {
                $criterioValido = $this->validarCriterio($request->criterio);
                if (!$criterioValido['valido']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Criterio inválido: ' . $criterioValido['error']
                    ], 400);
                }
            }

            $affected = DB::table('insignias')
                ->where('id', $id)
                ->update(array_merge(
                    $request->only(['nombre', 'descripcion', 'criterio']),
                    ['updated_at' => now()]
                ));

            if ($affected === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insignia no encontrada'
                ], 404);
            }

            // Si se cambió el criterio, recalcular asignaciones
            if ($request->has('criterio')) {
                $this->recalcularAsignacionesInsignia($id, $request->criterio);
            }

            return response()->json([
                'success' => true,
                'message' => 'Insignia actualizada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar insignia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar insignia - Solo ADMIN
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden eliminar insignias'
            ], 403);
        }

        try {
            // Verificar si hay estudiantes con esta insignia
            $tieneEstudiantes = DB::table('estudiante_insignias')
                ->where('insignia_id', $id)
                ->exists();

            if ($tieneEstudiantes) {
                $totalEstudiantes = DB::table('estudiante_insignias')
                    ->where('insignia_id', $id)
                    ->count();

                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar la insignia porque ya ha sido otorgada a estudiantes',
                    'data' => [
                        'estudiantes_con_insignia' => $totalEstudiantes
                    ]
                ], 400);
            }

            $affected = DB::table('insignias')->where('id', $id)->delete();

            if ($affected === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insignia no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Insignia eliminada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar insignia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Otorgar insignia manualmente a estudiante - Solo ADMIN
     */
    public function assignBadge(Request $request)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden otorgar insignias manualmente'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'insignia_id' => 'required|exists:insignias,id',
            'razon' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar que sea estudiante
            $estudiante = DB::table('users')
                ->where('id', $request->user_id)
                ->where('rol', 'estudiante')
                ->first();

            if (!$estudiante) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden otorgar insignias a estudiantes'
                ], 400);
            }

            // Verificar que no la tenga ya
            $yaLaTiene = DB::table('estudiante_insignias')
                ->where('user_id', $request->user_id)
                ->where('insignia_id', $request->insignia_id)
                ->exists();

            if ($yaLaTiene) {
                return response()->json([
                    'success' => false,
                    'message' => 'El estudiante ya tiene esta insignia'
                ], 400);
            }

            // Otorgar insignia
            DB::table('estudiante_insignias')->insert([
                'user_id' => $request->user_id,
                'insignia_id' => $request->insignia_id,
                'fecha' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $insignia = DB::table('insignias')->where('id', $request->insignia_id)->first();

            // Actualizar ranking (las insignias afectan el ranking)
            $this->actualizarRankingPorInsignias($request->user_id);

            return response()->json([
                'success' => true,
                'message' => 'Insignia otorgada exitosamente',
                'data' => [
                    'estudiante' => $estudiante->nombre . ' ' . $estudiante->apellido,
                    'insignia' => $insignia->nombre,
                    'fecha_otorgamiento' => now(),
                    'razon' => $request->razon ?? 'Otorgamiento manual por administrador'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al otorgar insignia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verificar criterios y otorgar insignias automáticamente
     */
    /**
     * Verificar criterios y otorgar insignias automáticamente
     */
    public function checkCriteria($userId)
    {
        try {
            // Obtener estudiante
            $estudiante = DB::table('users')
                ->where('id', $userId)
                ->where('rol', 'estudiante')
                ->first();

            if (!$estudiante) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no es estudiante'
                ], 400);
            }

            // Obtener datos del estudiante (debe incluir 'nivel')
            $datosEstudiante = $this->obtenerDatosEstudiante($userId);

            // Obtener insignias disponibles
            $insigniasDisponibles = DB::table('insignias')
                ->leftJoin('estudiante_insignias', function($join) use ($userId) {
                    $join->on('insignias.id', '=', 'estudiante_insignias.insignia_id')
                        ->where('estudiante_insignias.user_id', $userId);
                })
                ->whereNull('estudiante_insignias.id')
                ->select('insignias.*')
                ->get();

            $insigniasOtorgadas = [];

            foreach ($insigniasDisponibles as $insignia) {
                // Verificar si el criterio es del tipo "nivel:X"
                if (str_starts_with($insignia->criterio, 'nivel:')) {
                    $nivelReq = intval(explode(':', $insignia->criterio)[1]);
                    if (isset($datosEstudiante['nivel']) && $datosEstudiante['nivel'] >= $nivelReq) {
                        // Otorgar insignia
                        DB::table('estudiante_insignias')->insert([
                            'user_id' => $userId,
                            'insignia_id' => $insignia->id,
                            'fecha' => now(),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);

                        $insigniasOtorgadas[] = [
                            'id' => $insignia->id,
                            'nombre' => $insignia->nombre,
                            'descripcion' => $insignia->descripcion,
                            'criterio' => $insignia->criterio
                        ];
                    }
                }
            }

            // Actualizar ranking si se otorgaron insignias
            if (!empty($insigniasOtorgadas)) {
                $this->actualizarRankingPorInsignias($userId);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user_id' => $userId,
                    'estudiante' => $estudiante->nombre . ' ' . $estudiante->apellido,
                    'insignias_nuevas' => $insigniasOtorgadas,
                    'total_nuevas' => count($insigniasOtorgadas),
                    'verificado_en' => now()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar criterios',
                // Opcional: quitar $e->getMessage() en producción
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Obtener insignias de un estudiante específico
     */
    public function getByStudent($studentId, Request $request)
    {
        try {
            $user = $request->user();

            // Verificar permisos: admin, docente o el mismo estudiante
            if ($user->rol === 'estudiante' && $user->id != $studentId) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver las insignias de otros estudiantes'
                ], 403);
            }

            // Verificar que el usuario existe y es estudiante
            $estudiante = DB::table('users')
                ->where('id', $studentId)
                ->where('rol', 'estudiante')
                ->first();

            if (!$estudiante) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estudiante no encontrado'
                ], 404);
            }

            // Obtener insignias del estudiante con información relevante
            $insigniasEstudiante = DB::table('estudiante_insignias')
                ->join('insignias', 'estudiante_insignias.insignia_id', '=', 'insignias.id')
                ->where('estudiante_insignias.user_id', $studentId)
                ->select(
                    'insignias.id',
                    'insignias.nombre',
                    'insignias.descripcion',
                    'insignias.criterio',
                    'estudiante_insignias.fecha as fecha_obtencion'
                )
                ->orderBy('estudiante_insignias.fecha', 'desc')
                ->get()
                ->map(function ($insignia) {
                    $fecha = \Carbon\Carbon::parse($insignia->fecha_obtencion);
                    return [
                        'id' => $insignia->id,
                        'nombre' => $insignia->nombre,
                        'descripcion' => $insignia->descripcion,
                        'criterio' => $insignia->criterio,
                        'fecha_obtencion' => $fecha->toDateString(),
                        'dias_desde_obtencion' => now()->diffInDays($fecha),
                    ];
                });

            // Devolver datos limpios para frontend
            return response()->json([
                'success' => true,
                'data' => [
                    'estudiante' => [
                        'id' => $estudiante->id,
                        'nombre' => $estudiante->nombre . ' ' . $estudiante->apellido
                    ],
                    'insignias' => $insigniasEstudiante
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener insignias del estudiante',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Revocar insignia de estudiante - Solo ADMIN
     */
    public function revokeBadge(Request $request)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden revocar insignias'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'insignia_id' => 'required|exists:insignias,id',
            'razon' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar que el estudiante tenga la insignia
            $tieneInsignia = DB::table('estudiante_insignias')
                ->where('user_id', $request->user_id)
                ->where('insignia_id', $request->insignia_id)
                ->first();

            if (!$tieneInsignia) {
                return response()->json([
                    'success' => false,
                    'message' => 'El estudiante no tiene esta insignia'
                ], 400);
            }

            // Revocar insignia
            DB::table('estudiante_insignias')
                ->where('user_id', $request->user_id)
                ->where('insignia_id', $request->insignia_id)
                ->delete();

            $estudiante = DB::table('users')->where('id', $request->user_id)->first();
            $insignia = DB::table('insignias')->where('id', $request->insignia_id)->first();

            // Actualizar ranking
            $this->actualizarRankingPorInsignias($request->user_id);

            return response()->json([
                'success' => true,
                'message' => 'Insignia revocada exitosamente',
                'data' => [
                    'estudiante' => $estudiante->nombre . ' ' . $estudiante->apellido,
                    'insignia_revocada' => $insignia->nombre,
                    'razon' => $request->razon,
                    'revocada_en' => now()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al revocar insignia',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============= MÉTODOS AUXILIARES =============

    /**
     * Obtener datos actuales del estudiante para verificar criterios
     */
    private function obtenerDatosEstudiante($userId)
    {
        // Puntos totales
        $puntosTotal = DB::table('puntos')->where('user_id', $userId)->sum('cantidad') ?? 0;

        // Nivel actual
        $nivelActual = DB::table('estudiante_niveles')
            ->join('niveles', 'estudiante_niveles.nivel_id', '=', 'niveles.id')
            ->where('estudiante_niveles.user_id', $userId)
            ->orderBy('niveles.requisito_puntos', 'desc')
            ->select('niveles.*')
            ->first();

        // Jugadas y estadísticas
        $estadisticasJugadas = DB::table('jugadas')
            ->where('user_id', $userId)
            ->selectRaw('
                COUNT(*) as total_jugadas,
                COUNT(CASE WHEN finalizado = 1 THEN 1 END) as jugadas_completadas,
                AVG(puntos_obtenidos) as promedio_puntos_jugada,
                MAX(puntos_obtenidos) as mejor_puntaje
            ')
            ->first();

        // Días activos
        $diasActivos = DB::table('jugadas')
            ->where('user_id', $userId)
            ->selectRaw('COUNT(DISTINCT DATE(inicio_juego)) as dias_unicos')
            ->value('dias_unicos') ?? 0;

        // Actividades completadas
        $actividadesCompletadas = DB::table('datos_uso')
            ->where('user_id', $userId)
            ->sum('actividades_completadas') ?? 0;

        // Tiempo total en sistema
        $tiempoTotal = DB::table('datos_uso')
            ->where('user_id', $userId)
            ->sum('tiempo_sesion') ?? 0;

        // Racha actual (días consecutivos)
        $rachaActual = $this->calcularRachaActual($userId);

        return [
            'puntos_totales' => $puntosTotal,
            'nivel_actual' => $nivelActual,
            'total_jugadas' => $estadisticasJugadas->total_jugadas ?? 0,
            'jugadas_completadas' => $estadisticasJugadas->jugadas_completadas ?? 0,
            'promedio_puntos_jugada' => $estadisticasJugadas->promedio_puntos_jugada ?? 0,
            'mejor_puntaje' => $estadisticasJugadas->mejor_puntaje ?? 0,
            'dias_activos' => $diasActivos,
            'actividades_completadas' => $actividadesCompletadas,
            'tiempo_total_minutos' => $tiempoTotal,
            'racha_actual' => $rachaActual,
            'fecha_registro' => DB::table('users')->where('id', $userId)->value('created_at')
        ];
    }

    /**
     * Verificar si cumple criterios de una insignia específica
     */
    private function verificarCriteriosInsignia($insigniaId, $criterio, $datosEstudiante)
    {
        // Parsear criterio (formato: "tipo:valor" ej: "puntos:1000", "nivel:5", "jugadas:50")
        $partes = explode(':', $criterio);
        if (count($partes) !== 2) return false;

        $tipo = $partes[0];
        $valor = is_numeric($partes[1]) ? (int)$partes[1] : $partes[1];

        switch ($tipo) {
            case 'puntos':
                return $datosEstudiante['puntos_totales'] >= $valor;
            
            case 'nivel':
                return $datosEstudiante['nivel_actual'] && 
                       $datosEstudiante['nivel_actual']->requisito_puntos >= $valor;
            
            case 'jugadas':
                return $datosEstudiante['total_jugadas'] >= $valor;
            
            case 'completadas':
                return $datosEstudiante['jugadas_completadas'] >= $valor;
            
            case 'racha':
                return $datosEstudiante['racha_actual'] >= $valor;
            
            case 'dias_activos':
                return $datosEstudiante['dias_activos'] >= $valor;
            
            case 'actividades':
                return $datosEstudiante['actividades_completadas'] >= $valor;
            
            case 'tiempo_horas':
                return ($datosEstudiante['tiempo_total_minutos'] / 60) >= $valor;
            
            case 'promedio_puntos':
                return $datosEstudiante['promedio_puntos_jugada'] >= $valor;
            
            case 'puntaje_perfecto':
                return $datosEstudiante['mejor_puntaje'] >= $valor;
            
            case 'veterano':
                $diasDesdeRegistro = now()->diffInDays($datosEstudiante['fecha_registro']);
                return $diasDesdeRegistro >= $valor;
            
            default:
                return false;
        }
    }

    /**
     * Calcular progreso hacia criterio de insignia
     */
    private function calcularProgresoCriterio($criterio, $datosEstudiante)
    {
        $partes = explode(':', $criterio);
        if (count($partes) !== 2) return ['progreso' => 0, 'objetivo' => 1];

        $tipo = $partes[0];
        $objetivo = is_numeric($partes[1]) ? (int)$partes[1] : 1;
        $actual = 0;

        switch ($tipo) {
            case 'puntos':
                $actual = $datosEstudiante['puntos_totales'];
                break;
            case 'jugadas':
                $actual = $datosEstudiante['total_jugadas'];
                break;
            case 'completadas':
                $actual = $datosEstudiante['jugadas_completadas'];
                break;
            case 'racha':
                $actual = $datosEstudiante['racha_actual'];
                break;
            case 'dias_activos':
                $actual = $datosEstudiante['dias_activos'];
                break;
            case 'actividades':
                $actual = $datosEstudiante['actividades_completadas'];
                break;
            case 'tiempo_horas':
                $actual = floor($datosEstudiante['tiempo_total_minutos'] / 60);
                break;
        }

        return [
            'actual' => $actual,
            'objetivo' => $objetivo,
            'porcentaje' => min(100, round(($actual / max(1, $objetivo)) * 100, 1))
        ];
    }

   
    /**
     * Verifica si el nivel del estudiante cumple con el criterio de la insignia
     * Formato del criterio: "nivel:1"
     */
    private function verificarNivelInsignia($criterio, $datosEstudiante)
    {
        list($tipo, $valor) = explode(":", $criterio);

        if ($tipo === "nivel") {
            return isset($datosEstudiante['nivel']) && $datosEstudiante['nivel'] >= (int)$valor;
        }

        return false;
    }



    /**
     * Validar formato de criterio
     */
    private function validarCriterio($criterio)
    {
        $tiposValidos = [
            'puntos', 'nivel', 'jugadas', 'completadas', 'racha', 
            'dias_activos', 'actividades', 'tiempo_horas', 
            'promedio_puntos', 'puntaje_perfecto', 'veterano'
        ];

        $partes = explode(':', $criterio);
        
        if (count($partes) !== 2) {
            return ['valido' => false, 'error' => 'Formato debe ser tipo:valor'];
        }

        if (!in_array($partes[0], $tiposValidos)) {
            return ['valido' => false, 'error' => 'Tipo de criterio no válido'];
        }

        if (!is_numeric($partes[1]) || $partes[1] < 0) {
            return ['valido' => false, 'error' => 'Valor debe ser numérico positivo'];
        }

        return ['valido' => true];
    }

    /**
     * Calcular racha actual del estudiante
     */
    private function calcularRachaActual($userId)
    {
        // Obtener fechas de actividad en orden descendente
        $fechasActividad = DB::table('datos_uso')
            ->where('user_id', $userId)
            ->where('fecha_ingreso', '>=', now()->subDays(90))
            ->selectRaw('DATE(fecha_ingreso) as fecha')
            ->distinct()
            ->orderBy('fecha', 'desc')
            ->pluck('fecha')
            ->toArray();

        if (empty($fechasActividad)) return 0;

        $racha = 0;
        $fechaAnterior = now()->toDateString();

        foreach ($fechasActividad as $fecha) {
            $diasDiferencia = now()->parse($fechaAnterior)->diffInDays($fecha);
            
            if ($diasDiferencia <= 1) {
                $racha++;
                $fechaAnterior = $fecha;
            } else {
                break;
            }
        }

        return $racha;
    }

    /**
     * Actualizar ranking basado en insignias
     */
    private function actualizarRankingPorInsignias($userId)
    {
        // El ranking se basa en cantidad de insignias
        $totalInsignias = DB::table('estudiante_insignias')
            ->where('user_id', $userId)
            ->count();

        // Calcular posición
        $posicion = DB::table('estudiante_insignias')
            ->select('user_id', DB::raw('COUNT(*) as total'))
            ->groupBy('user_id')
            ->having('total', '>', $totalInsignias)
            ->count() + 1;

        // Actualizar ranking
        DB::table('ranking')->updateOrInsert(
            ['user_id' => $userId],
            [
                'posicion' => $posicion,
                'fecha' => now(),
                'updated_at' => now()
            ]
        );
    }

    /**
     * Obtener posición en ranking por insignias
     */
    private function obtenerPosicionRankingPorInsignias($userId)
    {
        $totalInsignias = DB::table('estudiante_insignias')
            ->where('user_id', $userId)
            ->count();

        return DB::table('estudiante_insignias')
            ->select('user_id', DB::raw('COUNT(*) as total'))
            ->groupBy('user_id')
            ->having('total', '>', $totalInsignias)
            ->count() + 1;
    }

    /**
     * Verificar estudiantes que ya califican para nueva insignia
     */
    private function verificarEstudiantesCalificados($insigniaId, $criterio)
    {
        $estudiantes = DB::table('users')->where('rol', 'estudiante')->get();
        $calificados = [];

        foreach ($estudiantes as $estudiante) {
            $datos = $this->obtenerDatosEstudiante($estudiante->id);
            if ($this->verificarCriteriosInsignia($insigniaId, $criterio, $datos)) {
                $calificados[] = $estudiante->id;
                
                // Otorgar automáticamente
                DB::table('estudiante_insignias')->insert([
                    'user_id' => $estudiante->id,
                    'insignia_id' => $insigniaId,
                    'fecha' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
        }

        return $calificados;
    }

    /**
     * Recalcular asignaciones cuando se cambia criterio
     */
    private function recalcularAsignacionesInsignia($insigniaId, $nuevoCriterio)
    {
        // Remover estudiantes que ya no califican
        $estudiantesConInsignia = DB::table('estudiante_insignias')
            ->where('insignia_id', $insigniaId)
            ->pluck('user_id');

        foreach ($estudiantesConInsignia as $userId) {
            $datos = $this->obtenerDatosEstudiante($userId);
            if (!$this->verificarCriteriosInsignia($insigniaId, $nuevoCriterio, $datos)) {
                DB::table('estudiante_insignias')
                    ->where('user_id', $userId)
                    ->where('insignia_id', $insigniaId)
                    ->delete();
            }
        }

        // Otorgar a nuevos estudiantes que califican
        $this->verificarEstudiantesCalificados($insigniaId, $nuevoCriterio);
    }

    /**
     * Analizar dificultad de criterio de insignia
     */
    private function analizarDificultadInsignia($criterio)
    {
        $partes = explode(':', $criterio);
        if (count($partes) !== 2) return 'media';

        $tipo = $partes[0];
        $valor = (int)$partes[1];

        // Definir rangos de dificultad por tipo
        $rangos = [
            'puntos' => ['baja' => 500, 'media' => 2000, 'alta' => 5000],
            'jugadas' => ['baja' => 20, 'media' => 100, 'alta' => 300],
            'racha' => ['baja' => 7, 'media' => 30, 'alta' => 90],
            'dias_activos' => ['baja' => 10, 'media' => 50, 'alta' => 150]
        ];

        if (!isset($rangos[$tipo])) return 'media';

        if ($valor <= $rangos[$tipo]['baja']) return 'baja';
        if ($valor <= $rangos[$tipo]['media']) return 'media';
        return 'alta';
    }

    /**
     * Calcular popularidad de insignia
     */
    private function calcularPopularidadInsignia($estudiantesConInsignia)
    {
        $totalEstudiantes = DB::table('users')->where('rol', 'estudiante')->count();
        if ($totalEstudiantes == 0) return 'baja';

        $porcentaje = ($estudiantesConInsignia / $totalEstudiantes) * 100;

        if ($porcentaje >= 50) return 'alta';
        if ($porcentaje >= 20) return 'media';
        return 'baja';
    }

    /**
     * Calcular tasa de obtención de insignia
     */
    private function calcularTasaObtencion($insigniaId)
    {
        $totalEstudiantes = DB::table('users')->where('rol', 'estudiante')->count();
        $estudiantesConInsignia = DB::table('estudiante_insignias')
            ->where('insignia_id', $insigniaId)
            ->distinct('user_id')
            ->count();

        return $totalEstudiantes > 0 ? round(($estudiantesConInsignia / $totalEstudiantes) * 100, 1) : 0;
    }

    /**
     * Analizar tipos de insignias en el sistema
     */
    private function analizarTiposInsignias()
    {
        $insignias = DB::table('insignias')->pluck('criterio');
        $tipos = [];

        foreach ($insignias as $criterio) {
            $partes = explode(':', $criterio);
            $tipo = $partes[0] ?? 'desconocido';
            $tipos[$tipo] = ($tipos[$tipo] ?? 0) + 1;
        }

        return $tipos;
    }

    /**
     * Analizar eficacia de criterios
     */
    private function analizarEficaciaCriterios()
    {
        return DB::table('insignias')
            ->leftJoin('estudiante_insignias', 'insignias.id', '=', 'estudiante_insignias.insignia_id')
            ->selectRaw('
                SUBSTRING_INDEX(criterio, ":", 1) as tipo_criterio,
                COUNT(DISTINCT insignias.id) as total_insignias,
                COUNT(estudiante_insignias.id) as total_otorgadas,
                ROUND(AVG(CASE WHEN estudiante_insignias.id IS NOT NULL THEN 1 ELSE 0 END) * 100, 1) as tasa_exito
            ')
            ->groupBy('tipo_criterio')
            ->get();
    }

    /**
     * Obtener insignias más codiciadas (más estudiantes cerca de obtenerlas)
     */
    private function obtenerInsigniasMasCodiciadas()
    {
        // Esta función requeriría un análisis más complejo
        // Por simplicidad, retornamos las más populares
        return DB::table('insignias')
            ->join('estudiante_insignias', 'insignias.id', '=', 'estudiante_insignias.insignia_id')
            ->select('insignias.nombre', DB::raw('COUNT(*) as total_obtenidas'))
            ->groupBy('insignias.id', 'insignias.nombre')
            ->orderBy('total_obtenidas', 'desc')
            ->limit(5)
            ->get();
    }

    /**
     * Analizar criterio detallado
     */
    private function analizarCriterioDetallado($criterio)
    {
        $partes = explode(':', $criterio);
        return [
            'tipo' => $partes[0] ?? 'desconocido',
            'valor_requerido' => $partes[1] ?? 0,
            'dificultad_estimada' => $this->analizarDificultadInsignia($criterio),
            'es_progresivo' => in_array($partes[0] ?? '', ['puntos', 'jugadas', 'actividades', 'tiempo_horas'])
        ];
    }

    /**
     * Evaluar rendimiento de insignia
     */
    private function evaluarRendimientoInsignia($insignia)
    {
        $tasaObtencion = $this->calcularTasaObtencion($insignia->id);
        
        return [
            'tasa_obtencion' => $tasaObtencion,
            'total_otorgadas' => $insignia->total_otorgadas,
            'crecimiento_reciente' => $insignia->obtenidas_ultimo_mes,
            'estado' => $tasaObtencion < 5 ? 'muy_dificil' : 
                       ($tasaObtencion > 80 ? 'muy_facil' : 'balanceada')
        ];
    }

    /**
     * Calcular promedio mensual de otorgamientos
     */
    private function calcularPromedioMensual($insigniaId)
    {
        $fechaCreacion = DB::table('insignias')->where('id', $insigniaId)->value('created_at');
        $mesesExistencia = max(1, now()->diffInMonths($fechaCreacion));
        $totalOtorgadas = DB::table('estudiante_insignias')->where('insignia_id', $insigniaId)->count();
        
        return round($totalOtorgadas / $mesesExistencia, 1);
    }
}