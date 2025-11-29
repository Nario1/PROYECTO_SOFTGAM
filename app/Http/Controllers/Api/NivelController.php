<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class NivelController extends Controller
{
    /**
     * Listar todos los niveles - Diferenciado por rol
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            switch ($user->rol) {
                case 'estudiante':
                    return $this->getNivelesParaEstudiante($user);
                case 'docente':
                    return $this->getNivelesParaDocente($user);
                case 'admin':
                    return $this->getNivelesParaAdmin($user);
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Rol no válido'
                    ], 403);
            }
            

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener niveles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vista de niveles para ESTUDIANTE - Con progreso personal
     */
    private function getNivelesParaEstudiante($user)
    {
        // Obtener puntos totales del estudiante
        $puntosTotal = DB::table('puntos')
            ->where('user_id', $user->id)
            ->sum('cantidad') ?? 0;

        // Obtener todos los niveles
        $niveles = DB::table('niveles')
            ->orderBy('requisito_puntos', 'asc')
            ->get();

        // Obtener niveles alcanzados por el estudiante
        $nivelesAlcanzados = DB::table('estudiante_niveles')
            ->where('user_id', $user->id)
            ->pluck('nivel_id')
            ->toArray();

        $nivelesConProgreso = $niveles->map(function($nivel, $index) use ($puntosTotal, $nivelesAlcanzados) {
            $alcanzado = in_array($nivel->id, $nivelesAlcanzados);
            $disponible = $puntosTotal >= $nivel->requisito_puntos;
            
            // Calcular progreso hacia este nivel
            $nivelAnterior = $index > 0 ? $nivel[$index - 1] : null;
            $puntosBase = $nivelAnterior ? $nivelAnterior->requisito_puntos : 0;
            $puntosNecesarios = $nivel->requisito_puntos - $puntosBase;
            $puntosProgreso = max(0, min($puntosTotal - $puntosBase, $puntosNecesarios));
            $porcentajeProgreso = $puntosNecesarios > 0 ? round(($puntosProgreso / $puntosNecesarios) * 100, 1) : 100;

            return [
                'id' => $nivel->id,
                'nombre' => $nivel->nombre,
                'descripcion' => $nivel->descripcion,
                'requisito_puntos' => $nivel->requisito_puntos,
                'dificultad' => $nivel->dificultad,
                'estado' => [
                    'alcanzado' => $alcanzado,
                    'disponible' => $disponible,
                    'bloqueado' => !$disponible && !$alcanzado,
                    'actual' => $disponible && !$alcanzado && ($index == 0 || $puntosTotal >= ($nivelAnterior->requisito_puntos ?? 0))
                ],
                'progreso' => [
                    'puntos_necesarios' => max(0, $nivel->requisito_puntos - $puntosTotal),
                    'porcentaje' => min(100, $porcentajeProgreso),
                    'puntos_base' => $puntosBase,
                    'puntos_objetivo' => $nivel->requisito_puntos
                ]
            ];
        });

        // Identificar nivel actual
        $nivelActual = $nivelesConProgreso->where('estado.alcanzado', true)->last() ?? 
                      $nivelesConProgreso->first();

        // Siguiente nivel
        $siguienteNivel = $nivelesConProgreso->where('estado.disponible', false)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'estudiante',
                'puntos_totales' => $puntosTotal,
                'nivel_actual' => $nivelActual,
                'siguiente_nivel' => $siguienteNivel,
                'todos_los_niveles' => $nivelesConProgreso,
                'progreso_general' => [
                    'niveles_alcanzados' => count($nivelesAlcanzados),
                    'niveles_totales' => $niveles->count(),
                    'porcentaje_completitud' => $niveles->count() > 0 ? 
                        round((count($nivelesAlcanzados) / $niveles->count()) * 100, 1) : 0
                ]
            ]
        ]);
    }

    /**
     * Vista de niveles para DOCENTE - Con estadísticas de estudiantes
     */
    private function getNivelesParaDocente($user)
    {
        $niveles = DB::table('niveles')
            ->leftJoin('estudiante_niveles', 'niveles.id', '=', 'estudiante_niveles.nivel_id')
            ->leftJoin('users', 'estudiante_niveles.user_id', '=', 'users.id')
            ->select(
                'niveles.*',
                DB::raw('COUNT(DISTINCT estudiante_niveles.user_id) as estudiantes_en_nivel'),
                DB::raw('AVG(CASE WHEN users.rol = "estudiante" THEN (
                    SELECT SUM(cantidad) FROM puntos WHERE user_id = users.id
                ) END) as promedio_puntos_nivel')
            )
            ->groupBy('niveles.id', 'niveles.nombre', 'niveles.descripcion', 'niveles.requisito_puntos', 'niveles.dificultad', 'niveles.created_at', 'niveles.updated_at')
            ->orderBy('niveles.requisito_puntos', 'asc')
            ->get();

        // Obtener distribución general de estudiantes por nivel
        $distribucionEstudiantes = DB::table('users')
            ->leftJoin(DB::raw('(
                SELECT user_id, SUM(cantidad) as total_puntos 
                FROM puntos 
                GROUP BY user_id
            ) as puntos_totales'), 'users.id', '=', 'puntos_totales.user_id')
            ->leftJoin('estudiante_niveles', 'users.id', '=', 'estudiante_niveles.user_id')
            ->leftJoin('niveles', 'estudiante_niveles.nivel_id', '=', 'niveles.id')
            ->where('users.rol', 'estudiante')
            ->select(
                DB::raw('COALESCE(niveles.nombre, "Sin nivel") as nivel_nombre'),
                DB::raw('COUNT(*) as cantidad_estudiantes'),
                DB::raw('AVG(COALESCE(puntos_totales.total_puntos, 0)) as promedio_puntos')
            )
            ->groupBy('niveles.id', 'niveles.nombre')
            ->get();

        $nivelesParaDocente = $niveles->map(function($nivel) {
            return [
                'id' => $nivel->id,
                'nombre' => $nivel->nombre,
                'descripcion' => $nivel->descripcion,
                'requisito_puntos' => $nivel->requisito_puntos,
                'dificultad' => $nivel->dificultad,
                'estadisticas' => [
                    'estudiantes_en_nivel' => $nivel->estudiantes_en_nivel,
                    'promedio_puntos' => round($nivel->promedio_puntos_nivel ?? 0, 1),
                    'es_popular' => $nivel->estudiantes_en_nivel > 5,
                    'necesita_atencion' => $nivel->estudiantes_en_nivel == 0 && $nivel->requisito_puntos < 1000
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'docente',
                'niveles' => $nivelesParaDocente,
                'distribucion_estudiantes' => $distribucionEstudiantes,
                'resumen' => [
                    'total_niveles' => $niveles->count(),
                    'niveles_populares' => $nivelesParaDocente->where('estadisticas.es_popular', true)->count(),
                    'niveles_vacios' => $nivelesParaDocente->where('estadisticas.estudiantes_en_nivel', 0)->count()
                ]
            ]
        ]);
    }

    /**
     * Vista de niveles para ADMIN - Gestión completa
     */
    private function getNivelesParaAdmin($user)
    {
        $niveles = DB::table('niveles')
            ->leftJoin('estudiante_niveles', 'niveles.id', '=', 'estudiante_niveles.nivel_id')
            ->select(
                'niveles.*',
                DB::raw('COUNT(estudiante_niveles.user_id) as total_estudiantes'),
                DB::raw('COUNT(CASE WHEN estudiante_niveles.fecha_asignacion >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as nuevos_esta_semana')
            )
            ->groupBy('niveles.id', 'niveles.nombre', 'niveles.descripcion', 'niveles.requisito_puntos', 'niveles.dificultad', 'niveles.created_at', 'niveles.updated_at')
            ->orderBy('niveles.requisito_puntos', 'asc')
            ->get();

        // Estadísticas detalladas para admin
        $estadisticasDetalladas = [
            'estudiantes_sin_nivel' => DB::table('users')
                ->where('rol', 'estudiante')
                ->whereNotIn('id', function($query) {
                    $query->select('user_id')->from('estudiante_niveles');
                })
                ->count(),
            'nivel_mas_popular' => DB::table('niveles')
                ->join('estudiante_niveles', 'niveles.id', '=', 'estudiante_niveles.nivel_id')
                ->select('niveles.nombre', DB::raw('COUNT(*) as cantidad'))
                ->groupBy('niveles.id', 'niveles.nombre')
                ->orderBy('cantidad', 'desc')
                ->first(),
            'progresion_semanal' => DB::table('estudiante_niveles')
                ->selectRaw('DATE(fecha_asignacion) as fecha, COUNT(*) as nivel_ups')
                ->where('fecha_asignacion', '>=', now()->subWeeks(4))
                ->groupBy('fecha')
                ->orderBy('fecha', 'desc')
                ->get()
        ];

        $nivelesCompletos = $niveles->map(function($nivel) {
            // Verificar si el nivel está bien balanceado
            $esBalanceado = $this->verificarBalanceNivel($nivel->id, $nivel->requisito_puntos);
            
            return [
                'id' => $nivel->id,
                'nombre' => $nivel->nombre,
                'descripcion' => $nivel->descripcion,
                'requisito_puntos' => $nivel->requisito_puntos,
                'dificultad' => $nivel->dificultad,
                'created_at' => $nivel->created_at,
                'estadisticas' => [
                    'total_estudiantes' => $nivel->total_estudiantes,
                    'nuevos_esta_semana' => $nivel->nuevos_esta_semana,
                    'tasa_crecimiento' => $nivel->total_estudiantes > 0 ? 
                        round(($nivel->nuevos_esta_semana / $nivel->total_estudiantes) * 100, 1) : 0
                ],
                'estado' => [
                    'activo' => $nivel->total_estudiantes > 0,
                    'popular' => $nivel->total_estudiantes > 10,
                    'balanceado' => $esBalanceado,
                    'necesita_revision' => !$esBalanceado || ($nivel->total_estudiantes == 0 && $nivel->requisito_puntos < 500)
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'admin',
                'niveles' => $nivelesCompletos,
                'estadisticas_sistema' => $estadisticasDetalladas,
                'metricas_globales' => [
                    'total_niveles' => $niveles->count(),
                    'niveles_activos' => $nivelesCompletos->where('estado.activo', true)->count(),
                    'niveles_balanceados' => $nivelesCompletos->where('estado.balanceado', true)->count(),
                    'total_asignaciones' => $niveles->sum('total_estudiantes')
                ],
                'permisos' => [
                    'puede_crear' => true,
                    'puede_editar' => true,
                    'puede_eliminar' => true,
                    'puede_asignar_manual' => true
                ]
            ]
        ]);
    }

    /**
     * Mostrar nivel específico con detalles
     */
    public function show($id, Request $request)
    {
        try {
            $user = $request->user();

            $nivel = DB::table('niveles')->where('id', $id)->first();

            if (!$nivel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nivel no encontrado'
                ], 404);
            }

            // Obtener estudiantes en este nivel
            $estudiantesEnNivel = DB::table('estudiante_niveles')
                ->join('users', 'estudiante_niveles.user_id', '=', 'users.id')
                ->leftJoin(DB::raw('(
                    SELECT user_id, SUM(cantidad) as total_puntos 
                    FROM puntos 
                    GROUP BY user_id
                ) as puntos_totales'), 'users.id', '=', 'puntos_totales.user_id')
                ->where('estudiante_niveles.nivel_id', $id)
                ->select(
                    'users.id',
                    'users.nombre',
                    'users.apellido',
                    'estudiante_niveles.fecha_asignacion',
                    'puntos_totales.total_puntos'
                )
                ->orderBy('estudiante_niveles.fecha_asignacion', 'desc')
                ->get();

            $response = [
                'id' => $nivel->id,
                'nombre' => $nivel->nombre,
                'descripcion' => $nivel->descripcion,
                'requisito_puntos' => $nivel->requisito_puntos,
                'dificultad' => $nivel->dificultad,
                'created_at' => $nivel->created_at,
                'estudiantes' => $estudiantesEnNivel->map(function($estudiante) use ($nivel) {
                    return [
                        'id' => $estudiante->id,
                        'nombre' => $estudiante->nombre . ' ' . $estudiante->apellido,
                        'puntos_totales' => $estudiante->total_puntos ?? 0,
                        'fecha_alcance' => $estudiante->fecha_asignacion,
                        'puntos_excedentes' => max(0, ($estudiante->total_puntos ?? 0) - $nivel->requisito_puntos)
                    ];
                }),

                'estadisticas' => [
                    'total_estudiantes' => $estudiantesEnNivel->count(),
                    'promedio_puntos' => $estudiantesEnNivel->avg('total_puntos') ?? 0,
                    'estudiante_mas_puntos' => $estudiantesEnNivel->max('total_puntos') ?? 0,
                    'fecha_primer_estudiante' => $estudiantesEnNivel->min('fecha_asignacion'),
                    'fecha_ultimo_estudiante' => $estudiantesEnNivel->max('fecha_asignacion')
                ]
            ];

            // Si es estudiante, verificar si ha alcanzado este nivel
            if ($user->rol === 'estudiante') {
                $miProgreso = [
                    'lo_he_alcanzado' => $estudiantesEnNivel->contains('id', $user->id),
                    'mis_puntos_actuales' => DB::table('puntos')->where('user_id', $user->id)->sum('cantidad') ?? 0
                ];
                $miProgreso['puntos_que_faltan'] = max(0, $nivel->requisito_puntos - $miProgreso['mis_puntos_actuales']);
                
                $response['mi_progreso'] = $miProgreso;
            }

            return response()->json([
                'success' => true,
                'data' => $response
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener nivel',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo nivel - Solo ADMIN
     */
    public function store(Request $request)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden crear niveles'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:50|unique:niveles',
            'descripcion' => 'nullable|string',
            'requisito_puntos' => 'required|integer|min:0|unique:niveles',
            'dificultad' => 'nullable|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $nivelId = DB::table('niveles')->insertGetId([
                'nombre' => $request->nombre,
                'descripcion' => $request->descripcion,
                'requisito_puntos' => $request->requisito_puntos,
                'dificultad' => $request->dificultad,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Auto-asignar nivel a estudiantes que ya califican
            $this->asignarNivelAEstudiantesCalificados($nivelId, $request->requisito_puntos);

            return response()->json([
                'success' => true,
                'message' => 'Nivel creado exitosamente',
                'data' => [
                    'nivel_id' => $nivelId,
                    'nombre' => $request->nombre,
                    'requisito_puntos' => $request->requisito_puntos
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear nivel',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar nivel - Solo ADMIN
     */
    public function update(Request $request, $id)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden editar niveles'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:50|unique:niveles,nombre,' . $id,
            'descripcion' => 'nullable|string',
            'requisito_puntos' => 'sometimes|required|integer|min:0|unique:niveles,requisito_puntos,' . $id,
            'dificultad' => 'nullable|string|max:20'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $affected = DB::table('niveles')
                ->where('id', $id)
                ->update(array_merge(
                    $request->only(['nombre', 'descripcion', 'requisito_puntos', 'dificultad']),
                    ['updated_at' => now()]
                ));

            if ($affected === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nivel no encontrado'
                ], 404);
            }

            // Si se cambió el requisito de puntos, recalcular asignaciones
            if ($request->has('requisito_puntos')) {
                $this->recalcularAsignacionesNivel($id, $request->requisito_puntos);
            }

            return response()->json([
                'success' => true,
                'message' => 'Nivel actualizado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar nivel',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar nivel - Solo ADMIN
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden eliminar niveles'
            ], 403);
        }

        try {
            // Verificar si hay estudiantes asignados
            $tieneEstudiantes = DB::table('estudiante_niveles')
                ->where('nivel_id', $id)
                ->exists();

            if ($tieneEstudiantes) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el nivel porque tiene estudiantes asignados',
                    'data' => [
                        'estudiantes_asignados' => DB::table('estudiante_niveles')->where('nivel_id', $id)->count()
                    ]
                ], 400);
            }

            $affected = DB::table('niveles')->where('id', $id)->delete();

            if ($affected === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nivel no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Nivel eliminado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar nivel',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asignar nivel manualmente a estudiante - Solo ADMIN
     */
    public function assignLevel(Request $request)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden asignar niveles manualmente'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'nivel_id' => 'required|exists:niveles,id'
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
                    'message' => 'Solo se pueden asignar niveles a estudiantes'
                ], 400);
            }

            // Verificar si ya tiene este nivel
            $yaLoTiene = DB::table('estudiante_niveles')
                ->where('user_id', $request->user_id)
                ->where('nivel_id', $request->nivel_id)
                ->exists();

            if ($yaLoTiene) {
                return response()->json([
                    'success' => false,
                    'message' => 'El estudiante ya tiene este nivel asignado'
                ], 400);
            }

            // Asignar nivel
            DB::table('estudiante_niveles')->insert([
                'user_id' => $request->user_id,
                'nivel_id' => $request->nivel_id,
                'fecha_asignacion' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $nivel = DB::table('niveles')->where('id', $request->nivel_id)->first();

            return response()->json([
                'success' => true,
                'message' => 'Nivel asignado exitosamente',
                'data' => [
                    'estudiante' => $estudiante->nombre . ' ' . $estudiante->apellido,
                    'nivel_asignado' => $nivel->nombre,
                    'fecha_asignacion' => now()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar nivel',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function checkLevelUp($userId, Request $request)
    {
        try {
            // TOTAL DE PUNTOS DEL ESTUDIANTE
            $totalPuntos = DB::table('puntos')
                ->where('user_id', $userId)
                ->sum('cantidad') ?? 0;

            // EJECUTAR TU LÓGICA EXISTENTE DE LEVEL UP
            $nuevosNiveles = $this->asignarNivelesAutomaticos($userId, $totalPuntos);

            // NIVEL ACTUAL DEL ESTUDIANTE
            $nivelActual = DB::table('estudiante_niveles')
                ->join('niveles', 'estudiante_niveles.nivel_id', '=', 'niveles.id')
                ->where('estudiante_niveles.user_id', $userId)
                ->orderBy('niveles.requisito_puntos', 'desc')
                ->select('niveles.id', 'niveles.nombre', 'niveles.requisito_puntos')
                ->first();

            // OBTENER NÚMERO DE INSIGNIAS
            $insignias = DB::table('estudiante_insignias')
                ->where('user_id', $userId)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'user_id' => $userId,
                    'puntos_totales' => $totalPuntos,
                    'nivel_actual' => $nivelActual ? [
                        'id' => $nivelActual->id,
                        'nombre' => $nivelActual->nombre,
                        'requisito' => $nivelActual->requisito_puntos
                    ] : null,
                    'insignias' => $insignias,
                    'nuevos_niveles' => $nuevosNiveles,
                    'level_up_ocurrido' => count($nuevosNiveles) > 0
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar level up',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Obtener estudiantes en un nivel específico
     */
    public function getStudentsByLevel($nivelId, Request $request)
    {
        try {
            $user = $request->user();

            // Verificar permisos
            if (!in_array($user->rol, ['admin', 'docente'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver esta información'
                ], 403);
            }

            $nivel = DB::table('niveles')->where('id', $nivelId)->first();

            if (!$nivel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nivel no encontrado'
                ], 404);
            }

            $estudiantes = DB::table('estudiante_niveles')
                ->join('users', 'estudiante_niveles.user_id', '=', 'users.id')
                ->leftJoin(DB::raw('(
                    SELECT user_id, SUM(cantidad) as total_puntos 
                    FROM puntos 
                    GROUP BY user_id
                ) as puntos_totales'), 'users.id', '=', 'puntos_totales.user_id')
                ->leftJoin(DB::raw('(
                    SELECT user_id, COUNT(*) as total_insignias
                    FROM estudiante_insignias
                    GROUP BY user_id
                ) as insignias_totales'), 'users.id', '=', 'insignias_totales.user_id')
                ->where('estudiante_niveles.nivel_id', $nivelId)
                ->select(
                    'users.id',
                    'users.nombre',
                    'users.apellido',
                    'users.dni',
                    'estudiante_niveles.fecha_asignacion',
                    'puntos_totales.total_puntos',
                    'insignias_totales.total_insignias'
                )
                ->orderBy('estudiante_niveles.fecha_asignacion', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'nivel' => [
                        'id' => $nivel->id,
                        'nombre' => $nivel->nombre,
                        'requisito_puntos' => $nivel->requisito_puntos
                    ],
                    'estudiantes' => $estudiantes->map(function($estudiante) use ($nivel) {
                        return [
                            'id' => $estudiante->id,
                            'nombre' => $estudiante->nombre . ' ' . $estudiante->apellido,
                            'dni' => $estudiante->dni,
                            'puntos_totales' => $estudiante->total_puntos ?? 0,
                            'total_insignias' => $estudiante->total_insignias ?? 0,
                            'fecha_alcance' => $estudiante->fecha_asignacion,
                            'puntos_excedentes' => max(0, ($estudiante->total_puntos ?? 0) - $nivel->requisito_puntos),
                            'dias_en_nivel' => now()->diffInDays($estudiante->fecha_asignacion)
                        ];
                    }),
                    'resumen' => [
                        'total_estudiantes' => $estudiantes->count(),
                        'promedio_puntos' => $estudiantes->avg('total_puntos') ?? 0,
                        'promedio_insignias' => $estudiantes->avg('total_insignias') ?? 0,
                        'estudiante_mas_puntos' => $estudiantes->max('total_puntos') ?? 0,
                        'estudiante_menos_puntos' => $estudiantes->min('total_puntos') ?? 0
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estudiantes del nivel',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============= MÉTODOS AUXILIARES =============

    /**
     * Asignar nivel a estudiantes que ya califican (nuevo nivel creado)
     */
    private function asignarNivelAEstudiantesCalificados($nivelId, $requisitoPuntos)
    {
        $estudiantesCalificados = DB::table('users')
            ->join(DB::raw('(
                SELECT user_id, SUM(cantidad) as total_puntos 
                FROM puntos 
                GROUP BY user_id
                HAVING total_puntos >= ' . $requisitoPuntos . '
            ) as puntos_calificados'), 'users.id', '=', 'puntos_calificados.user_id')
            ->leftJoin('estudiante_niveles', function($join) use ($nivelId) {
                $join->on('users.id', '=', 'estudiante_niveles.user_id')
                     ->where('estudiante_niveles.nivel_id', '=', $nivelId);
            })
            ->where('users.rol', 'estudiante')
            ->whereNull('estudiante_niveles.id') // No tiene este nivel ya asignado
            ->select('users.id')
            ->get();

        $asignaciones = [];
        foreach ($estudiantesCalificados as $estudiante) {
            $asignaciones[] = [
                'user_id' => $estudiante->id,
                'nivel_id' => $nivelId,
                'fecha_asignacion' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ];
        }

        if (!empty($asignaciones)) {
            DB::table('estudiante_niveles')->insert($asignaciones);
        }
    }

    /**
     * Recalcular asignaciones cuando se cambia requisito de puntos
     */
    private function recalcularAsignacionesNivel($nivelId, $nuevoRequisito)
    {
        // Remover estudiantes que ya no califican
        DB::table('estudiante_niveles')
            ->where('nivel_id', $nivelId)
            ->whereIn('user_id', function($query) use ($nuevoRequisito) {
                $query->select('user_id')
                      ->from(DB::raw('(
                          SELECT user_id, SUM(cantidad) as total_puntos 
                          FROM puntos 
                          GROUP BY user_id
                          HAVING total_puntos < ' . $nuevoRequisito . '
                      ) as puntos_insuficientes'));
            })
            ->delete();

        // Agregar estudiantes que ahora califican
        $this->asignarNivelAEstudiantesCalificados($nivelId, $nuevoRequisito);
    }

    /**
     * Asignar niveles automáticamente a un estudiante según sus puntos
     */
    private function asignarNivelesAutomaticos($userId, $totalPuntos)
    {
        // Obtener niveles que debería tener pero no tiene
        $nivelesDisponibles = DB::table('niveles')
            ->leftJoin('estudiante_niveles', function($join) use ($userId) {
                $join->on('niveles.id', '=', 'estudiante_niveles.nivel_id')
                     ->where('estudiante_niveles.user_id', '=', $userId);
            })
            ->where('niveles.requisito_puntos', '<=', $totalPuntos)
            ->whereNull('estudiante_niveles.id') // No lo tiene asignado
            ->select('niveles.id', 'niveles.nombre', 'niveles.requisito_puntos')
            ->orderBy('niveles.requisito_puntos', 'asc')
            ->get();

        $nuevosNiveles = [];
        foreach ($nivelesDisponibles as $nivel) {
            DB::table('estudiante_niveles')->insert([
                'user_id' => $userId,
                'nivel_id' => $nivel->id,
                'fecha_asignacion' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $nuevosNiveles[] = [
                'id' => $nivel->id,
                'nombre' => $nivel->nombre,
                'requisito_puntos' => $nivel->requisito_puntos
            ];
        }

        return $nuevosNiveles;
    }

    /**
     * Verificar si un nivel está bien balanceado
     */
    private function verificarBalanceNivel($nivelId, $requisitoPuntos)
    {
        // Un nivel está balanceado si:
        // 1. Tiene estudiantes asignados
        // 2. El salto de puntos no es muy grande respecto al nivel anterior
        
        $tieneEstudiantes = DB::table('estudiante_niveles')
            ->where('nivel_id', $nivelId)
            ->exists();

        $nivelAnterior = DB::table('niveles')
            ->where('requisito_puntos', '<', $requisitoPuntos)
            ->orderBy('requisito_puntos', 'desc')
            ->first();

        $saltoRazonable = true;
        if ($nivelAnterior) {
            $salto = $requisitoPuntos - $nivelAnterior->requisito_puntos;
            // Considerar salto razonable si no es más de 5x el nivel anterior
            $saltoRazonable = $salto <= ($nivelAnterior->requisito_puntos * 5);
        }

        return $tieneEstudiantes && $saltoRazonable;
    }

    /**
     * Obtener progreso de nivel para un estudiante específico
     */
    public function getStudentProgress($userId, Request $request)
    {
        try {
            $user = $request->user();

            // Verificar permisos
            if ($user->rol === 'estudiante' && $user->id != $userId) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver el progreso de otros estudiantes'
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

            $puntosTotal = DB::table('puntos')->where('user_id', $userId)->sum('cantidad') ?? 0;

            // Obtener nivel actual (el más alto alcanzado)
            $nivelActual = DB::table('estudiante_niveles')
                ->join('niveles', 'estudiante_niveles.nivel_id', '=', 'niveles.id')
                ->where('estudiante_niveles.user_id', $userId)
                ->orderBy('niveles.requisito_puntos', 'desc')
                ->select('niveles.*', 'estudiante_niveles.fecha_asignacion')
                ->first();

            // Obtener siguiente nivel disponible
            $siguienteNivel = DB::table('niveles')
                ->where('requisito_puntos', '>', $puntosTotal)
                ->orderBy('requisito_puntos', 'asc')
                ->first();

            // Obtener historial de niveles
            $historialNiveles = DB::table('estudiante_niveles')
                ->join('niveles', 'estudiante_niveles.nivel_id', '=', 'niveles.id')
                ->where('estudiante_niveles.user_id', $userId)
                ->select(
                    'niveles.id',
                    'niveles.nombre',
                    'niveles.requisito_puntos',
                    'estudiante_niveles.fecha_asignacion'
                )
                ->orderBy('estudiante_niveles.fecha_asignacion', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'estudiante' => [
                        'id' => $estudiante->id,
                        'nombre' => $estudiante->nombre . ' ' . $estudiante->apellido
                    ],
                    'puntos_totales' => $puntosTotal,
                    'nivel_actual' => $nivelActual ? [
                        'id' => $nivelActual->id,
                        'nombre' => $nivelActual->nombre,
                        'requisito_puntos' => $nivelActual->requisito_puntos,
                        'fecha_alcance' => $nivelActual->fecha_asignacion,
                        'dias_en_nivel' => now()->diffInDays($nivelActual->fecha_asignacion)
                    ] : null,
                    'siguiente_nivel' => $siguienteNivel ? [
                        'id' => $siguienteNivel->id,
                        'nombre' => $siguienteNivel->nombre,
                        'requisito_puntos' => $siguienteNivel->requisito_puntos,
                        'puntos_necesarios' => $siguienteNivel->requisito_puntos - $puntosTotal,
                        'porcentaje_progreso' => round(($puntosTotal / $siguienteNivel->requisito_puntos) * 100, 1)
                    ] : null,
                    'historial_niveles' => $historialNiveles,
                    'estadisticas' => [
                        'total_niveles_alcanzados' => $historialNiveles->count(),
                        'nivel_mas_reciente' => $historialNiveles->first(),
                        'primer_nivel_alcanzado' => $historialNiveles->last(),
                        'promedio_dias_por_nivel' => $historialNiveles->count() > 1 ? 
                            now()->diffInDays($historialNiveles->last()->fecha_asignacion) / $historialNiveles->count() : 0
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener progreso del estudiante',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Estadísticas de progresión del sistema
     */
    public function getProgressionStats(Request $request)
    {
        try {
            $user = $request->user();

            if (!in_array($user->rol, ['admin', 'docente'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para ver estas estadísticas'
                ], 403);
            }

            $stats = [
                'distribucion_estudiantes' => DB::table('niveles')
                    ->leftJoin('estudiante_niveles', 'niveles.id', '=', 'estudiante_niveles.nivel_id')
                    ->select(
                        'niveles.nombre',
                        'niveles.requisito_puntos',
                        DB::raw('COUNT(estudiante_niveles.user_id) as estudiantes')
                    )
                    ->groupBy('niveles.id', 'niveles.nombre', 'niveles.requisito_puntos')
                    ->orderBy('niveles.requisito_puntos', 'asc')
                    ->get(),

                'progresion_temporal' => DB::table('estudiante_niveles')
                    ->selectRaw('DATE(fecha_asignacion) as fecha, COUNT(*) as nuevos_niveles')
                    ->where('fecha_asignacion', '>=', now()->subDays(30))
                    ->groupBy('fecha')
                    ->orderBy('fecha', 'desc')
                    ->get(),

                'estudiantes_mas_activos' => DB::table('users')
                    ->join('estudiante_niveles', 'users.id', '=', 'estudiante_niveles.user_id')
                    ->where('users.rol', 'estudiante')
                    ->select(
                        'users.nombre',
                        'users.apellido',
                        DB::raw('COUNT(*) as niveles_alcanzados'),
                        DB::raw('MAX(estudiante_niveles.fecha_asignacion) as ultimo_nivel')
                    )
                    ->groupBy('users.id', 'users.nombre', 'users.apellido')
                    ->orderBy('niveles_alcanzados', 'desc')
                    ->limit(10)
                    ->get(),

                'resumen_general' => [
                    'total_level_ups' => DB::table('estudiante_niveles')->count(),
                    'estudiantes_con_niveles' => DB::table('estudiante_niveles')->distinct('user_id')->count(),
                    'estudiantes_sin_niveles' => DB::table('users')
                        ->where('rol', 'estudiante')
                        ->whereNotIn('id', function($query) {
                            $query->select('user_id')->from('estudiante_niveles');
                        })
                        ->count(),
                    'level_ups_esta_semana' => DB::table('estudiante_niveles')
                        ->where('fecha_asignacion', '>=', now()->subWeek())
                        ->count()
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas de progresión',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}