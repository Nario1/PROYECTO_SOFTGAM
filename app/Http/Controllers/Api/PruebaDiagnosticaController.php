<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use App\Models\Pregunta;  
use App\Models\Prueba;  // ✅ Esto es clave
// ✅ Esto es clave
use App\Models\Respuesta;
use Carbon\Carbon;

use App\Models\PruebaDiagnostica;



class PruebaDiagnosticaController extends Controller
{
    /**
     * Listar todas las pruebas diagnósticas (solo admin y docente)
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->rol, ['docente', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para ver todas las pruebas'
            ], 403);
        }

        $pruebas = DB::table('pruebas_diagnosticas')
            ->join('users', 'pruebas_diagnosticas.user_id', '=', 'users.id')
            ->select(
                'pruebas_diagnosticas.*',
                DB::raw('CONCAT(users.nombre, " ", users.apellido) as estudiante_nombre')
            )
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pruebas
        ]);
    }
    /**
     * Eliminar una prueba diagnóstica (solo admin o docente)
     */
    public function destroyPrueba($id, Request $request)
    {
        $user = $request->user();

        // Solo admin o docente pueden eliminar
        if (!in_array($user->rol, ['admin', 'docente'])) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para eliminar esta prueba'
            ], 403);
        }

        // Buscar la prueba
        $prueba = Prueba::find($id);

        if (!$prueba) {
            return response()->json([
                'success' => false,
                'message' => 'Prueba no encontrada'
            ], 404);
        }

        try {
            DB::beginTransaction();

            // Eliminar preguntas asociadas
            Pregunta::where('prueba_id', $prueba->id)->delete();

            // Eliminar pruebas diagnósticas asociadas
            PruebaDiagnostica::where('prueba_id', $prueba->id)->delete();

            // Eliminar la prueba principal
            $prueba->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Prueba eliminada correctamente'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar la prueba',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Mostrar detalle de una prueba diagnóstica
     */
    /**
     * Mostrar detalle de una prueba diagnóstica
     */
    public function show($id, Request $request)
    {
        // Buscamos la prueba con sus relaciones
        $prueba = PruebaDiagnostica::with(['estudiante', 'prueba'])->find($id);

        if (!$prueba) {
            return response()->json([
                'success' => false,
                'message' => 'Prueba diagnóstica no encontrada'
            ], 404);
        }

        // Formateamos la respuesta
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $prueba->id,
                'estudiante' => [
                    'id' => $prueba->estudiante->id,
                    'nombre' => $prueba->estudiante->nombre . ' ' . $prueba->estudiante->apellido
                ],
                'prueba' => [
                    'id' => $prueba->prueba->id,
                    'titulo' => $prueba->prueba->titulo
                ],
                'categoria' => $prueba->categoria,
                'puntaje' => $prueba->puntaje,
                'fecha' => $prueba->fecha,
                'created_at' => $prueba->created_at,
                'updated_at' => $prueba->updated_at
            ]
        ]);
    }

    //guardar prueba
    /**
 * Guardar nueva prueba
 */
    // Guardar prueba en la tabla "pruebas"
    public function storePrueba(Request $request)
    {
        // Validar los datos
        $validated = $request->validate([
            'titulo' => 'required|string|max:100',
            'descripcion' => 'nullable|string',
        ]);

        // Crear la prueba usando Eloquent
        $prueba = Prueba::create([
            'titulo' => $validated['titulo'],
            'descripcion' => $validated['descripcion'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $prueba
        ], 201);
    }



    /**
     * Registrar resultado de prueba diagnóstica
     */
    public function store(Request $request)
    {
        $user = $request->user();

        // Verificar rol
        if (!in_array($user->rol, ['docente', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para registrar pruebas'
            ], 403);
        }

        // Validación básica
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'prueba_id' => 'required|exists:pruebas,id',
            'categoria' => 'required|string|max:50',
            'respuestas' => 'required|array',          // Respuestas del estudiante
            'respuestas.*' => 'required|string',      // Cada respuesta debe ser string
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $validator->errors()
            ], 422);
        }

        // Obtener respuestas correctas de la prueba
        $prueba = Prueba::find($request->prueba_id);
        $respuestas_correctas = $prueba->respuestas_correctas ?? []; // Array de correctas

        // Calcular puntaje: contar cuántas respuestas son correctas
        $puntaje = 0;
        foreach ($request->respuestas as $index => $respuesta) {
            if (isset($respuestas_correctas[$index]) && $respuestas_correctas[$index] == $respuesta) {
                $puntaje++;
            }
        }

        // Guardar en la BD
        $id = DB::table('pruebas_diagnosticas')->insertGetId([
            'user_id' => $request->user_id,
            'prueba_id' => $request->prueba_id,
            'categoria' => $request->categoria,
            'puntaje' => $puntaje,      // 👈 puntaje = correctas
            'fecha' => $request->fecha ?? now(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Prueba diagnóstica registrada exitosamente',
            'data' => [
                'prueba_id' => $id,
                'puntaje' => $puntaje    // Retornamos el puntaje calculado
            ]
        ], 201);
    }


    /**
     * Obtener pruebas realizadas por un estudiante específico
     */
    public function getByStudent($user_id, Request $request)
    {
        $user = $request->user();

        if ($user->rol === 'estudiante' && $user->id != $user_id) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes ver pruebas de otro estudiante'
            ], 403);
        }

        $pruebas = DB::table('pruebas_diagnosticas')
            ->where('user_id', $user_id)
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pruebas
        ]);
    }

    /**
     * Asignar categoría según puntaje
     */
    public function assignCategory($user_id)
    {
        $ultimaPrueba = DB::table('pruebas_diagnosticas')
            ->where('user_id', $user_id)
            ->orderBy('fecha', 'desc')
            ->first();

        if (!$ultimaPrueba) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontró ninguna prueba para este estudiante'
            ], 404);
        }

        $categoria = $this->getCategoriaPorPuntaje($ultimaPrueba->puntaje);

        // Aquí se podría actualizar un campo de usuario o tabla de progreso
        return response()->json([
            'success' => true,
            'data' => [
                'user_id' => $user_id,
                'puntaje' => $ultimaPrueba->puntaje,
                'categoria_asignada' => $categoria
            ]
        ]);
    }

    /**
     * Obtener recomendaciones según diagnóstico
     */
    public function getRecommendations($user_id)
    {
        $ultimaPrueba = DB::table('pruebas_diagnosticas')
            ->where('user_id', $user_id)
            ->orderBy('fecha', 'desc')
            ->first();

        if (!$ultimaPrueba) {
            return response()->json([
                'success' => false,
                'message' => 'No se encontró ninguna prueba para este estudiante'
            ], 404);
        }

        $categoria = $this->getCategoriaPorPuntaje($ultimaPrueba->puntaje);

        // Ejemplo: recomendación de actividades según dificultad
        $dificultad = $this->getDificultadPorCategoria($categoria);

        $actividades = DB::table('actividades')
            ->where('nivel_dificultad', $dificultad)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'user_id' => $user_id,
                'categoria' => $categoria,
                'nivel_recomendado' => $dificultad,
                'actividades_recomendadas' => $actividades
            ]
        ]);
    }

    /**
     * Obtener estadísticas generales de pruebas
     */
    public function getStatistics()
    {
        $totalPruebas = DB::table('pruebas_diagnosticas')->count();

        $porCategoria = DB::table('pruebas_diagnosticas')
            ->select('categoria', DB::raw('COUNT(*) as total'))
            ->groupBy('categoria')
            ->get();

        $promedioPuntaje = DB::table('pruebas_diagnosticas')
            ->avg('puntaje');

        return response()->json([
            'success' => true,
            'data' => [
                'total_pruebas' => $totalPruebas,
                'por_categoria' => $porCategoria,
                'promedio_puntaje' => $promedioPuntaje
            ]
        ]);
    }

    /**
     * Función privada: Determinar categoría según puntaje
     */
    private function getCategoriaPorPuntaje($puntaje)
    {
        if ($puntaje >= 80) return 'avanzado';
        if ($puntaje >= 60) return 'intermedio';
        return 'inicio';
    }

    /**
     * Función privada: Determinar dificultad según categoría
     */
    private function getDificultadPorCategoria($categoria)
    {
        switch ($categoria) {
            case 'avanzado': return 'dificil';
            case 'intermedio': return 'medio';
            default: return 'facil';
        }
    }

    
    /**
     * Obtener todas las preguntas de una prueba específica
     */
    public function getPreguntas($prueba_id)
    {
        $preguntas = Pregunta::where('prueba_id', $prueba_id)
            ->select('id', 'prueba_id', 'texto', 'opciones', 'respuesta_correcta', 'created_at', 'updated_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $preguntas
        ]);
    }


    //reprotes de prueba diagnóstica
    public function getReportes()
    {
        // Traer todas las pruebas diagnósticas con estudiante y prueba
        $reportes = PruebaDiagnostica::with(['estudiante', 'prueba'])->get()->map(function ($p) {
            // Contar cuántas respuestas correctas tiene esta prueba
            $puntaje = \DB::table('respuestas')
                ->where('prueba_diagnostica_id', $p->id)
                ->where('correcta', 1)
                ->count();

            return [
                'id' => $p->id,
                'estudiante' => [
                    'id' => $p->estudiante->id,
                    'nombre' => $p->estudiante->nombre . ' ' . $p->estudiante->apellido,
                ],
                'prueba' => [
                    'id' => $p->prueba->id,
                    'titulo' => $p->prueba->titulo,
                ],
                'puntaje' => $puntaje, // 1 punto por cada respuesta correcta
                'categoria' => $p->categoria,
                'fecha' => $p->fecha,
            ];
        });

        return response()->json(['success' => true, 'data' => $reportes]);
    }









    //enviar respuestas de prueba diagnóstica
    public function enviarRespuestas(Request $request, $prueba_id)
    {
        $user = $request->user();

        if ($user->rol !== 'estudiante') {
            return response()->json(['success' => false, 'message' => 'Solo estudiantes pueden rendir esta prueba'], 403);
        }

        $request->validate([
            'respuestas' => 'required|array',
            'respuestas.*.pregunta_id' => 'required|exists:preguntas,id',
            'respuestas.*.respuesta' => 'required|string'
        ]);

        DB::beginTransaction();
        try {
            $pruebaDiagnostica = PruebaDiagnostica::create([
                'user_id' => $user->id,
                'prueba_id' => $prueba_id,
                'categoria' => '',
                'puntaje' => 0,
                'fecha' => now()->toDateString()
            ]);

            $correctas = 0;
            $total = count($request->respuestas);
            $feedback = []; // Aquí guardaremos el detalle de cada pregunta

            foreach ($request->respuestas as $r) {
                $pregunta = Pregunta::findOrFail($r['pregunta_id']);
                $esCorrecta = $pregunta->respuesta_correcta === $r['respuesta'];
                if ($esCorrecta) $correctas++;

                Respuesta::create([
                    'prueba_diagnostica_id' => $pruebaDiagnostica->id,
                    'pregunta_id' => $pregunta->id,
                    'user_id' => $user->id,
                    'respuesta' => $r['respuesta'],
                    'correcta' => $esCorrecta
                ]);

                // Guardamos el feedback por pregunta
                $feedback[] = [
                    'pregunta_id' => $pregunta->id,
                    'texto' => $pregunta->texto,
                    'respuesta_estudiante' => $r['respuesta'],
                    'respuesta_correcta' => $pregunta->respuesta_correcta,
                    'correcta' => $esCorrecta
                ];
            }

            $puntaje = ($correctas / max($total, 1)) * 100;
            $categoria = 'Baja';
            if ($puntaje >= 80) $categoria = 'Alta';
            elseif ($puntaje >= 50) $categoria = 'Media';

            $pruebaDiagnostica->update([
                'puntaje' => $puntaje,
                'categoria' => $categoria
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Prueba rendida exitosamente',
                'data' => [
                    'prueba_diagnostica_id' => $pruebaDiagnostica->id,
                    'correctas' => $correctas,
                    'total' => $total,
                    'puntaje' => round($puntaje, 2),
                    'categoria' => $categoria,
                    'feedback' => $feedback // <-- Aquí está el feedback detallado
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Error al guardar respuestas', 'error' => $e->getMessage()], 500);
        }
    }





    /**
     * Listar todas las pruebas maestras (solo admin y docente)
     */
    public function getAllPruebas(Request $request)
    {
        $user = $request->user();

        // ✅ ahora también los estudiantes pueden ver pruebas
        if (!in_array($user->rol, ['docente', 'admin', 'estudiante'])) {
            return response()->json([
                'success' => false,
                'message' => 'Rol no autorizado'
            ], 403);
        }

        $pruebas = DB::table('pruebas')
            ->select('id', 'titulo', 'descripcion', 'created_at', 'updated_at')
            ->orderBy('titulo', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $pruebas
        ]);
    }

        // Agregar nueva pregunta
        public function storePregunta(Request $request, $id)
        {
            $pregunta = Pregunta::create([
                'prueba_id' => $id,
                'texto' => $request->texto,
                'opciones' => $request->opciones,
                'respuesta_correcta' => $request->respuesta_correcta,
            ]);

            return response()->json([
                'success' => true,
                'data' => $pregunta
            ]);
        }

    // Eliminar pregunta
    public function destroyPregunta($id)
    {
        $pregunta = Pregunta::find($id);

        if (!$pregunta) {
            return response()->json([
                'success' => false,
                'message' => 'Pregunta no encontrada'
            ], 404);
        }

        $pregunta->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pregunta eliminada correctamente'
        ]);
    }

    // Editar pregunta
    public function updatePregunta(Request $request, $id)
    {
        $pregunta = Pregunta::find($id);

        if (!$pregunta) {
            return response()->json([
                'success' => false,
                'message' => 'Pregunta no encontrada'
            ], 404);
        }

        $pregunta->update($request->only(['texto', 'opciones', 'respuesta_correcta']));

        return response()->json([
            'success' => true,
            'data' => $pregunta
        ]);
    }

    

    
}
