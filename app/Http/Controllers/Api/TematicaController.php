<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TematicaController extends Controller
{
    /**
     * Listar todas las temáticas - Diferenciado por rol
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            switch ($user->rol) {
                case 'estudiante':
                    return $this->getTematicasParaEstudiante($user);
                case 'docente':
                    return $this->getTematicasParaDocente($user);
                case 'admin':
                    return $this->getTematicasParaAdmin($user);
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Rol no válido'
                    ], 403);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener temáticas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vista de temáticas para ESTUDIANTE - Con progreso y recomendaciones
     */
    private function getTematicasParaEstudiante($user)
    {
        // Obtener nivel diagnóstico del estudiante
        $pruebaDiagnostica = DB::table('pruebas_diagnosticas')
            ->where('user_id', $user->id)
            ->orderBy('fecha', 'desc')
            ->first();

        $dificultadRecomendada = $this->getDificultadPorPuntaje($pruebaDiagnostica->puntaje ?? 0);

        $tematicas = DB::table('tematicas')
            ->leftJoin('juegos', 'tematicas.id', '=', 'juegos.tematica_id')
            ->leftJoin('actividades', 'tematicas.id', '=', 'actividades.tematica_id')
            ->leftJoin('jugadas', function($join) use ($user) {
                $join->on('juegos.id', '=', 'jugadas.juego_id')
                     ->where('jugadas.user_id', '=', $user->id);
            })
            ->select(
                'tematicas.*',
                DB::raw('COUNT(DISTINCT juegos.id) as total_juegos'),
                DB::raw('COUNT(DISTINCT actividades.id) as total_actividades'),
                DB::raw('COUNT(DISTINCT jugadas.id) as jugadas_realizadas'),
                DB::raw('COUNT(DISTINCT CASE WHEN jugadas.finalizado = 1 THEN jugadas.id END) as juegos_completados'),
                DB::raw('COALESCE(AVG(jugadas.puntos_obtenidos), 0) as promedio_puntos')
            )
            ->addBinding($dificultadRecomendada, 'select')
            ->groupBy('tematicas.id', 'tematicas.nombre', 'tematicas.created_at', 'tematicas.updated_at')
            ->get();

        $tematicasConProgreso = $tematicas->map(function($tematica) use ($dificultadRecomendada) {
            $porcentajeProgreso = $tematica->total_juegos > 0 
                ? round(($tematica->juegos_completados / $tematica->total_juegos) * 100, 1)
                : 0;

            return [
                'id' => $tematica->id,
                'nombre' => $tematica->nombre,
                'descripcion' => null, // Las temáticas no tienen descripción en tu BD
                'estadisticas' => [
                    'total_juegos' => $tematica->total_juegos,
                    'total_actividades' => $tematica->total_actividades,
                    'actividades_recomendadas' => $tematica->actividades_recomendadas,
                    'porcentaje_progreso' => $porcentajeProgreso
                ],
                'mi_progreso' => [
                    'jugadas_realizadas' => $tematica->jugadas_realizadas,
                    'juegos_completados' => $tematica->juegos_completados,
                    'promedio_puntos' => round($tematica->promedio_puntos, 1)
                ],
                'recomendada' => $tematica->actividades_recomendadas > 0,
                'nivel_recomendado' => $dificultadRecomendada
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'estudiante',
                'nivel_diagnostico' => $dificultadRecomendada,
                'tematicas' => $tematicasConProgreso->sortByDesc('recomendada')->values(),
                'resumen' => [
                    'total_tematicas' => $tematicasConProgreso->count(),
                    'tematicas_recomendadas' => $tematicasConProgreso->where('recomendada', true)->count(),
                    'tematicas_con_progreso' => $tematicasConProgreso->where('mi_progreso.jugadas_realizadas', '>', 0)->count()
                ]
            ]
        ]);
    }

    /**
     * Vista de temáticas para DOCENTE - Con estadísticas de creación
     */
    private function getTematicasParaDocente($user)
    {
        // Temáticas con estadísticas de juegos y actividades del docente
        $tematicas = DB::table('tematicas')
            ->leftJoin('juegos', 'tematicas.id', '=', 'juegos.tematica_id')
            ->leftJoin('actividades', function($join) use ($user) {
                $join->on('tematicas.id', '=', 'actividades.tematica_id')
                    ->where('actividades.docente_id', '=', $user->id);
            })
            ->leftJoin('jugadas', 'juegos.id', '=', 'jugadas.juego_id')
            ->select(
                'tematicas.*',
                DB::raw('COUNT(DISTINCT juegos.id) as total_juegos'),
                DB::raw('COUNT(DISTINCT actividades.id) as mis_actividades'),
                DB::raw('COUNT(DISTINCT jugadas.user_id) as estudiantes_participantes'),
                DB::raw('COUNT(DISTINCT jugadas.id) as total_jugadas'),
                DB::raw('COALESCE(AVG(jugadas.puntos_obtenidos), 0) as promedio_puntos_general')
            )
            ->groupBy('tematicas.id', 'tematicas.nombre', 'tematicas.created_at', 'tematicas.updated_at')
            ->get();

        // Mapear datos al formato de respuesta
        $tematicasParaDocente = $tematicas->map(function($tematica) {
            return [
                'id' => $tematica->id,
                'nombre' => $tematica->nombre,
                'estadisticas_generales' => [
                    'total_juegos' => $tematica->total_juegos,
                    'estudiantes_participantes' => $tematica->estudiantes_participantes,
                    'total_jugadas' => $tematica->total_jugadas,
                    'promedio_puntos' => round($tematica->promedio_puntos_general, 1)
                ],
                'mis_contribuciones' => [
                    'actividades_creadas' => $tematica->mis_actividades,
                ],
                'puede_crear_actividades' => true
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'docente',
                'tematicas' => $tematicasParaDocente,
                'resumen_docente' => [
                    'total_tematicas' => $tematicasParaDocente->count(),
                    'total_actividades_creadas' => $tematicasParaDocente->sum('mis_contribuciones.actividades_creadas'),
                    'tematicas_con_actividades' => $tematicasParaDocente->where('mis_contribuciones.actividades_creadas', '>', 0)->count()
                ]
            ]
        ]);
    }


    /**
     * Vista de temáticas para ADMIN - Completa con gestión
     */
    private function getTematicasParaAdmin($user)
    {
        $tematicas = DB::table('tematicas')
            ->leftJoin('juegos', 'tematicas.id', '=', 'juegos.tematica_id')
            ->leftJoin('actividades', 'tematicas.id', '=', 'actividades.tematica_id')
            ->leftJoin('jugadas', 'juegos.id', '=', 'jugadas.juego_id')
            ->select(
                'tematicas.*',
                DB::raw('COUNT(DISTINCT juegos.id) as total_juegos'),
                DB::raw('COUNT(DISTINCT actividades.id) as total_actividades'),
                DB::raw('COUNT(DISTINCT jugadas.user_id) as estudiantes_unicos'),
                DB::raw('COUNT(DISTINCT jugadas.id) as total_jugadas'),
                DB::raw('COUNT(DISTINCT CASE WHEN jugadas.finalizado = 1 THEN jugadas.id END) as jugadas_completadas'),
                DB::raw('COALESCE(AVG(jugadas.puntos_obtenidos), 0) as promedio_puntos'),
                DB::raw('COUNT(DISTINCT actividades.docente_id) as docentes_contribuyentes')
            )
            ->groupBy('tematicas.id', 'tematicas.nombre', 'tematicas.created_at', 'tematicas.updated_at')
            ->orderBy('tematicas.created_at', 'desc')
            ->get();

        $tematicasCompletas = $tematicas->map(function($tematica) {
            $tasaCompletitud = $tematica->total_jugadas > 0 
                ? round(($tematica->jugadas_completadas / $tematica->total_jugadas) * 100, 1)
                : 0;

            return [
                'id' => $tematica->id,
                'nombre' => $tematica->nombre,
                'created_at' => $tematica->created_at,
                'estadisticas_completas' => [
                    'contenido' => [
                        'total_juegos' => $tematica->total_juegos,
                        'total_actividades' => $tematica->total_actividades,
                        'docentes_contribuyentes' => $tematica->docentes_contribuyentes
                    ],
                    'actividad' => [
                        'estudiantes_unicos' => $tematica->estudiantes_unicos,
                        'total_jugadas' => $tematica->total_jugadas,
                        'jugadas_completadas' => $tematica->jugadas_completadas,
                        'tasa_completitud' => $tasaCompletitud,
                        'promedio_puntos' => round($tematica->promedio_puntos, 1)
                    ]
                ],
                'estado' => [
                    'activa' => $tematica->total_juegos > 0 || $tematica->total_actividades > 0,
                    'popular' => $tematica->estudiantes_unicos > 10,
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'admin',
                'tematicas' => $tematicasCompletas,
                'estadisticas_sistema' => [
                    'total_tematicas' => $tematicasCompletas->count(),
                    'tematicas_activas' => $tematicasCompletas->where('estado.activa', true)->count(),
                    'tematicas_populares' => $tematicasCompletas->where('estado.popular', true)->count(),
                    'total_juegos_sistema' => $tematicasCompletas->sum('estadisticas_completas.contenido.total_juegos'),
                    'total_actividades_sistema' => $tematicasCompletas->sum('estadisticas_completas.contenido.total_actividades')
                ],
                'permisos' => [
                    'puede_crear' => true,
                    'puede_editar' => true,
                    'puede_eliminar' => true,
                    'puede_ver_estadisticas_completas' => true
                ]
            ]
        ]);
    }


    /**
     * Mostrar temática específica con contenido asociado
     */
    public function show($id, Request $request)
    {
        try {
            $user = $request->user();

            $tematica = DB::table('tematicas')->where('id', $id)->first();

            if (!$tematica) {
                return response()->json([
                    'success' => false,
                    'message' => 'Temática no encontrada'
                ], 404);
            }

            // Obtener juegos de la temática
            $juegos = DB::table('juegos')
                ->where('tematica_id', $id)
                ->select('id', 'nombre', 'descripcion', 'imagen')
                ->get();

            // Obtener actividades de la temática
            $actividades = DB::table('actividades')
                ->join('users as docentes', 'actividades.docente_id', '=', 'docentes.id')
                ->where('actividades.tematica_id', $id)
                ->select(
                    'actividades.id',
                    'actividades.titulo',
                    'actividades.descripcion',
                    'actividades.nivel_dificultad',
                    DB::raw('CONCAT(docentes.nombre, " ", docentes.apellido) as docente')
                )
                ->get();

            $response = [
                'id' => $tematica->id,
                'nombre' => $tematica->nombre,
                'contenido' => [
                    'juegos' => $juegos,
                    'actividades' => $actividades->groupBy('nivel_dificultad')
                ],
                'estadisticas' => [
                    'total_juegos' => $juegos->count(),
                    'total_actividades' => $actividades->count(),
                    'actividades_por_dificultad' => [
                        'facil' => $actividades->where('nivel_dificultad', 'facil')->count(),
                        'medio' => $actividades->where('nivel_dificultad', 'medio')->count(),
                        'dificil' => $actividades->where('nivel_dificultad', 'dificil')->count()
                    ]
                ]
            ];

            // Si es estudiante, agregar progreso personal
            if ($user->rol === 'estudiante') {
                $miProgreso = DB::table('jugadas')
                    ->join('juegos', 'jugadas.juego_id', '=', 'juegos.id')
                    ->where('jugadas.user_id', $user->id)
                    ->where('juegos.tematica_id', $id)
                    ->selectRaw('
                        COUNT(*) as mis_jugadas,
                        COUNT(CASE WHEN finalizado = 1 THEN 1 END) as completadas,
                        COALESCE(MAX(puntos_obtenidos), 0) as mejor_puntaje,
                        COALESCE(AVG(puntos_obtenidos), 0) as promedio_puntos
                    ')
                    ->first();

                $response['mi_progreso'] = [
                    'jugadas_realizadas' => $miProgreso->mis_jugadas ?? 0,
                    'juegos_completados' => $miProgreso->completadas ?? 0,
                    'mejor_puntaje' => $miProgreso->mejor_puntaje ?? 0,
                    'promedio_puntos' => round($miProgreso->promedio_puntos ?? 0, 1)
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $response
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener temática',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nueva temática - Solo ADMIN
     */
    public function store(Request $request)
    {
                if (!in_array($request->user()->rol, ['admin', 'docente'])) {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores y docentes pueden crear temáticas'
            ], 403);
        }


        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100|unique:tematicas'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $tematicaId = DB::table('tematicas')->insertGetId([
                'nombre' => $request->nombre,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Temática creada exitosamente',
                'data' => [
                    'tematica_id' => $tematicaId,
                    'nombre' => $request->nombre
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear temática',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar temática existente - Solo ADMIN
     */
    public function update(Request $request, $id)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden editar temáticas'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100|unique:tematicas,nombre,' . $id
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $affected = DB::table('tematicas')
                ->where('id', $id)
                ->update([
                    'nombre' => $request->nombre,
                    'updated_at' => now()
                ]);

            if ($affected === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Temática no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Temática actualizada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar temática',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar temática - Solo ADMIN
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden eliminar temáticas'
            ], 403);
        }

        try {
            // Verificar si tiene contenido asociado
            $tieneJuegos = DB::table('juegos')->where('tematica_id', $id)->exists();
            $tieneActividades = DB::table('actividades')->where('tematica_id', $id)->exists();

            if ($tieneJuegos || $tieneActividades) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar la temática porque tiene juegos o actividades asociadas',
                    'data' => [
                        'tiene_juegos' => $tieneJuegos,
                        'tiene_actividades' => $tieneActividades
                    ]
                ], 400);
            }

            $affected = DB::table('tematicas')->where('id', $id)->delete();

            if ($affected === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Temática no encontrada'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Temática eliminada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar temática',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener juegos de una temática específica
     */
    public function getJuegos($id, Request $request)
    {
        try {
            $user = $request->user();

            $juegos = DB::table('juegos')
                ->where('tematica_id', $id)
                ->leftJoin('jugadas', function($join) use ($user) {
                    $join->on('juegos.id', '=', 'jugadas.juego_id');
                    if ($user->rol === 'estudiante') {
                        $join->where('jugadas.user_id', '=', $user->id);
                    }
                })
                ->select(
                    'juegos.*',
                    DB::raw('COUNT(jugadas.id) as total_jugadas'),
                    DB::raw('COUNT(CASE WHEN jugadas.finalizado = 1 THEN 1 END) as completados'),
                    DB::raw('COALESCE(MAX(jugadas.puntos_obtenidos), 0) as mejor_puntaje')
                )
                ->groupBy('juegos.id', 'juegos.nombre', 'juegos.descripcion', 'juegos.imagen', 'juegos.tematica_id', 'juegos.created_at', 'juegos.updated_at')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'tematica_id' => $id,
                    'juegos' => $juegos
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener juegos de la temática',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener actividades de una temática específica
     */
    public function getActividades($id, Request $request)
    {
        try {
            $dificultad = $request->get('dificultad');

            $query = DB::table('actividades')
                ->join('users as docentes', 'actividades.docente_id', '=', 'docentes.id')
                ->where('actividades.tematica_id', $id)
                ->select(
                    'actividades.*',
                    DB::raw('CONCAT(docentes.nombre, " ", docentes.apellido) as docente')
                );

            if ($dificultad) {
                $query->where('actividades.nivel_dificultad', $dificultad);
            }

            $actividades = $query->orderBy('actividades.created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'tematica_id' => $id,
                    'filtro_dificultad' => $dificultad,
                    'actividades' => $actividades->groupBy('nivel_dificultad')
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener actividades de la temática',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Determinar dificultad recomendada según puntaje
     */
    private function getDificultadPorPuntaje($puntaje)
    {
        if ($puntaje >= 80) return 'dificil';
        if ($puntaje >= 60) return 'medio';
        return 'facil';
    }

    /**
     * Verificar si una temática está bien balanceada en dificultades
     */
    private function esTematicaBalanceada($actividades)
    {
        if ($actividades->isEmpty()) return false;
        
        $facil = $actividades->where('nivel_dificultad', 'facil')->sum('cantidad');
        $medio = $actividades->where('nivel_dificultad', 'medio')->sum('cantidad');
        $dificil = $actividades->where('nivel_dificultad', 'dificil')->sum('cantidad');
        
        // Consideramos balanceada si tiene al menos 1 actividad de cada nivel
        return $facil > 0 && $medio > 0 && $dificil > 0;
    }
}