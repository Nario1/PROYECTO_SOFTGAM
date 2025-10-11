<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Juego;
use App\Models\Jugada;
use App\Models\User;
use App\Models\Asignacion;
use App\Models\PruebaDiagnostica;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class JuegoController extends Controller
{
    /**
     * Panel principal de juegos - Cambia según el rol del usuario
     */
    /**
     * Panel principal de juegos - Cambia según el rol del usuario
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            // Validar que exista un usuario autenticado
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

            // Cambiar panel según el rol del usuario
            switch ($user->rol) {
                case 'estudiante':
                    return $this->getJuegosParaEstudiante($user);

                case 'docente':
                    return $this->getJuegosParaDocente($user);

                case 'admin':
                    return $this->getPanelAdministrativo($user);

                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Rol no válido'
                    ], 403);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener juegos',
                'error' => $e->getMessage()
            ], 500);
        }
    }



    
   /**
     * Obtener usuario por ID
     */
    public function getUsuarioById($id)
    {
        $usuario = \App\Models\User::find($id);

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $usuario
        ]);
    }

    /**
     * Mapear dificultad numérica a string
     */
    private function mapearDificultad($nivel)
    {
        if ($nivel <= 1.5) return 'facil';
        if ($nivel <= 2.5) return 'medio';
        return 'dificil';
    }

    /**
     * Panel de juegos para estudiante - Basado en su nivel diagnóstico
     */
    private function getJuegosParaEstudiante($user)
    {
        try {
            // Última prueba diagnóstica del estudiante
            $pruebaDiagnostica = DB::table('pruebas_diagnosticas')
                ->where('user_id', $user->id)
                ->orderBy('fecha', 'desc')
                ->first();

            // Dificultad recomendada según puntaje
            $dificultadRecomendada = $this->getDificultadPorPuntaje($pruebaDiagnostica->puntaje ?? 0);

            // Obtener todos los juegos con su temática
            $juegos = DB::table('juegos')
                ->join('tematicas', 'juegos.tematica_id', '=', 'tematicas.id')
                ->select(
                    'juegos.id',
                    'juegos.nombre',
                    'juegos.descripcion',
                    'juegos.imagen',
                    'juegos.tematica_id',
                    'tematicas.nombre as tematica_nombre'
                )
                ->get();

            // Progreso del estudiante en cada juego
            $juegosConProgreso = $juegos->map(function ($juego) use ($user, $dificultadRecomendada) {
                $estadisticas = DB::table('jugadas')
                    ->where('user_id', $user->id)
                    ->where('juego_id', $juego->id)
                    ->selectRaw('
                        COUNT(*) as total_jugadas,
                        SUM(puntos_obtenidos) as puntos_totales,
                        AVG(puntos_obtenidos) as promedio_puntos,
                        MAX(puntos_obtenidos) as mejor_puntaje,
                        SUM(CASE WHEN finalizado = 1 THEN 1 ELSE 0 END) as jugadas_completadas
                    ')
                    ->first();

                // Para este ejemplo asumimos dificultad promedio como 2 (media) ya que no hay actividades
                $dificultad_promedio = 2;

                $esRecomendado = $this->esJuegoRecomendado($dificultad_promedio, $dificultadRecomendada);

                return [
                    'id' => $juego->id,
                    'nombre' => $juego->nombre,
                    'descripcion' => $juego->descripcion,
                    'imagen' => $juego->imagen,
                    'tematica' => [
                        'id' => $juego->tematica_id,
                        'nombre' => $juego->tematica_nombre
                    ],
                    'dificultad_promedio' => $dificultad_promedio,
                    'recomendado' => $esRecomendado,
                    'progreso' => [
                        'total_jugadas' => $estadisticas->total_jugadas ?? 0,
                        'jugadas_completadas' => $estadisticas->jugadas_completadas ?? 0,
                        'puntos_totales' => $estadisticas->puntos_totales ?? 0,
                        'mejor_puntaje' => $estadisticas->mejor_puntaje ?? 0,
                        'promedio_puntos' => round($estadisticas->promedio_puntos ?? 0, 1)
                    ]
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'rol' => 'estudiante',
                    'nivel_diagnostico' => $dificultadRecomendada,
                    'tiene_prueba' => $pruebaDiagnostica !== null,
                    'juegos' => $juegosConProgreso->sortByDesc('recomendado')->values()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener juegos para el estudiante',
                'error' => $e->getMessage()
            ], 500);
        }
    }



    /**
     * Panel administrativo completo para ADMIN
     */
    private function getPanelAdministrativo($user)
    {
        $estadisticasGenerales = [
            'total_usuarios' => DB::table('users')->count(),
            'total_estudiantes' => DB::table('users')->where('rol', 'estudiante')->count(),
            'total_docentes' => DB::table('users')->where('rol', 'docente')->count(),
            'total_juegos' => DB::table('juegos')->count(),
            'total_actividades' => DB::table('actividades')->count(),
            'total_jugadas' => DB::table('jugadas')->count(),
            'jugadas_completadas' => DB::table('jugadas')->where('finalizado', true)->count(),
        ];

        $topJuegos = DB::table('juegos')
            ->leftJoin('jugadas', 'juegos.id', '=', 'jugadas.juego_id')
            ->join('tematicas', 'juegos.tematica_id', '=', 'tematicas.id')
            ->select(
                'juegos.id',
                'juegos.nombre',
                'tematicas.nombre as tematica',
                DB::raw('COUNT(jugadas.id) as total_jugadas'),
                DB::raw('COUNT(DISTINCT jugadas.user_id) as estudiantes_unicos'),
                DB::raw('AVG(jugadas.puntos_obtenidos) as promedio_puntos')
            )
            ->groupBy('juegos.id', 'juegos.nombre', 'tematicas.nombre')
            ->orderBy('total_jugadas', 'desc')
            ->limit(10)
            ->get();

        $actividadReciente = DB::table('jugadas')
            ->join('users', 'jugadas.user_id', '=', 'users.id')
            ->join('juegos', 'jugadas.juego_id', '=', 'juegos.id')
            ->select(
                'users.nombre',
                'users.apellido',
                'juegos.nombre as juego',
                'jugadas.puntos_obtenidos',
                'jugadas.finalizado',
                'jugadas.inicio_juego'
            )
            ->orderBy('jugadas.inicio_juego', 'desc')
            ->limit(20)
            ->get();

        $estadisticasTematicas = DB::table('tematicas')
            ->leftJoin('juegos', 'tematicas.id', '=', 'juegos.tematica_id')
            ->leftJoin('jugadas', 'juegos.id', '=', 'jugadas.juego_id')
            ->select(
                'tematicas.id',
                'tematicas.nombre',
                DB::raw('COUNT(DISTINCT juegos.id) as total_juegos'),
                DB::raw('COUNT(jugadas.id) as total_jugadas'),
                DB::raw('COUNT(DISTINCT jugadas.user_id) as estudiantes_participantes')
            )
            ->groupBy('tematicas.id', 'tematicas.nombre')
            ->get();

        $rendimientoDificultad = DB::table('actividades')
            ->join('juegos', 'actividades.juego_id', '=', 'juegos.id')
            ->leftJoin('jugadas', 'juegos.id', '=', 'jugadas.juego_id')
            ->select(
                'actividades.nivel_dificultad',
                DB::raw('COUNT(DISTINCT actividades.id) as total_actividades'),
                DB::raw('COUNT(jugadas.id) as total_jugadas'),
                DB::raw('AVG(jugadas.puntos_obtenidos) as promedio_puntos'),
                DB::raw('COUNT(CASE WHEN jugadas.finalizado = 1 THEN 1 END) as completadas')
            )
            ->groupBy('actividades.nivel_dificultad')
            ->get();

        $usuariosActivos = DB::table('users')
            ->join('jugadas', 'users.id', '=', 'jugadas.user_id')
            ->where('users.rol', 'estudiante')
            ->select(
                'users.id',
                'users.nombre',
                'users.apellido',
                'users.dni',
                DB::raw('COUNT(jugadas.id) as total_jugadas'),
                DB::raw('SUM(jugadas.puntos_obtenidos) as puntos_totales'),
                DB::raw('AVG(jugadas.puntos_obtenidos) as promedio_puntos')
            )
            ->groupBy('users.id', 'users.nombre', 'users.apellido', 'users.dni')
            ->orderBy('total_jugadas', 'desc')
            ->limit(15)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'admin',
                'panel_tipo' => 'administrativo',
                'estadisticas_generales' => $estadisticasGenerales,
                'top_juegos' => $topJuegos,
                'actividad_reciente' => $actividadReciente,
                'estadisticas_tematicas' => $estadisticasTematicas,
                'rendimiento_dificultad' => $rendimientoDificultad,
                'usuarios_mas_activos' => $usuariosActivos,
                'permisos' => [
                    'puede_crear_usuarios' => true,
                    'puede_eliminar_usuarios' => true,
                    'puede_gestionar_juegos' => true,
                    'puede_gestionar_tematicas' => true,
                    'puede_ver_reportes_completos' => true,
                    'puede_exportar_datos' => true
                ]
            ]
        ]);
    }

    /**
     * Panel de gestión para docentes - Solo asignación y seguimiento
     */
    private function getJuegosParaDocente($user)
    {
        $juegos = DB::table('juegos')
            ->join('tematicas', 'juegos.tematica_id', '=', 'tematicas.id')
            ->leftJoin('actividades', 'juegos.id', '=', 'actividades.juego_id')
            ->select(
                'juegos.*',
                'tematicas.nombre as tematica_nombre',
                DB::raw('COUNT(actividades.id) as total_actividades'),
                DB::raw('COUNT(CASE WHEN actividades.nivel_dificultad = "facil" THEN 1 END) as actividades_faciles'),
                DB::raw('COUNT(CASE WHEN actividades.nivel_dificultad = "medio" THEN 1 END) as actividades_medias'),
                DB::raw('COUNT(CASE WHEN actividades.nivel_dificultad = "dificil" THEN 1 END) as actividades_dificiles')
            )
            ->groupBy('juegos.id', 'juegos.nombre', 'juegos.descripcion', 'juegos.imagen', 'juegos.tematica_id', 'juegos.created_at', 'juegos.updated_at', 'tematicas.nombre')
            ->get();

        $juegosConStats = $juegos->map(function($juego) {
            $stats = DB::table('jugadas')
                ->where('juego_id', $juego->id)
                ->selectRaw('
                    COUNT(DISTINCT user_id) as estudiantes_jugaron,
                    COUNT(*) as total_jugadas,
                    AVG(puntos_obtenidos) as promedio_puntos,
                    SUM(CASE WHEN finalizado = 1 THEN 1 ELSE 0 END) as jugadas_completadas
                ')
                ->first();

            return [
                'id' => $juego->id,
                'nombre' => $juego->nombre,
                'descripcion' => $juego->descripcion,
                'imagen' => $juego->imagen,
                'tematica' => [
                    'id' => $juego->tematica_id,
                    'nombre' => $juego->tematica_nombre
                ],
                'actividades' => [
                    'total' => $juego->total_actividades,
                    'faciles' => $juego->actividades_faciles,
                    'medias' => $juego->actividades_medias,
                    'dificiles' => $juego->actividades_dificiles
                ],
                'estadisticas' => [
                    'estudiantes_jugaron' => $stats->estudiantes_jugaron ?? 0,
                    'total_jugadas' => $stats->total_jugadas ?? 0,
                    'promedio_puntos' => round($stats->promedio_puntos ?? 0, 1),
                    'tasa_completitud' => $stats->total_jugadas > 0 ? 
                        round(($stats->jugadas_completadas / $stats->total_jugadas) * 100, 1) : 0
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'docente',
                'panel_tipo' => 'docente_asignacion',
                'juegos' => $juegosConStats,
                'permisos' => [
                    'puede_asignar' => true,
                    'puede_crear_actividades' => true,
                    'puede_ver_progreso_estudiantes' => true,
                    'puede_gestionar_juegos' => false,
                    'puede_eliminar_usuarios' => false
                ]
            ]
        ]);
    }

    /**
     * Obtener estudiantes y sus niveles diagnósticos para asignación
     */
    public function getEstudiantesParaAsignacion()
    {
        try {
            $estudiantes = DB::table('users')
                ->leftJoin('pruebas_diagnosticas', function($join) {
                    $join->on('users.id', '=', 'pruebas_diagnosticas.user_id')
                         ->whereRaw('pruebas_diagnosticas.id = (
                             SELECT MAX(id) FROM pruebas_diagnosticas pd2 
                             WHERE pd2.user_id = users.id
                         )');
                })
                ->where('users.rol', 'estudiante')
                ->select(
                    'users.id',
                    'users.dni',
                    'users.nombre',
                    'users.apellido',
                    'pruebas_diagnosticas.puntaje as ultimo_puntaje',
                    'pruebas_diagnosticas.categoria',
                    'pruebas_diagnosticas.fecha as fecha_prueba'
                )
                ->get()
                ->map(function($estudiante) {
                    return [
                        'id' => $estudiante->id,
                        'dni' => $estudiante->dni,
                        'nombre_completo' => $estudiante->nombre . ' ' . $estudiante->apellido,
                        'nivel_diagnostico' => [
                            'puntaje' => $estudiante->ultimo_puntaje,
                            'categoria' => $estudiante->categoria,
                            'dificultad_recomendada' => $this->getDificultadPorPuntaje($estudiante->ultimo_puntaje ?? 0),
                            'fecha_prueba' => $estudiante->fecha_prueba,
                            'tiene_prueba' => $estudiante->ultimo_puntaje !== null
                        ]
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => ['estudiantes' => $estudiantes]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estudiantes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Asignar juego a estudiante específico
     */
    public function asignarJuego(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'juego_id' => 'required|exists:juegos,id',
            'estudiante_id' => 'required|exists:users,id',
            'motivo' => 'nullable|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $docente = $request->user();

            if (!in_array($docente->rol, ['docente', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos para asignar juegos'
                ], 403);
            }

            $estudiante = DB::table('users')
                ->where('id', $request->estudiante_id)
                ->where('rol', 'estudiante')
                ->first();

            if (!$estudiante) {
                return response()->json([
                    'success' => false,
                    'message' => 'Estudiante no encontrado'
                ], 404);
            }

            // ✅ Insertar en la tabla 'asignaciones' usando Query Builder
            $asignacionId = DB::table('asignaciones')->insertGetId([
                'juego_id' => $request->juego_id,
                'estudiante_id' => $estudiante->id,
                'docente_id' => $docente->id,
                'motivo' => $request->motivo,
                'fecha_asignacion' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            $asignacion = DB::table('asignaciones')->where('id', $asignacionId)->first();

            return response()->json([
                'success' => true,
                'message' => 'Juego asignado exitosamente',
                'data' => $asignacion
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar juego',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    
    /**
     * Mostrar detalles de un juego específico
     */
    public function show($id, Request $request)
    {
        try {
            $user = $request->user();

            $juego = DB::table('juegos')
                ->join('tematicas', 'juegos.tematica_id', '=', 'tematicas.id')
                ->where('juegos.id', $id)
                ->select('juegos.*', 'tematicas.nombre as tematica_nombre')
                ->first();

            if (!$juego) {
                return response()->json([
                    'success' => false,
                    'message' => 'Juego no encontrado'
                ], 404);
            }

            // Obtener actividades del juego
            $actividades = DB::table('actividades')
                ->where('juego_id', $id)
                ->select('id', 'titulo', 'descripcion', 'nivel_dificultad')
                ->get();

            $response = [
                'id' => $juego->id,
                'nombre' => $juego->nombre,
                'descripcion' => $juego->descripcion,
                'imagen' => $juego->imagen,
                'tematica' => [
                    'id' => $juego->tematica_id,
                    'nombre' => $juego->tematica_nombre
                ],
                'actividades' => $actividades
            ];

            // Si es estudiante, agregar progreso personal
            if ($user->rol === 'estudiante') {
                $progreso = DB::table('jugadas')
                    ->where('user_id', $user->id)
                    ->where('juego_id', $id)
                    ->selectRaw('
                        COUNT(*) as total_intentos,
                        MAX(puntos_obtenidos) as mejor_puntaje,
                        SUM(CASE WHEN finalizado = 1 THEN 1 ELSE 0 END) as completados
                    ')
                    ->first();

                $response['mi_progreso'] = [
                    'total_intentos' => $progreso->total_intentos ?? 0,
                    'mejor_puntaje' => $progreso->mejor_puntaje ?? 0,
                    'completados' => $progreso->completados ?? 0
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $response
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener detalles del juego',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Determinar dificultad recomendada según puntaje de prueba diagnóstica
     */
    private function getDificultadPorPuntaje($puntaje)
    {
        if ($puntaje >= 80) return 'dificil';
        if ($puntaje >= 60) return 'medio';
        return 'facil';
    }

    /**
     * Verificar si un juego es recomendado según la dificultad del estudiante
     */
    private function esJuegoRecomendado($dificultadJuego, $dificultadEstudiante)
    {
        $niveles = ['facil' => 1, 'medio' => 2, 'dificil' => 3];
        
        $nivelJuego = $niveles[$this->mapearDificultad($dificultadJuego)] ?? 2;
        $nivelEstudiante = $niveles[$dificultadEstudiante] ?? 2;
        
        // Recomendado si está en el mismo nivel o uno superior
        return $nivelJuego >= $nivelEstudiante && $nivelJuego <= ($nivelEstudiante + 1);
    }

    /**
     * CRUD - Crear nuevo juego (Solo ADMIN)
     */
    public function store(Request $request)
    {
        // Verificar permisos de admin
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden crear juegos'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:100',
            'descripcion' => 'nullable|string',
            'imagen' => 'nullable|string|max:150',
            'tematica_id' => 'required|exists:tematicas,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $juego = DB::table('juegos')->insertGetId([
                'nombre' => $request->nombre,
                'descripcion' => $request->descripcion,
                'imagen' => $request->imagen,
                'tematica_id' => $request->tematica_id,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Juego creado exitosamente',
                'data' => ['juego_id' => $juego]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear juego',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CRUD - Actualizar juego (Solo ADMIN)
     */
    public function update(Request $request, $id)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden editar juegos'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:100',
            'descripcion' => 'nullable|string',
            'imagen' => 'nullable|string|max:150',
            'tematica_id' => 'sometimes|required|exists:tematicas,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $affected = DB::table('juegos')
                ->where('id', $id)
                ->update(array_merge(
                    $request->only(['nombre', 'descripcion', 'imagen', 'tematica_id']),
                    ['updated_at' => now()]
                ));

            if ($affected === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Juego no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Juego actualizado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar juego',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * CRUD - Eliminar juego (Solo ADMIN)
     */
    public function destroy(Request $request, $id)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden eliminar juegos'
            ], 403);
        }

        try {
            $affected = DB::table('juegos')->where('id', $id)->delete();

            if ($affected === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Juego no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Juego eliminado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar juego',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GESTIÓN DE USUARIOS - Solo ADMIN
     */
    
    /**
     * Listar todos los usuarios del sistema
     */
    public function getUsuarios(Request $request)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden gestionar usuarios'
            ], 403);
        }

        try {
            $usuarios = DB::table('users')
                ->leftJoin('jugadas', 'users.id', '=', 'jugadas.user_id')
                ->select(
                    'users.id',
                    'users.dni',
                    'users.nombre',
                    'users.apellido', 
                    'users.rol',
                    'users.created_at',
                    DB::raw('COUNT(jugadas.id) as total_jugadas'),
                    DB::raw('MAX(jugadas.inicio_juego) as ultima_actividad')
                )
                ->groupBy('users.id', 'users.dni', 'users.nombre', 'users.apellido', 'users.rol', 'users.created_at')
                ->orderBy('users.created_at', 'desc')
                ->get();

            $estadisticasUsuarios = [
                'total' => $usuarios->count(),
                'estudiantes' => $usuarios->where('rol', 'estudiante')->count(),
                'docentes' => $usuarios->where('rol', 'docente')->count(),
                'admins' => $usuarios->where('rol', 'admin')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'usuarios' => $usuarios,
                    'estadisticas' => $estadisticasUsuarios
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener usuarios',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nuevo usuario - Solo ADMIN
     */
    public function crearUsuario(Request $request)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden crear usuarios'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'dni' => 'required|string|max:20|unique:users',
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'password' => 'required|string|min:6',
            'rol' => 'required|in:estudiante,docente,admin'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $usuarioId = DB::table('users')->insertGetId([
                'dni' => $request->dni,
                'nombre' => $request->nombre,
                'apellido' => $request->apellido,
                'password' => bcrypt($request->password),
                'rol' => $request->rol,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Usuario creado exitosamente',
                'data' => [
                    'usuario_id' => $usuarioId,
                    'dni' => $request->dni,
                    'nombre_completo' => $request->nombre . ' ' . $request->apellido,
                    'rol' => $request->rol
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar usuario existente - Solo ADMIN
     */
    public function actualizarUsuario(Request $request, $id)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden editar usuarios'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'dni' => 'sometimes|required|string|max:20|unique:users,dni,' . $id,
            'nombre' => 'sometimes|required|string|max:100',
            'apellido' => 'sometimes|required|string|max:100',
            'password' => 'sometimes|nullable|string|min:6',
            'rol' => 'sometimes|required|in:estudiante,docente,admin'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $datosActualizar = $request->only(['dni', 'nombre', 'apellido', 'rol']);
            
            // Si se envía nueva contraseña, encriptarla
            if ($request->filled('password')) {
                $datosActualizar['password'] = bcrypt($request->password);
            }
            
            $datosActualizar['updated_at'] = now();

            $affected = DB::table('users')
                ->where('id', $id)
                ->update($datosActualizar);

            if ($affected === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Usuario actualizado exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar usuario - Solo ADMIN
     */
    public function eliminarUsuario(Request $request, $id)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden eliminar usuarios'
            ], 403);
        }

        try {
            // Verificar que no se esté eliminando a sí mismo
            if ($request->user()->id == $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No puedes eliminar tu propia cuenta'
                ], 400);
            }

            // Obtener información del usuario antes de eliminarlo
            $usuario = DB::table('users')->where('id', $id)->first();

            if (!$usuario) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            // Eliminar usuario (las relaciones se eliminan por CASCADE)
            DB::table('users')->where('id', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Usuario eliminado exitosamente',
                'data' => [
                    'usuario_eliminado' => $usuario->nombre . ' ' . $usuario->apellido,
                    'rol' => $usuario->rol
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar usuario',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resetear contraseña de usuario - Solo ADMIN
     */
    public function resetearPassword(Request $request, $id)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden resetear contraseñas'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'nueva_password' => 'required|string|min:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $affected = DB::table('users')
                ->where('id', $id)
                ->update([
                    'password' => bcrypt($request->nueva_password),
                    'updated_at' => now()
                ]);

            if ($affected === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no encontrado'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Contraseña reseteada exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al resetear contraseña',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas detalladas del sistema - Solo ADMIN
     */
    public function getEstadisticasCompletas(Request $request)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden ver estadísticas completas'
            ], 403);
        }

        try {
            $stats = [
                'usuarios' => [
                    'total' => DB::table('users')->count(),
                    'estudiantes_activos' => DB::table('users')
                        ->join('jugadas', 'users.id', '=', 'jugadas.user_id')
                        ->where('users.rol', 'estudiante')
                        ->where('jugadas.inicio_juego', '>=', now()->subDays(7))
                        ->distinct('users.id')
                        ->count('users.id'),
                    'nuevos_esta_semana' => DB::table('users')
                        ->where('created_at', '>=', now()->subDays(7))
                        ->count()
                ],
                'contenido' => [
                    'total_juegos' => DB::table('juegos')->count(),
                    'total_tematicas' => DB::table('tematicas')->count(),
                    'total_actividades' => DB::table('actividades')->count(),
                    'actividades_por_dificultad' => DB::table('actividades')
                        ->selectRaw('nivel_dificultad, COUNT(*) as total')
                        ->groupBy('nivel_dificultad')
                        ->pluck('total', 'nivel_dificultad')
                ],
                'actividad' => [
                    'jugadas_hoy' => DB::table('jugadas')
                        ->whereDate('inicio_juego', today())
                        ->count(),
                    'jugadas_esta_semana' => DB::table('jugadas')
                        ->where('inicio_juego', '>=', now()->subDays(7))
                        ->count(),
                    'puntos_otorgados_hoy' => DB::table('puntos')
                        ->whereDate('fecha', today())
                        ->sum('cantidad')
                ]
            ];

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
    public function getReportesCompletos(Request $request)
    {
        if ($request->user()->rol !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los administradores pueden acceder a reportes completos'
            ], 403);
        }

        try {
            // Reporte de uso por fechas
            $usoPorFecha = DB::table('jugadas')
                ->selectRaw('DATE(inicio_juego) as fecha, COUNT(*) as total_jugadas')
                ->whereNotNull('inicio_juego')
                ->groupBy('fecha')
                ->orderBy('fecha', 'desc')
                ->limit(30)
                ->get();

            // Reporte de rendimiento por estudiante
            $rendimientoEstudiantes = DB::table('users')
                ->join('jugadas', 'users.id', '=', 'jugadas.user_id')
                ->where('users.rol', 'estudiante')
                ->selectRaw('
                    users.id,
                    CONCAT(users.nombre, " ", users.apellido) as nombre_completo,
                    COUNT(jugadas.id) as total_jugadas,
                    AVG(jugadas.puntos_obtenidos) as promedio_puntos,
                    MAX(jugadas.puntos_obtenidos) as mejor_puntaje,
                    COUNT(CASE WHEN jugadas.finalizado = 1 THEN 1 END) as juegos_completados
                ')
                ->groupBy('users.id', 'users.nombre', 'users.apellido')
                ->orderBy('promedio_puntos', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'uso_por_fecha' => $usoPorFecha,
                    'rendimiento_estudiantes' => $rendimientoEstudiantes,
                    'generado_en' => now()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar reportes',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}