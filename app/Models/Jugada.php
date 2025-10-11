<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Juego;
use App\Models\Jugada;
use Illuminate\Support\Facades\DB;

class JuegoController extends Controller
{
    /**
     * Panel principal de juegos (según el rol del usuario)
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Usuario no autenticado'
                ], 401);
            }

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

    private function getJuegosParaEstudiante($user)
    {
        $juegos = Juego::with('tematica')
            ->select('id', 'nombre', 'descripcion', 'imagen', 'tematica_id')
            ->get()
            ->map(function ($juego) use ($user) {
                $ultimaJugada = Jugada::where('user_id', $user->id)
                    ->where('juego_id', $juego->id)
                    ->latest('updated_at')
                    ->first();

                return [
                    'id' => $juego->id,
                    'nombre' => $juego->nombre,
                    'descripcion' => $juego->descripcion,
                    'imagen' => $juego->imagen,
                    'tematica' => $juego->tematica,
                    'ultimo_puntaje' => $ultimaJugada->puntos_obtenidos ?? 0,
                    'finalizado' => $ultimaJugada->finalizado ?? 0,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'usuario' => $user,
                'juegos' => $juegos
            ]
        ]);
    }

    private function getJuegosParaDocente($user)
    {
        $estadisticas = DB::table('jugadas')
            ->join('juegos', 'jugadas.juego_id', '=', 'juegos.id')
            ->select(
                'juegos.id',
                'juegos.nombre',
                DB::raw('COUNT(jugadas.id) as total_jugadas'),
                DB::raw('AVG(jugadas.puntos_obtenidos) as promedio_puntaje'),
                DB::raw('SUM(jugadas.finalizado = 1) as completados')
            )
            ->groupBy('juegos.id', 'juegos.nombre')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'usuario' => $user,
                'estadisticas' => $estadisticas
            ]
        ]);
    }

    private function getPanelAdministrativo($user)
    {
        $juegos = Juego::with('tematica')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'usuario' => $user,
                'juegos' => $juegos
            ]
        ]);
    }

    public function registrarJugada(Request $request)
    {
        try {
            $request->validate([
                'juego_id' => 'required|exists:juegos,id',
                'puntos_obtenidos' => 'required|integer|min:0',
                'finalizado' => 'boolean'
            ]);

            $user = $request->user();

            $jugada = Jugada::create([
                'user_id' => $user->id,
                'juego_id' => $request->juego_id,
                'inicio_juego' => now(),
                'fin_juego' => now(),
                'puntos_obtenidos' => $request->puntos_obtenidos,
                'finalizado' => $request->finalizado ?? 0,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Jugada registrada correctamente',
                'data' => $jugada
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al registrar jugada',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
