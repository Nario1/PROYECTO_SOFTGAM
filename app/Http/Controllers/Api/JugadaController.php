<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JugadaController extends Controller
{
    /**
     * Iniciar nueva jugada
     */
    public function start($user_id, $juego_id)
    {
        $estudiante = DB::table('users')->where('id', $user_id)->where('rol', 'estudiante')->first();
        $juego = DB::table('juegos')->where('id', $juego_id)->first();

        if (!$estudiante || !$juego) {
            return response()->json([
                'success' => false,
                'message' => 'Estudiante o juego no encontrado'
            ], 404);
        }

        $jugada_id = DB::table('jugadas')->insertGetId([
            'user_id' => $user_id,
            'juego_id' => $juego_id,
            'inicio_juego' => now(),
            'finalizado' => false,
            'puntos_obtenidos' => 0,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jugada iniciada',
            'data' => ['jugada_id' => $jugada_id]
        ], 201);
    }

     /**
     * Finalizar jugada con puntos obtenidos
     */
        public function finish(Request $request)
    {
        $jugada_id = $request->input('jugada_id');
        $puntos_obtenidos = $request->input('puntos_obtenidos');

        if (!$jugada_id || $puntos_obtenidos === null) {
            return response()->json([
                'success' => false,
                'message' => 'Faltan datos para finalizar la jugada'
            ], 400);
        }

        $jugada = DB::table('jugadas')->where('id', $jugada_id)->first();

        if (!$jugada) {
            return response()->json([
                'success' => false,
                'message' => 'Jugada no encontrada'
            ], 404);
        }

        DB::table('jugadas')->where('id', $jugada_id)->update([
            'fin_juego' => now(),
            'puntos_obtenidos' => $puntos_obtenidos,
            'finalizado' => true,
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jugada finalizada',
            'data' => [
                'jugada_id' => $jugada_id,
                'puntos_obtenidos' => $puntos_obtenidos
            ]
        ]);
    }

    /**
     * Pausar jugada en progreso
     */
    public function pause($jugada_id)
    {
        $jugada = DB::table('jugadas')->where('id', $jugada_id)->first();

        if (!$jugada || $jugada->finalizado) {
            return response()->json([
                'success' => false,
                'message' => 'Jugada no válida para pausar'
            ], 400);
        }

        DB::table('jugadas')->where('id', $jugada_id)->update([
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jugada pausada',
            'data' => ['jugada_id' => $jugada_id]
        ]);
    }

    /**
     * Reanudar jugada pausada
     */
    public function resume($jugada_id)
    {
        $jugada = DB::table('jugadas')->where('id', $jugada_id)->first();

        if (!$jugada || $jugada->finalizado) {
            return response()->json([
                'success' => false,
                'message' => 'Jugada no válida para reanudar'
            ], 400);
        }

        DB::table('jugadas')->where('id', $jugada_id)->update([
            'updated_at' => now()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Jugada reanudada',
            'data' => ['jugada_id' => $jugada_id]
        ]);
    }

    /**
     * Historial de jugadas de un estudiante
     */
    public function getByStudent($user_id)
    {
        $estudiante = DB::table('users')->where('id', $user_id)->where('rol', 'estudiante')->first();

        if (!$estudiante) {
            return response()->json([
                'success' => false,
                'message' => 'Estudiante no encontrado'
            ], 404);
        }

        $jugadas = DB::table('jugadas')
            ->where('user_id', $user_id)
            ->join('juegos', 'jugadas.juego_id', '=', 'juegos.id')
            ->select(
                'jugadas.*',
                'juegos.nombre as juego_nombre',
                'juegos.imagen as juego_imagen'
            )
            ->orderBy('inicio_juego', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $jugadas
        ]);
    }

    /**
     * Todas las jugadas de un juego específico
     */
    public function getByJuego($juego_id)
    {
        $juego = DB::table('juegos')->where('id', $juego_id)->first();

        if (!$juego) {
            return response()->json([
                'success' => false,
                'message' => 'Juego no encontrado'
            ], 404);
        }

        $jugadas = DB::table('jugadas')
            ->where('juego_id', $juego_id)
            ->join('users', 'jugadas.user_id', '=', 'users.id')
            ->select(
                'jugadas.*',
                DB::raw('CONCAT(users.nombre, " ", users.apellido) as estudiante_nombre')
            )
            ->orderBy('inicio_juego', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $jugadas
        ]);
    }

    /**
     * Juegos activos o pausados de un estudiante
     */
    public function getActiveGames($user_id)
    {
        $estudiante = DB::table('users')->where('id', $user_id)->where('rol', 'estudiante')->first();

        if (!$estudiante) {
            return response()->json([
                'success' => false,
                'message' => 'Estudiante no encontrado'
            ], 404);
        }

        $jugadas = DB::table('jugadas')
            ->where('user_id', $user_id)
            ->where('finalizado', false)
            ->join('juegos', 'jugadas.juego_id', '=', 'juegos.id')
            ->select('jugadas.*', 'juegos.nombre as juego_nombre', 'juegos.imagen as juego_imagen')
            ->orderBy('inicio_juego', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $jugadas
        ]);
    }

    /**
     * Estadísticas de un juego (tiempo promedio, completitud)
     */
    public function getGameStats($juego_id)
    {
        $juego = DB::table('juegos')->where('id', $juego_id)->first();

        if (!$juego) {
            return response()->json([
                'success' => false,
                'message' => 'Juego no encontrado'
            ], 404);
        }

        $totalJugadas = DB::table('jugadas')->where('juego_id', $juego_id)->count();
        $totalFinalizadas = DB::table('jugadas')->where('juego_id', $juego_id)->where('finalizado', true)->count();
        $tiempoPromedio = DB::table('jugadas')
            ->where('juego_id', $juego_id)
            ->whereNotNull('fin_juego')
            ->select(DB::raw('AVG(TIMESTAMPDIFF(SECOND, inicio_juego, fin_juego)) as promedio_segundos'))
            ->first()->promedio_segundos ?? 0;

        return response()->json([
            'success' => true,
            'data' => [
                'juego_id' => $juego_id,
                'juego_nombre' => $juego->nombre,
                'total_jugadas' => $totalJugadas,
                'total_finalizadas' => $totalFinalizadas,
                'porcentaje_completadas' => $totalJugadas > 0 ? round(($totalFinalizadas / $totalJugadas) * 100, 2) : 0,
                'tiempo_promedio_segundos' => round($tiempoPromedio, 2)
            ]
        ]);
    }
    /**
     * Obtener progreso del usuario en un juego específico
     */
    public function getProgreso(Request $request, $user_id, $juego_id)
    {
        // Validar usuario
        $estudiante = DB::table('users')->where('id', $user_id)->where('rol', 'estudiante')->first();
        if (!$estudiante) {
            return response()->json([
                'success' => false,
                'message' => 'Estudiante no encontrado'
            ], 404);
        }

        // 1️⃣ Puntos totales del usuario en ese juego
        $puntosTotales = DB::table('jugadas')
            ->where('user_id', $user_id)
            ->where('juego_id', $juego_id)
            ->sum('puntos_obtenidos');

        // 2️⃣ Nivel actual
        $nivel = DB::table('niveles')
            ->where('requisito_puntos', '<=', $puntosTotales)
            ->orderByDesc('requisito_puntos')
            ->first();

        // 3️⃣ Insignia actual (si tienes tabla insignias relacionada con juego)
        $insignia = DB::table('insignias')
            ->where('juego_id', $juego_id)
            ->where('puntos_minimos', '<=', $puntosTotales)
            ->orderByDesc('puntos_minimos')
            ->first();

        return response()->json([
            'success' => true,
            'data' => [
                'puntos_totales' => $puntosTotales,
                'nivel' => $nivel ? $nivel->nombre : null,
                'insignia' => $insignia ? [
                    'nombre' => $insignia->nombre,
                    'descripcion' => $insignia->descripcion,
                    'imagen' => $insignia->imagen ?? null
                ] : null
            ]
        ]);
    }

}
