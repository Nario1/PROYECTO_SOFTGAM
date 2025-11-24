<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Cloudinary\Cloudinary;

class ActividadController extends Controller
{
    private $cloudinary;

    public function __construct()
    {
        // Configuración manual directa de Cloudinary - MISMA QUE RecursoController
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => 'dh1bttxzc',
                'api_key'    => '141732261349856',
                'api_secret' => 'hpboEwwBC_o_v5EQ810gS54y1go',
            ],
            'url' => [
                'secure' => true
            ]
        ]);
    }

    /**
     * Listar actividades - Filtrable según rol
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            switch ($user->rol) {
                case 'estudiante':
                    return $this->getActividadesParaEstudiante($user->id);
                case 'docente':
                    return $this->getActividadesParaDocente($user->id);
                case 'admin':
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
     * Vista de actividades para ESTUDIANTE - Solo asignadas
     */
    public function getActividadesParaEstudiante($userId)
    {
        $user = DB::table('users')->where('id', $userId)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Estudiante no encontrado'
            ], 404);
        }

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
                'actividades.archivo_public_id',
                'actividades.nombre_archivo_original',
                'actividades.extension_original',
                'actividades.created_at',
                'actividades.updated_at',
                'tematicas.nombre as tematica_nombre',
                DB::raw('CONCAT(docentes.nombre, " ", docentes.apellido) as docente_nombre'),
                'a.texto_entrega',
                'a.archivo_entrega',
                'a.archivo_entrega_public_id',
                'a.nombre_archivo_original_entrega',
                'a.extension_original_entrega',
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

    /**
     * Get actividades para docente
     */
    public function getActividadesParaDocente($docenteId)
    {
        $user = DB::table('users')->where('id', $docenteId)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Docente no encontrado'
            ], 404);
        }

        $actividades = DB::table('actividades')
            ->join('tematicas', 'actividades.tematica_id', '=', 'tematicas.id')
            ->where('actividades.docente_id', $user->id)
            ->select(
                'actividades.id',
                'actividades.titulo',
                'actividades.descripcion',
                'actividades.fecha_limite',
                'actividades.archivo_material',
                'actividades.archivo_public_id',
                'actividades.nombre_archivo_original',
                'actividades.extension_original',
                'actividades.created_at',
                'tematicas.nombre as tematica_nombre'
            )
            ->orderBy('actividades.created_at', 'desc')
            ->get();

        $actividadesConEntregas = $actividades->map(function($actividad) {
            $entregas = DB::table('asignaciones as a')
                ->join('users as estudiantes', 'a.estudiante_id', '=', 'estudiantes.id')
                ->where('a.actividad_id', $actividad->id)
                ->select(
                    'estudiantes.id as estudiante_id',
                    DB::raw('CONCAT(estudiantes.nombre, " ", estudiantes.apellido) as estudiante_nombre'),
                    'a.texto_entrega',
                    'a.archivo_entrega',
                    'a.archivo_entrega_public_id',
                    'a.nombre_archivo_original_entrega',
                    'a.extension_original_entrega',
                    'a.fecha_entrega'
                )
                ->get();

            return [
                'id' => $actividad->id,
                'titulo' => $actividad->titulo,
                'descripcion' => $actividad->descripcion,
                'fecha_limite' => $actividad->fecha_limite,
                'archivo_material' => $actividad->archivo_material,
                'archivo_public_id' => $actividad->archivo_public_id,
                'nombre_archivo_original' => $actividad->nombre_archivo_original,
                'extension_original' => $actividad->extension_original,
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
            // Manejar archivo material con Cloudinary - MISMA LÓGICA QUE RecursoController
            $archivoUrl = null;
            $archivoPublicId = null;
            $nombreArchivoOriginal = null;
            $extensionOriginal = null;
            
            if ($request->hasFile('archivo_material')) {
                $file = $request->file('archivo_material');
                
                Log::info('Subiendo archivo material a Cloudinary: ' . $file->getClientOriginalName());

                // 🔥 USAR MISMA CONFIGURACIÓN QUE RecursoController
                $uploadResult = $this->cloudinary->uploadApi()->upload(
                    $file->getRealPath(),
                    [
                        'folder' => 'softgam/actividades/materiales',
                        'resource_type' => 'auto'
                    ]
                );

                $archivoUrl = $uploadResult['secure_url'];
                $archivoPublicId = $uploadResult['public_id'];
                
                // Guardar nombre original y extensión
                $nombreArchivoOriginal = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $extensionOriginal = $file->getClientOriginalExtension();

                Log::info('Archivo material subido: ' . $archivoUrl);
                Log::info('URL tendrá estructura: https://res.cloudinary.com/dh1bttxzc/raw/upload/...');
            }

            // Crear actividad
            $actividadId = DB::table('actividades')->insertGetId([
                'titulo' => $request->titulo,
                'descripcion' => $request->descripcion,
                'tematica_id' => $request->tematica_id,
                'docente_id' => $user->id,
                'fecha_limite' => $request->fecha_limite,
                'archivo_material' => $archivoUrl,
                'archivo_public_id' => $archivoPublicId,
                'nombre_archivo_original' => $nombreArchivoOriginal,
                'extension_original' => $extensionOriginal,
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
                    'archivo_material' => $archivoUrl,
                    'nombre_archivo_original' => $nombreArchivoOriginal,
                    'extension_original' => $extensionOriginal
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error al crear actividad: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al crear actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Descargar material de actividad - MISMA LÓGICA EXACTA QUE RecursoController
     */
    public function descargarArchivo($id)
    {
        $actividad = DB::table('actividades')->where('id', $id)->first();

        if (!$actividad || !$actividad->archivo_material) {
            return response()->json([
                'success' => false,
                'message' => 'Archivo no encontrado'
            ], 404);
        }

        // MISMA LÓGICA EXACTA QUE RecursoController - Retornar URL directa de Cloudinary
        return response()->json([
            'success' => true,
            'download_url' => $actividad->archivo_material,
            'file_name' => $this->generarNombreDescarga($actividad)
        ]);
    }

    private function generarNombreDescarga($actividad)
    {
        // MISMA LÓGICA EXACTA QUE RecursoController
        $extension = pathinfo($actividad->archivo_material, PATHINFO_EXTENSION);
        $nombreBase = preg_replace('/[^a-zA-Z0-9-_]/', '_', $actividad->titulo);
        
        if (!$extension) {
            // Usar extension_original si está disponible, sino determinar por tipo
            if ($actividad->extension_original) {
                $extension = $actividad->extension_original;
            } else {
                $extensiones = [
                    'pdf' => 'pdf',
                    'doc' => 'docx',
                    'docx' => 'docx',
                    'txt' => 'txt',
                    'ppt' => 'pptx',
                    'pptx' => 'pptx',
                    'xlsx' => 'xlsx',
                    'csv' => 'csv',
                    'jpg' => 'jpg',
                    'jpeg' => 'jpeg',
                    'png' => 'png',
                    'gif' => 'gif',
                    'mp4' => 'mp4',
                    'mov' => 'mov',
                    'avi' => 'avi'
                ];
                $extension = $extensiones[$actividad->extension_original] ?? 'bin';
            }
        }

        return $nombreBase . '.' . $extension;
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
            'archivo_material' => 'nullable|file|max:51200'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Manejar archivo material con Cloudinary
            $datosActualizar = $request->only([
                'titulo', 'descripcion', 'tematica_id', 'fecha_limite'
            ]);
            $datosActualizar['updated_at'] = now();

            // Manejar archivo material - MISMA LÓGICA QUE RecursoController
            if ($request->hasFile('archivo_material')) {
                $file = $request->file('archivo_material');
                
                Log::info('Actualizando archivo material en Cloudinary: ' . $file->getClientOriginalName());

                // Si ya existe un archivo anterior, eliminarlo de Cloudinary
                if ($actividad->archivo_public_id) {
                    try {
                        $this->cloudinary->uploadApi()->destroy($actividad->archivo_public_id);
                    } catch (\Exception $e) {
                        Log::error('Error al eliminar archivo anterior: ' . $e->getMessage());
                    }
                }

                $uploadResult = $this->cloudinary->uploadApi()->upload(
                    $file->getRealPath(),
                    [
                        'folder' => 'softgam/actividades/materiales',
                        'resource_type' => 'auto'
                    ]
                );

                $datosActualizar['archivo_material'] = $uploadResult['secure_url'];
                $datosActualizar['archivo_public_id'] = $uploadResult['public_id'];
                
                // Guardar nombre original y extensión
                $datosActualizar['nombre_archivo_original'] = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $datosActualizar['extension_original'] = $file->getClientOriginalExtension();

                Log::info('Archivo material actualizado: ' . $datosActualizar['archivo_material']);
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
            Log::error('Error al actualizar actividad: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar actividad',
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

            // Crear asignación
            DB::table('asignaciones')->insert([
                'actividad_id' => $request->actividad_id,
                'estudiante_id' => $request->estudiante_id,
                'docente_id' => $user->id,
                'fecha_entrega' => $request->fecha_limite,
                'created_at' => now(),
                'updated_at' => now()
            ]);

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
            Log::error('Error al asignar actividad: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al asignar actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estudiantes
     */
    public function getEstudiantes()
    {
        try {
            // Filtramos solo los usuarios con rol 'estudiante'
            $estudiantes = DB::table('users')
                ->where('rol', 'estudiante')
                ->select('id', 'nombre', 'apellido')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $estudiantes
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener estudiantes: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estudiantes',
                'error' => $e->getMessage()
            ], 500);
        }
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
            Log::error('Error al obtener actividades del estudiante: ' . $e->getMessage());
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
    public function complete(Request $request)
    {
        $user = $request->user();

        if ($user->rol !== 'estudiante') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los estudiantes pueden completar actividades'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'actividad_id' => 'required|exists:actividades,id',
            'texto_entrega' => 'nullable|string',
            'archivo_entrega' => 'nullable|file|max:51200', // 50MB
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

            // Manejar archivo de entrega con Cloudinary - MISMA LÓGICA
            if ($request->hasFile('archivo_entrega')) {
                $file = $request->file('archivo_entrega');
                
                Log::info('Subiendo archivo de entrega a Cloudinary: ' . $file->getClientOriginalName());

                // Si ya existe un archivo anterior, eliminarlo de Cloudinary
                if ($asignacion->archivo_entrega_public_id) {
                    try {
                        $this->cloudinary->uploadApi()->destroy($asignacion->archivo_entrega_public_id);
                    } catch (\Exception $e) {
                        Log::error('Error al eliminar archivo anterior: ' . $e->getMessage());
                    }
                }

                $uploadResult = $this->cloudinary->uploadApi()->upload(
                    $file->getRealPath(),
                    [
                        'folder' => 'softgam/actividades/entregas',
                        'resource_type' => 'auto'
                    ]
                );

                $dataUpdate['archivo_entrega'] = $uploadResult['secure_url'];
                $dataUpdate['archivo_entrega_public_id'] = $uploadResult['public_id'];
                $dataUpdate['nombre_archivo_original_entrega'] = $file->getClientOriginalName();
                $dataUpdate['extension_original_entrega'] = $file->getClientOriginalExtension();

                Log::info('Archivo de entrega subido: ' . $dataUpdate['archivo_entrega']);
            }

            // Actualizar la asignación
            DB::table('asignaciones')
                ->where('id', $asignacion->id)
                ->update($dataUpdate);

            return response()->json([
                'success' => true,
                'message' => 'Entrega enviada correctamente',
                'data' => [
                    'actividad_id' => $request->actividad_id,
                    'texto_entrega' => $dataUpdate['texto_entrega'],
                    'archivo_entrega' => $dataUpdate['archivo_entrega'] ?? null,
                    'nombre_archivo_original_entrega' => $dataUpdate['nombre_archivo_original_entrega'] ?? null,
                    'extension_original_entrega' => $dataUpdate['extension_original_entrega'] ?? null,
                    'fecha_entrega' => $dataUpdate['fecha_entrega'],
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error al completar actividad: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al completar actividad',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Descargar archivo de entrega - MISMA LÓGICA EXACTA QUE RecursoController
     */
    public function descargarEntrega($id, Request $request)
    {
        $user = $request->user();

        // Buscar la asignación por actividad_id y estudiante_id
        $asignacion = DB::table('asignaciones')
            ->where('actividad_id', $id)
            ->where('estudiante_id', $user->id)
            ->first();

        if (!$asignacion) {
            return response()->json([
                'success' => false,
                'message' => 'Asignación no encontrada'
            ], 404);
        }

        // Verificar permisos - permitir docente y estudiante dueño del archivo
        $puedeDescargar = false;
        
        if ($user->rol === 'estudiante' && $user->id == $asignacion->estudiante_id) {
            $puedeDescargar = true;
        } elseif ($user->rol === 'docente' || $user->rol === 'admin') {
            // Verificar si el docente es el creador de la actividad
            $actividad = DB::table('actividades')->where('id', $asignacion->actividad_id)->first();
            if ($actividad && ($user->rol === 'admin' || $actividad->docente_id == $user->id)) {
                $puedeDescargar = true;
            }
        }

        if (!$puedeDescargar) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para descargar esta entrega'
            ], 403);
        }

        if (!$asignacion->archivo_entrega) {
            return response()->json([
                'success' => false,
                'message' => 'No hay archivo para descargar'
            ], 404);
        }

        // MISMA LÓGICA EXACTA QUE RecursoController - Retornar URL directa de Cloudinary
        return response()->json([
            'success' => true,
            'download_url' => $asignacion->archivo_entrega,
            'file_name' => $this->generarNombreEntrega($asignacion)
        ]);
    }

    private function generarNombreEntrega($asignacion)
    {
        // MISMA LÓGICA EXACTA QUE RecursoController
        $extension = pathinfo($asignacion->archivo_entrega, PATHINFO_EXTENSION);
        
        // Priorizar nombre_archivo_original_entrega y extension_original_entrega si están disponibles
        if ($asignacion->nombre_archivo_original_entrega && $asignacion->extension_original_entrega) {
            return $asignacion->nombre_archivo_original_entrega . '.' . $asignacion->extension_original_entrega;
        }

        // Obtener título de la actividad para el nombre base
        $actividad = DB::table('actividades')->where('id', $asignacion->actividad_id)->first();
        $nombreBase = preg_replace('/[^a-zA-Z0-9-_]/', '_', $actividad->titulo . '_entrega');
        
        if (!$extension) {
            $extension = $asignacion->extension_original_entrega ?? 'pdf';
        }

        return $nombreBase . '.' . $extension;
    }

    /**
     * Eliminar actividad y sus archivos de Cloudinary
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

        if ($user->rol !== 'admin' && $actividad->docente_id != $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para eliminar esta actividad'
            ], 403);
        }

        try {
            // Eliminar archivo material de Cloudinary si existe
            if ($actividad->archivo_public_id) {
                try {
                    $this->cloudinary->uploadApi()->destroy($actividad->archivo_public_id);
                } catch (\Exception $e) {
                    Log::error('Error al eliminar archivo material: ' . $e->getMessage());
                }
            }

            // Obtener y eliminar archivos de entrega de Cloudinary
            $entregas = DB::table('asignaciones')
                ->where('actividad_id', $id)
                ->whereNotNull('archivo_entrega_public_id')
                ->get();

            foreach ($entregas as $entrega) {
                try {
                    $this->cloudinary->uploadApi()->destroy($entrega->archivo_entrega_public_id);
                } catch (\Exception $e) {
                    Log::error('Error al eliminar archivo de entrega: ' . $e->getMessage());
                }
            }

            // Eliminar asignaciones
            DB::table('asignaciones')->where('actividad_id', $id)->delete();

            // Eliminar la actividad
            DB::table('actividades')->where('id', $id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Actividad y archivos eliminados correctamente'
            ]);
        } catch (\Exception $e) {
            Log::error('Error al eliminar actividad: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar actividad',
                'error' => $e->getMessage()
            ], 500);
        }
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
                'a.archivo_entrega_public_id',
                'a.nombre_archivo_original_entrega',
                'a.extension_original_entrega',
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
     * Método para admin (placeholder)  
     */
    public function getActividadesParaAdmin($user, $request)
    {
        // Implementar lógica para admin si es necesario
        return response()->json([
            'success' => true,
            'data' => [
                'rol' => 'admin',
                'message' => 'Vista de admin - Pendiente de implementar'
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