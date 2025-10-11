<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ActividadController extends Controller
{
    /**
     * Listar actividades - Filtrable según rol
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            switch ($user->rol) {
                case 'estudiante':
                    // Retorna actividades con progreso y permisos adaptados
                    return $this->getActividadesParaEstudiante($user, $request);
                case 'docente':
                    // Retorna actividades creadas por el docente con estadísticas
                    return $this->getActividadesParaDocente($user, $request);
                case 'admin':
                    // Retorna todas las actividades con estadísticas del sistema
                    return $this->getActividadesParaAdmin($user, $request);
                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Rol no válido'
                    ], 403);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener actividades',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Vista de actividades para ESTUDIANTE - Solo asignadas o disponibles
     */
    /**
     * Vista de actividades para ESTUDIANTE - Solo asignadas
     */
    public function getActividadesParaEstudiante($userId)
    {
        // Validar que el usuario exista
        $user = DB::table('users')->where('id', $userId)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Estudiante no encontrado'
            ], 404);
        }

        // Obtener todas las asignaciones del estudiante
        $asignaciones = DB::table('asignaciones')
            ->where('estudiante_id', $user->id)
            ->get();

        // Obtener las actividades relacionadas a esas asignaciones
        $actividades = DB::table('actividades')
            ->join('tematicas', 'actividades.tematica_id', '=', 'tematicas.id')
            ->join('users as docentes', 'actividades.docente_id', '=', 'docentes.id')
            ->join('asignaciones as a', 'actividades.id', '=', 'a.actividad_id')
            ->where('a.estudiante_id', $user->id)
            ->select(
                'actividades.id',
                'actividades.titulo',
                'actividades.descripcion',
                'actividades.fecha_limite',
                'actividades.archivo_material',
                'actividades.created_at',
                'actividades.updated_at',
                'tematicas.nombre as tematica_nombre',
                DB::raw('CONCAT(docentes.nombre, " ", docentes.apellido) as docente_nombre'),
                'a.texto_entrega',
                'a.archivo_entrega',
                'a.fecha_entrega'
            )
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'estudiante',
                'total_actividades' => $actividades->count(),
                'actividades' => $actividades
            ]
        ]);
    }


    //get actividades para docente
    public function getActividadesParaDocente($docenteId)
    {
        // Validar que el docente exista
        $user = DB::table('users')->where('id', $docenteId)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Docente no encontrado'
            ], 404);
        }

        // Obtener todas las actividades creadas por el docente
        $actividades = DB::table('actividades')
            ->join('tematicas', 'actividades.tematica_id', '=', 'tematicas.id')
            ->where('actividades.docente_id', $user->id)
            ->select(
                'actividades.id',
                'actividades.titulo',
                'actividades.descripcion',
                'actividades.fecha_limite',
                'actividades.archivo_material',
                'actividades.created_at',
                DB::raw('tematicas.nombre as tematica_nombre')
            )
            ->orderBy('actividades.created_at', 'desc')
            ->get();

        // Para cada actividad, obtener las entregas de los estudiantes
        $actividadesConEntregas = $actividades->map(function($actividad) {
            $entregas = DB::table('asignaciones as a')
                ->join('users as estudiantes', 'a.estudiante_id', '=', 'estudiantes.id')
                ->where('a.actividad_id', $actividad->id)
                ->select(
                    'estudiantes.id as estudiante_id',
                    DB::raw('CONCAT(estudiantes.nombre, " ", estudiantes.apellido) as estudiante_nombre'),
                    'a.texto_entrega',
                    'a.archivo_entrega',
                    'a.fecha_entrega'
                )
                ->get();

            return [
                'id' => $actividad->id,
                'titulo' => $actividad->titulo,
                'descripcion' => $actividad->descripcion,
                'fecha_limite' => $actividad->fecha_limite,
                'archivo_material' => $actividad->archivo_material,
                'tematica_nombre' => $actividad->tematica_nombre,
                'created_at' => $actividad->created_at,
                'entregas' => $entregas,
                'estudiantes_count' => $entregas->count()
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'docente',
                'actividades' => $actividadesConEntregas
            ]
        ]);
    }



     

    /**
     * Mostrar actividad específica
     */
    public function show($id, Request $request)
    {
        try {
            $user = $request->user();

            // Obtener la actividad y sus relaciones (sin juegos)
            $actividad = DB::table('actividades')
                ->join('tematicas', 'actividades.tematica_id', '=', 'tematicas.id')
                ->join('users as docentes', 'actividades.docente_id', '=', 'docentes.id')
                ->where('actividades.id', $id)
                ->select(
                    'actividades.*',
                    'tematicas.nombre as tematica_nombre',
                    DB::raw('CONCAT(docentes.nombre, " ", docentes.apellido) as docente_nombre')
                )
                ->first();

            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada'
                ], 404);
            }

            // Verificar si el estudiante ya completó la actividad
            $completada = false;
            if ($user->rol === 'estudiante') {
                $completada = DB::table('actividad_estudiante')
                    ->where('user_id', $user->id)
                    ->where('actividad_id', $actividad->id)
                    ->exists();
            }

            // Armar la respuesta de forma clara
            $response = [
                'id' => $actividad->id,
                'titulo' => $actividad->titulo,
                'descripcion' => $actividad->descripcion,
                'nivel_dificultad' => $actividad->nivel_dificultad,
                'tematica' => [
                    'id' => $actividad->tematica_id,
                    'nombre' => $actividad->tematica_nombre
                ],
                'docente' => $actividad->docente_nombre,
                'retroalimentacion' => [
                    'correcta' => $actividad->retroalimentacion_correcta,
                    'incorrecta' => $actividad->retroalimentacion_incorrecta
                ],
                'created_at' => $actividad->created_at
            ];

            // Agregar permisos según rol
            $response['permisos'] = [
                'puede_editar' => in_array($user->rol, ['admin']) || ($user->rol === 'docente' && $user->id == $actividad->docente_id),
                'puede_eliminar' => in_array($user->rol, ['admin']) || ($user->rol === 'docente' && $user->id == $actividad->docente_id),
                'puede_completar' => $user->rol === 'estudiante' && !$completada
            ];

            // Indicar si ya completó la actividad
            $response['completada'] = $completada;

            return response()->json([
                'success' => true,
                'data' => $response
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Crear nueva actividad - Solo docentes y admin
     */
    public function store(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->rol, ['docente', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Solo docentes y administradores pueden crear actividades'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:100',
            'descripcion' => 'nullable|string',
            'tematica_id' => 'required|exists:tematicas,id',
            'fecha_limite' => 'nullable|date',
            'archivo_material' => 'nullable|file|max:51200', // 50MB
            'estudiantes_ids' => 'nullable|array',
            'estudiantes_ids.*' => 'exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Manejar archivo si existe
            $archivoPath = null;
            if ($request->hasFile('archivo_material')) {
                $file = $request->file('archivo_material');

                // Guardar con nombre único en storage/public/actividades
                $nombreArchivo = time() . '_' . $file->getClientOriginalName();
                $archivoPath = $file->storeAs('actividades', $nombreArchivo, 'public');
            }

            // Crear actividad
            $actividadId = DB::table('actividades')->insertGetId([
                'titulo' => $request->titulo,
                'descripcion' => $request->descripcion,
                'tematica_id' => $request->tematica_id,
                'docente_id' => $user->id,
                'fecha_limite' => $request->fecha_limite,
                'archivo_material' => $archivoPath,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Crear asignaciones
            if ($request->filled('estudiantes_ids')) {
                $asignaciones = [];
                foreach ($request->estudiantes_ids as $estudianteId) {
                    $asignaciones[] = [
                        'actividad_id' => $actividadId,
                        'estudiante_id' => $estudianteId,
                        'docente_id' => $user->id,
                        'fecha_entrega' => $request->fecha_limite ?? null,
                        'created_at' => now(),
                        'updated_at' => now()
                    ];
                }
                DB::table('asignaciones')->insert($asignaciones);
            }

            return response()->json([
                'success' => true,
                'message' => 'Actividad creada y asignada correctamente',
                'data' => [
                    'actividad_id' => $actividadId,
                    'titulo' => $request->titulo,
                    'tematica_id' => $request->tematica_id,
                    'estudiantes_ids' => $request->estudiantes_ids ?? [],
                    'fecha_limite' => $request->fecha_limite,
                    'archivo_material' => $archivoPath
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al crear actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    //descargar material
    public function descargarArchivo($id)
    {
        // Buscar la actividad
        $actividad = DB::table('actividades')->where('id', $id)->first();

        if (!$actividad || !$actividad->archivo_material) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo no encontrado'
            ], 404);
        }

        $path = $actividad->archivo_material;

        // Verificar si el archivo existe en storage/public
        if (!Storage::disk('public')->exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo no encontrado en el servidor'
            ], 404);
        }

        // Descargar archivo
        return Storage::disk('public')->download($path, basename($path));
    }






    /**
     * Actualizar actividad existente
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();

        // Verificar que la actividad existe
        $actividad = DB::table('actividades')->where('id', $id)->first();
        if (!$actividad) {
            return response()->json([
                'success' => false,
                'message' => 'Actividad no encontrada'
            ], 404);
        }

        // Solo el docente creador o admin puede editar
        if ($user->rol !== 'admin' && $actividad->docente_id != $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para editar esta actividad'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'titulo' => 'sometimes|required|string|max:100',
            'descripcion' => 'nullable|string',
            'tematica_id' => 'sometimes|required|exists:tematicas,id',
            'estudiantes_ids' => 'nullable|array',
            'estudiantes_ids.*' => 'exists:users,id',
            'fecha_limite' => 'nullable|date',
            'archivo_material' => 'nullable|file|max:10240'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Actualizar tabla actividades
            $datosActualizar = $request->only([
                'titulo', 'descripcion', 'tematica_id', 'fecha_limite'
            ]);
            $datosActualizar['updated_at'] = now();

            // Manejar archivo material
            if ($request->hasFile('archivo_material')) {
                $file = $request->file('archivo_material');
                $nombreArchivo = time() . '_' . $file->getClientOriginalName();
                $file->storeAs('public/materiales', $nombreArchivo);
                $datosActualizar['archivo_material'] = $nombreArchivo;
            }

            DB::table('actividades')->where('id', $id)->update($datosActualizar);

            // Actualizar asignaciones de estudiantes si se envían
            if ($request->has('estudiantes_ids')) {
                $nuevosEstudiantes = $request->estudiantes_ids;

                // Eliminar asignaciones que ya no están
                DB::table('asignaciones')
                    ->where('actividad_id', $id)
                    ->whereNotIn('estudiante_id', $nuevosEstudiantes)
                    ->delete();

                // Insertar nuevas asignaciones (evitar duplicados)
                $asignacionesExistentes = DB::table('asignaciones')
                    ->where('actividad_id', $id)
                    ->pluck('estudiante_id')
                    ->toArray();

                $asignacionesAgregar = array_diff($nuevosEstudiantes, $asignacionesExistentes);

                foreach ($asignacionesAgregar as $estudianteId) {
                    DB::table('asignaciones')->insert([
                        'actividad_id' => $id,
                        'estudiante_id' => $estudianteId,
                        'docente_id' => $actividad->docente_id,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Actividad actualizada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }



    /**
     * Eliminar actividad y sus asignaciones
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();

        $actividad = DB::table('actividades')->where('id', $id)->first();

        if (!$actividad) {
            return response()->json([
                'success' => false,
                'message' => 'Actividad no encontrada'
            ], 404);
        }

        // Solo el docente creador o admin puede eliminar
        if ($user->rol !== 'admin' && $actividad->docente_id != $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para eliminar esta actividad'
            ], 403);
        }

        try {
            // Eliminar asignaciones relacionadas
            DB::table('asignaciones')
                ->where('actividad_id', $id)
                ->delete();

            // Eliminar la actividad
            DB::table('actividades')
                ->where('id', $id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Actividad y asignaciones eliminadas correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Asignar actividad a estudiante específico - Solo docentes y admin
     */
    public function assignToStudent(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->rol, ['docente', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Solo docentes y administradores pueden asignar actividades'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'actividad_id' => 'required|exists:actividades,id',
            'estudiante_id' => 'required|exists:users,id',
            'fecha_limite' => 'nullable|date|after:today',
            'instrucciones_especiales' => 'nullable|string'
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
                ->where('id', $request->estudiante_id)
                ->where('rol', 'estudiante')
                ->first();

            if (!$estudiante) {
                return response()->json([
                    'success' => false,
                    'message' => 'El usuario seleccionado no es un estudiante'
                ], 400);
            }

            // Por ahora solo retornamos confirmación
            // En una implementación completa, crearíamos una tabla actividad_asignaciones
            
            return response()->json([
                'success' => true,
                'message' => 'Actividad asignada exitosamente',
                'data' => [
                    'actividad_id' => $request->actividad_id,
                    'estudiante' => $estudiante->nombre . ' ' . $estudiante->apellido,
                    'asignado_por' => $user->nombre . ' ' . $user->apellido,
                    'fecha_asignacion' => now(),
                    'fecha_limite' => $request->fecha_limite,
                    'instrucciones_especiales' => $request->instrucciones_especiales
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    //gteestudianadoes
    public function getEstudiantes()
    {
        // Filtramos solo los usuarios con rol 'estudiante'
        $estudiantes = \App\Models\User::where('rol', 'estudiante')
            ->get(['id', 'nombre', 'apellido']); // Solo los campos necesarios

        return response()->json([
            'success' => true,
            'data' => $estudiantes
        ]);
    }


    /**
     * Obtener actividades por estudiante específico
     */
    public function getByStudent($studentId, Request $request)
    {
        $user = $request->user();

        // Verificar permisos: admin, docente, o el mismo estudiante
        if ($user->rol === 'estudiante' && $user->id != $studentId) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para ver actividades de otros estudiantes'
            ], 403);
        }

        try {
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

            // Obtener nivel diagnóstico del estudiante
            $pruebaDiagnostica = DB::table('pruebas_diagnosticas')
                ->where('user_id', $studentId)
                ->orderBy('fecha', 'desc')
                ->first();

            $dificultadRecomendada = $this->getDificultadPorPuntaje($pruebaDiagnostica->puntaje ?? 0);

            // Obtener actividades recomendadas
            $actividades = DB::table('actividades')
                ->join('tematicas', 'actividades.tematica_id', '=', 'tematicas.id')
                ->join('users as docentes', 'actividades.docente_id', '=', 'docentes.id')
                ->where('actividades.nivel_dificultad', $dificultadRecomendada)
                ->select(
                    'actividades.id',
                    'actividades.titulo',
                    'actividades.descripcion',
                    'actividades.nivel_dificultad',
                    'tematicas.id as tematica_id',
                    'tematicas.nombre as tematica_nombre',
                    DB::raw('CONCAT(docentes.nombre, " ", docentes.apellido) as docente_nombre')
                )
                ->get();

            // Transformar actividades a un formato limpio
            $actividadesTransformadas = $actividades->map(function($actividad) {
                return [
                    'id' => $actividad->id,
                    'titulo' => $actividad->titulo,
                    'descripcion' => $actividad->descripcion,
                    'nivel_dificultad' => $actividad->nivel_dificultad,
                    'tematica' => [
                        'id' => $actividad->tematica_id,
                        'nombre' => $actividad->tematica_nombre
                    ],
                    'docente' => $actividad->docente_nombre
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'estudiante' => [
                        'id' => $estudiante->id,
                        'nombre' => $estudiante->nombre . ' ' . $estudiante->apellido,
                        'nivel_recomendado' => $dificultadRecomendada
                    ],
                    'actividades' => $actividadesTransformadas,
                    'total_actividades' => $actividadesTransformadas->count()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener actividades del estudiante',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Completar una actividad - Solo estudiantes
     */
    /**
     * Completar una actividad - Solo estudiantes
     */
    /**
     * Completar una actividad - Solo estudiantes
     */
    public function complete(Request $request)
    {
        $user = $request->user();

        if ($user->rol !== 'estudiante') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los estudiantes pueden completar actividades'
            ], 403);
        }

        // Validación
        $validator = Validator::make($request->all(), [
            'actividad_id' => 'required|exists:actividades,id',
            'texto_entrega' => 'nullable|string',
            'archivo_entrega' => 'nullable|file|max:10240', // 10MB máximo
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Buscar la asignación del estudiante
            $asignacion = DB::table('asignaciones')
                ->where('actividad_id', $request->actividad_id)
                ->where('estudiante_id', $user->id)
                ->first();

            if (!$asignacion) {
                return response()->json([
                    'success' => false,
                    'message' => 'Asignación no encontrada'
                ], 404);
            }

            $dataUpdate = [
                'texto_entrega' => $request->texto_entrega ?? $asignacion->texto_entrega,
                'fecha_entrega' => now(),
            ];

            // Manejar archivo de entrega con la lógica de store
            if ($request->hasFile('archivo_entrega')) {
                $file = $request->file('archivo_entrega');

                // Guardar con nombre único en storage/public/entregas
                $nombreArchivo = time() . '_' . $file->getClientOriginalName();
                $archivoPath = $file->storeAs('entregas', $nombreArchivo, 'public');

                $dataUpdate['archivo_entrega'] = $archivoPath;
            }

            // Actualizar la asignación
            DB::table('asignaciones')
                ->where('id', $asignacion->id)
                ->update($dataUpdate);

            // Generar URL pública del archivo si existe
            $urlArchivo = isset($dataUpdate['archivo_entrega'])
                ? url('storage/' . $dataUpdate['archivo_entrega'])
                : null;

            return response()->json([
                'success' => true,
                'message' => 'Entrega enviada correctamente',
                'data' => [
                    'actividad_id' => $request->actividad_id,
                    'texto_entrega' => $dataUpdate['texto_entrega'],
                    'archivo_entrega' => $dataUpdate['archivo_entrega'] ?? null,
                    'archivo_url' => $urlArchivo,
                    'fecha_entrega' => $dataUpdate['fecha_entrega'],
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al completar actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Descargar archivo de entrega de actividad
     */
    public function descargarEntrega($asignacionId, Request $request)
    {
        $user = $request->user();

        // Buscar la asignación
        $asignacion = DB::table('asignaciones')
            ->where('id', $asignacionId)
            ->first();

        if (!$asignacion) {
            return response()->json([
                'success' => false,
                'message' => 'Asignación no encontrada'
            ], 404);
        }

        // Verificar que el usuario sea el estudiante de la asignación
        if ($user->rol !== 'estudiante' || $user->id != $asignacion->estudiante_id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para descargar esta entrega'
            ], 403);
        }

        // Verificar si hay archivo
        if (!$asignacion->archivo_entrega) {
            return response()->json([
                'success' => false,
                'message' => 'No hay archivo para descargar'
            ], 404);
        }

        // Construir ruta relativa al storage/public
        $filePath = $asignacion->archivo_entrega; // ej: 'entregas/nombreArchivo.ext'

        // Verificar si el archivo existe en el disco 'public'
        if (!Storage::disk('public')->exists($filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo no encontrado en el servidor'
            ], 404);
        }

        // Descargar archivo usando Storage (misma lógica que descargarArchivo)
        return Storage::disk('public')->download($filePath, basename($filePath));
    }


    /**
     * Obtener todas las entregas de una actividad - Solo docentes/admin
     */
    public function getEntregasActividad($actividadId)
    {
        $user = auth()->user();

        // Verificar que la actividad exista
        $actividad = DB::table('actividades')->where('id', $actividadId)->first();
        if (!$actividad) {
            return response()->json([
                'success' => false,
                'message' => 'Actividad no encontrada'
            ], 404);
        }

        // Solo el docente que creó la actividad o admin puede ver entregas
        if ($user->rol !== 'admin' && $actividad->docente_id != $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para ver estas entregas'
            ], 403);
        }

        // Obtener todas las entregas de estudiantes
        $entregas = DB::table('asignaciones as a')
            ->join('users as estudiantes', 'a.estudiante_id', '=', 'estudiantes.id')
            ->where('a.actividad_id', $actividadId)
            ->select(
                'estudiantes.id as estudiante_id',
                DB::raw('CONCAT(estudiantes.nombre, " ", estudiantes.apellido) as estudiante_nombre'),
                'a.texto_entrega',
                'a.archivo_entrega',
                'a.fecha_entrega'
            )
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'entregas' => $entregas
            ]
        ]);
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
}