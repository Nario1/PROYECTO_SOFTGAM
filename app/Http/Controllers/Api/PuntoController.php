<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PuntoController extends Controller
{
    /**
     * Agregar puntos a un estudiante
     */
    public function addPoints(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'cantidad' => 'required|integer|min:1',
            'motivo' => 'required|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Verificar que el usuario sea estudiante
            $estudiante = DB::table('users')
                ->where('id', $request->user_id)
                ->where('rol', 'estudiante')
                ->first();

            if (!$estudiante) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden otorgar puntos a estudiantes'
                ], 400);
            }

            // Agregar puntos
            $puntoId = DB::table('puntos')->insertGetId([
                'user_id' => $request->user_id,
                'cantidad' => $request->cantidad,
                'motivo' => $request->motivo,
                'fecha' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Calcular total actual de puntos
            $totalPuntos = $this->calculateTotalPoints($request->user_id);

            // Verificar si debe subir de nivel
            $this->checkLevelUp($request->user_id, $totalPuntos);

            // Verificar si puede obtener nuevas insignias
            $this->checkNewBadges($request->user_id);

            // Actualizar ranking
            $this->updateRanking($request->user_id);

            return response()->json([
                'success' => true,
                'message' => 'Puntos otorgados exitosamente',
                'data' => [
                    'punto_id' => $puntoId,
                    'estudiante' => $estudiante->nombre . ' ' . $estudiante->apellido,
                    'puntos_otorgados' => $request->cantidad,
                    'motivo' => $request->motivo,
                    'total_puntos' => $totalPuntos,
                    'fecha' => now()
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al otorgar puntos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restar puntos a un estudiante (penalizaciones)
     */
    public function subtractPoints(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'cantidad' => 'required|integer|min:1',
            'motivo' => 'required|string|max:100'
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
                    'message' => 'Solo se pueden restar puntos a estudiantes'
                ], 400);
            }

            // Calcular puntos actuales
            $puntosActuales = $this->calculateTotalPoints($request->user_id);

            // Agregar puntos negativos
            $puntoId = DB::table('puntos')->insertGetId([
                'user_id' => $request->user_id,
                'cantidad' => -$request->cantidad, // Negativo
                'motivo' => $request->motivo,
                'fecha' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $nuevoTotal = $puntosActuales - $request->cantidad;

            // Actualizar ranking
            $this->updateRanking($request->user_id);

            return response()->json([
                'success' => true,
                'message' => 'Puntos descontados exitosamente',
                'data' => [
                    'punto_id' => $puntoId,
                    'estudiante' => $estudiante->nombre . ' ' . $estudiante->apellido,
                    'puntos_descontados' => $request->cantidad,
                    'motivo' => $request->motivo,
                    'total_puntos' => max(0, $nuevoTotal), // No permitir puntos negativos
                    'fecha' => now()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al descontar puntos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

        /**
     * Obtener puntos totales de un estudiante
     */
    public function getPoints($userId, Request $request)
    {
        try {
            $user = $request->user();

            // Verificar permisos: admin, docente o el mismo estudiante
            if ($user->rol === 'estudiante' && $user->id != $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver los puntos de otros estudiantes'
                ], 403);
            }

            // Verificar que el usuario existe y es estudiante
            $estudiante = DB::table('users')
                ->where('id', $userId)
                ->where('rol', 'estudiante')
                ->first();

            if (!$estudiante) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estudiante no encontrado'
                ], 404);
            }

            $totalPuntos = $this->calculateTotalPoints($userId);

            // Obtener nivel actual
            $nivelActual = $this->getCurrentLevel($userId, $totalPuntos);

            // Calcular puntos para siguiente nivel
            $siguienteNivel = DB::table('niveles')
                ->where('requisito_puntos', '>', $totalPuntos)
                ->orderBy('requisito_puntos', 'asc')
                ->first();

            $puntosParaSiguienteNivel = $siguienteNivel 
                ? $siguienteNivel->requisito_puntos - $totalPuntos 
                : 0;

            // Obtener posición en ranking
            $posicionRanking = $this->getRankingPosition($userId);

            // Estadísticas de obtención de puntos
            $estadisticasPuntos = DB::table('puntos')
                ->where('user_id', $userId)
                ->selectRaw('
                    COUNT(*) as total_transacciones,
                    COUNT(CASE WHEN cantidad > 0 THEN 1 END) as puntos_ganados_veces,
                    COUNT(CASE WHEN cantidad < 0 THEN 1 END) as penalizaciones,
                    MAX(cantidad) as mayor_ganancia,
                    MIN(cantidad) as mayor_perdida,
                    SUM(CASE WHEN cantidad > 0 THEN cantidad ELSE 0 END) as total_ganado,
                    SUM(CASE WHEN cantidad < 0 THEN ABS(cantidad) ELSE 0 END) as total_perdido
                ')
                ->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'estudiante' => [
                        'id' => $estudiante->id,
                        'nombre' => $estudiante->nombre . ' ' . $estudiante->apellido
                    ],
                    'puntos' => [
                        'total' => $totalPuntos,
                        'para_siguiente_nivel' => $puntosParaSiguienteNivel,
                        'progreso_nivel' => $nivelActual ? 
                            round((($totalPuntos - $nivelActual->requisito_puntos) / 
                                max(1, ($siguienteNivel->requisito_puntos ?? $totalPuntos) - $nivelActual->requisito_puntos)) * 100, 1) 
                            : 0
                    ],
                    'nivel_actual' => $nivelActual ? [
                        'id' => $nivelActual->id,
                        'nombre' => $nivelActual->nombre,
                        'descripcion' => $nivelActual->descripcion,
                        'requisito_puntos' => $nivelActual->requisito_puntos
                    ] : null,
                    'siguiente_nivel' => $siguienteNivel ? [
                        'id' => $siguienteNivel->id,
                        'nombre' => $siguienteNivel->nombre,
                        'requisito_puntos' => $siguienteNivel->requisito_puntos
                    ] : null,
                    'ranking' => [
                        'posicion' => $posicionRanking,
                        'total_estudiantes' => $this->getTotalStudentsWithPoints()
                    ],
                    'estadisticas' => [
                        'total_transacciones' => $estadisticasPuntos->total_transacciones ?? 0,
                        'puntos_ganados_veces' => $estadisticasPuntos->puntos_ganados_veces ?? 0,
                        'penalizaciones' => $estadisticasPuntos->penalizaciones ?? 0,
                        'mayor_ganancia' => $estadisticasPuntos->mayor_ganancia ?? 0,
                        'mayor_perdida' => abs($estadisticasPuntos->mayor_perdida ?? 0),
                        'total_ganado' => $estadisticasPuntos->total_ganado ?? 0,
                        'total_perdido' => $estadisticasPuntos->total_perdido ?? 0
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener puntos',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Obtener historial de puntos de un estudiante
     */
    public function getHistory($userId, Request $request)
    {
        try {
            $user = $request->user();

            // Verificar permisos
            if ($user->rol === 'estudiante' && $user->id != $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver el historial de otros estudiantes'
                ], 403);
            }

            // Verificar que sea estudiante
            $estudiante = DB::table('users')
                ->where('id', $userId)
                ->where('rol', 'estudiante')
                ->first();

            if (!$estudiante) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estudiante no encontrado'
                ], 404);
            }

            // Filtros opcionales
            $fechaDesde = $request->get('fecha_desde');
            $fechaHasta = $request->get('fecha_hasta');
            $soloGanancias = $request->get('solo_ganancias', false);
            $soloPerdidas = $request->get('solo_perdidas', false);

            $query = DB::table('puntos')
                ->where('user_id', $userId)
                ->select('id', 'cantidad', 'motivo', 'fecha', 'created_at')
                ->orderBy('fecha', 'desc');

            if ($fechaDesde) {
                $query->whereDate('fecha', '>=', $fechaDesde);
            }

            if ($fechaHasta) {
                $query->whereDate('fecha', '<=', $fechaHasta);
            }

            if ($soloGanancias) {
                $query->where('cantidad', '>', 0);
            }

            if ($soloPerdidas) {
                $query->where('cantidad', '<', 0);
            }

            $historial = $query->get();

            // Calcular running total (puntos acumulados)
            $runningTotal = $this->calculateTotalPoints($userId);
            $historialConTotal = collect();

            foreach ($historial as $punto) {
                $historialConTotal->push([
                    'id' => $punto->id,
                    'cantidad' => $punto->cantidad,
                    'motivo' => $punto->motivo,
                    'fecha' => $punto->fecha,
                    'tipo' => $punto->cantidad > 0 ? 'ganancia' : 'penalizacion',
                    'total_acumulado' => $runningTotal
                ]);
                
                $runningTotal -= $punto->cantidad; // Restar para el siguiente (orden descendente)
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'estudiante' => [
                        'id' => $estudiante->id,
                        'nombre' => $estudiante->nombre . ' ' . $estudiante->apellido
                    ],
                    'historial' => $historialConTotal,
                    'resumen' => [
                        'total_registros' => $historial->count(),
                        'total_puntos_actuales' => $this->calculateTotalPoints($userId),
                        'filtros_aplicados' => [
                            'fecha_desde' => $fechaDesde,
                            'fecha_hasta' => $fechaHasta,
                            'solo_ganancias' => $soloGanancias,
                            'solo_perdidas' => $soloPerdidas
                        ]
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener historial',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener leaderboard/ranking general
     */
    public function getLeaderboard(Request $request)
    {
        try {
            $limite = min($request->get('limit', 10), 50); // Máximo 50

            // Calcular ranking por puntos totales
            $ranking = DB::table('users')
                ->join(DB::raw('(
                    SELECT user_id, SUM(cantidad) as total_puntos 
                    FROM puntos 
                    GROUP BY user_id
                ) as puntos_totales'), 'users.id', '=', 'puntos_totales.user_id')
                ->where('users.rol', 'estudiante')
                ->select(
                    'users.id',
                    'users.nombre',
                    'users.apellido',
                    'puntos_totales.total_puntos'
                )
                ->orderBy('puntos_totales.total_puntos', 'desc')
                ->limit($limite)
                ->get();

            // Enriquecer con información adicional
            $leaderboard = $ranking->map(function($estudiante, $index) {
                // Obtener nivel actual
                $nivel = $this->getCurrentLevel($estudiante->id, $estudiante->total_puntos);

                // Obtener total de insignias
                $totalInsignias = DB::table('estudiante_insignias')
                    ->where('user_id', $estudiante->id)
                    ->count();

                return [
                    'posicion' => $index + 1,
                    'estudiante' => [
                        'id' => $estudiante->id,
                        'nombre' => $estudiante->nombre . ' ' . $estudiante->apellido
                    ],
                    'puntos_totales' => $estudiante->total_puntos,
                    'nivel_actual' => $nivel ? [
                        'id' => $nivel->id,
                        'nombre' => $nivel->nombre
                    ] : null,
                    'total_insignias' => $totalInsignias,
                    'puntuacion_gamificacion' => $this->calculateGamificationScore($estudiante->total_puntos, $totalInsignias)
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'leaderboard' => $leaderboard,
                    'metadatos' => [
                        'total_mostrados' => $leaderboard->count(),
                        'generado_en' => now(),
                        'criterio_ordenacion' => 'puntos_totales_desc'
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener leaderboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener top estudiantes con más puntos
     */
    public function getTopStudents(Request $request)
    {
        try {
            $limite = min($request->get('limit', 10), 20);
            $periodo = $request->get('periodo', 'todo'); // todo, semana, mes

            $query = DB::table('users')
                ->join('puntos', 'users.id', '=', 'puntos.user_id')
                ->where('users.rol', 'estudiante');

            // Aplicar filtro de período
            switch ($periodo) {
                case 'semana':
                    $query->where('puntos.fecha', '>=', now()->subWeek());
                    break;
                case 'mes':
                    $query->where('puntos.fecha', '>=', now()->subMonth());
                    break;
                // 'todo' no necesita filtro adicional
            }

            $topStudents = $query
                ->select(
                    'users.id',
                    'users.nombre',
                    'users.apellido',
                    DB::raw('SUM(puntos.cantidad) as puntos_periodo'),
                    DB::raw('COUNT(puntos.id) as actividades_completadas')
                )
                ->groupBy('users.id', 'users.nombre', 'users.apellido')
                ->orderBy('puntos_periodo', 'desc')
                ->limit($limite)
                ->get();

            $estudiantesEnriquecidos = $topStudents->map(function($estudiante, $index) {
                $puntosTotal = $this->calculateTotalPoints($estudiante->id);
                $nivel = $this->getCurrentLevel($estudiante->id, $puntosTotal);

                return [
                    'posicion' => $index + 1,
                    'estudiante' => [
                        'id' => $estudiante->id,
                        'nombre' => $estudiante->nombre . ' ' . $estudiante->apellido
                    ],
                    'puntos_periodo' => $estudiante->puntos_periodo,
                    'puntos_totales' => $puntosTotal,
                    'actividades_completadas' => $estudiante->actividades_completadas,
                    'nivel_actual' => $nivel ? $nivel->nombre : 'Sin nivel',
                    'promedio_puntos_actividad' => $estudiante->actividades_completadas > 0 
                        ? round($estudiante->puntos_periodo / $estudiante->actividades_completadas, 1)
                        : 0
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'top_students' => $estudiantesEnriquecidos,
                    'periodo' => $periodo,
                    'total_mostrados' => $estudiantesEnriquecidos->count(),
                    'generado_en' => now()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener top estudiantes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas generales de puntos del sistema
     */
    public function getSystemStats(Request $request)
    {
        try {
            $user = $request->user();

            // Solo admin y docentes pueden ver estadísticas del sistema
            if (!in_array($user->rol, ['admin', 'docente'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver estadísticas del sistema'
                ], 403);
            }

            $stats = [
                'puntos_generales' => [
                    'total_puntos_otorgados' => DB::table('puntos')->where('cantidad', '>', 0)->sum('cantidad'),
                    'total_penalizaciones' => abs(DB::table('puntos')->where('cantidad', '<', 0)->sum('cantidad')),
                    'promedio_puntos_estudiante' => DB::table(DB::raw('(SELECT user_id, SUM(cantidad) as total_puntos FROM puntos GROUP BY user_id) as totales'))
                    ->join('users', 'totales.user_id', '=', 'users.id')
                    ->where('users.rol', 'estudiante')
                    ->avg('total_puntos') ?? 0,

                ],
                'actividad_reciente' => [
                    'puntos_hoy' => DB::table('puntos')->whereDate('fecha', today())->sum('cantidad'),
                    'transacciones_hoy' => DB::table('puntos')->whereDate('fecha', today())->count(),
                    'estudiantes_activos_hoy' => DB::table('puntos')->whereDate('fecha', today())->distinct('user_id')->count()
                ],
                'distribucion' => [
                    'estudiantes_con_puntos' => DB::table('puntos')->distinct('user_id')->count(),
                    'estudiantes_sin_puntos' => DB::table('users')->where('rol', 'estudiante')
                        ->whereNotIn('id', function($query) {
                            $query->select('user_id')->from('puntos');
                        })->count()
                ]
            ];

            // Si es admin, agregar más detalles
            if ($user->rol === 'admin') {
                $stats['motivos_frecuentes'] = DB::table('puntos')
                    ->select('motivo', DB::raw('COUNT(*) as frecuencia'), DB::raw('SUM(cantidad) as total_puntos'))
                    ->groupBy('motivo')
                    ->orderBy('frecuencia', 'desc')
                    ->limit(10)
                    ->get();
            }

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============= MÉTODOS AUXILIARES =============

    /**
     * Calcular puntos totales de un estudiante
     */
    private function calculateTotalPoints($userId)
    {
        return DB::table('puntos')
            ->where('user_id', $userId)
            ->sum('cantidad') ?? 0;
    }

    /**
     * Verificar si el estudiante debe subir de nivel
     */
    private function checkLevelUp($userId, $totalPuntos)
    {
        // Obtener nivel actual
        $nivelActual = DB::table('estudiante_niveles')
            ->join('niveles', 'estudiante_niveles.nivel_id', '=', 'niveles.id')
            ->where('estudiante_niveles.user_id', $userId)
            ->orderBy('niveles.requisito_puntos', 'desc')
            ->first();

        // Buscar siguiente nivel disponible
        $siguienteNivel = DB::table('niveles')
            ->where('requisito_puntos', '<=', $totalPuntos)
            ->where('requisito_puntos', '>', $nivelActual->requisito_puntos ?? 0)
            ->orderBy('requisito_puntos', 'desc')
            ->first();

        if ($siguienteNivel) {
            // Asignar nuevo nivel
            DB::table('estudiante_niveles')->insert([
                'user_id' => $userId,
                'nivel_id' => $siguienteNivel->id,
                'fecha_asignacion' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
    }

    /**
     * Verificar insignias disponibles para el estudiante
     */
    private function checkNewBadges($userId)
    {
        // Esta función se implementaría completamente en InsigniaController
        // Por ahora es un placeholder
    }

    /**
     * Actualizar posición en ranking
     */
    private function updateRanking($userId)
    {
        $totalPuntos = $this->calculateTotalPoints($userId);
        $posicion = $this->calculateRankingPosition($userId, $totalPuntos);

        // Actualizar o crear registro de ranking
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
     * Obtener nivel actual del estudiante
     */
    private function getCurrentLevel($userId, $totalPuntos)
    {
        return DB::table('niveles')
            ->where('requisito_puntos', '<=', $totalPuntos)
            ->orderBy('requisito_puntos', 'desc')
            ->first();
    }

    /**
     * Obtener posición en ranking
     */
    private function getRankingPosition($userId)
    {
        $ranking = DB::table('ranking')
            ->where('user_id', $userId)
            ->value('posicion');
        
        return $ranking ?? $this->calculateRankingPosition($userId, $this->calculateTotalPoints($userId));
    }

    /**
     * Calcular posición en ranking
     */
    private function calculateRankingPosition($userId, $totalPuntos)
    {
        $posicion = DB::table('puntos')
            ->join('users', 'puntos.user_id', '=', 'users.id')
            ->where('users.rol', 'estudiante')
            ->select('puntos.user_id', DB::raw('SUM(puntos.cantidad) as total'))
            ->groupBy('puntos.user_id')
            ->having('total', '>', $totalPuntos)
            ->count();

        return $posicion + 1;
    }

    /**
     * Obtener total de estudiantes con puntos
     */
    private function getTotalStudentsWithPoints()
    {
        return DB::table('puntos')
            ->join('users', 'puntos.user_id', '=', 'users.id')
            ->where('users.rol', 'estudiante')
            ->distinct('puntos.user_id')
            ->count();
    }

    /**
     * Calcular puntuación de gamificación (puntos + insignias)
     */
    private function calculateGamificationScore($puntos, $insignias)
    {
        return $puntos + ($insignias * 50); // Cada insignia vale 50 puntos extra
    }
}