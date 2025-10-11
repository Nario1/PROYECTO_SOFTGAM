<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DatoUso;
use App\Models\User;

class DatosUsoController extends Controller
{
    /**
     * Registrar sesión de uso de un estudiante
     */
    public function logSession(Request $request)
    {
        $data = $request->validate([
            'user_id' => 'required|exists:users,id',
            'tiempo_sesion' => 'required|integer|min:0',
            'actividades_completadas' => 'required|integer|min:0'
        ]);

        $user = User::find($data['user_id']);
        if ($user->rol !== 'estudiante') {
            return response()->json([
                'success' => false,
                'message' => 'El usuario no es un estudiante'
            ], 400);
        }

        $log = DatoUso::create([
            'user_id' => $data['user_id'],
            'fecha_ingreso' => now(),
            'tiempo_sesion' => $data['tiempo_sesion'],
            'actividades_completadas' => $data['actividades_completadas']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sesión registrada exitosamente',
            'data' => ['log_id' => $log->id]
        ], 201);
    }

    /**
     * Obtener historial de uso de un estudiante
     */
    public function getUsage($user_id)
    {
        $user = User::find($user_id);
        if (!$user || $user->rol !== 'estudiante') {
            return response()->json([
                'success' => false,
                'message' => 'Estudiante no encontrado'
            ], 404);
        }

        $uso = DatoUso::where('user_id', $user_id)
            ->orderBy('fecha_ingreso', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $uso
        ]);
    }

    /**
     * Estadísticas de uso por estudiante
     */
    public function getUsageStats($user_id)
    {
        $user = User::find($user_id);
        if (!$user || $user->rol !== 'estudiante') {
            return response()->json([
                'success' => false,
                'message' => 'Estudiante no encontrado'
            ], 404);
        }

        $totalSesiones = DatoUso::where('user_id', $user_id)->count();
        $totalTiempo = DatoUso::where('user_id', $user_id)->sum('tiempo_sesion');
        $totalActividades = DatoUso::where('user_id', $user_id)->sum('actividades_completadas');

        return response()->json([
            'success' => true,
            'data' => [
                'total_sesiones' => $totalSesiones,
                'total_tiempo' => $totalTiempo,
                'total_actividades' => $totalActividades,
                'promedio_tiempo_por_sesion' => $totalSesiones ? round($totalTiempo / $totalSesiones, 2) : 0,
                'promedio_actividades_por_sesion' => $totalSesiones ? round($totalActividades / $totalSesiones, 2) : 0
            ]
        ]);
    }

    /**
     * Estadísticas diarias del sistema
     */
    public function getDailyStats()
    {
        $stats = DatoUso::selectRaw('DATE(fecha_ingreso) as fecha')
            ->selectRaw('COUNT(*) as total_sesiones')
            ->selectRaw('SUM(tiempo_sesion) as total_tiempo')
            ->selectRaw('SUM(actividades_completadas) as total_actividades')
            ->groupBy('fecha')
            ->orderByDesc('fecha')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Métricas de engagement/participación
     */
    public function getEngagementMetrics()
    {
        $totalEstudiantes = User::where('rol', 'estudiante')->count();
        $estudiantesActivos = DatoUso::distinct('user_id')->count('user_id');

        return response()->json([
            'success' => true,
            'data' => [
                'total_estudiantes' => $totalEstudiantes,
                'estudiantes_activos' => $estudiantesActivos,
                'porcentaje_activos' => $totalEstudiantes ? round(($estudiantesActivos / $totalEstudiantes) * 100, 2) : 0
            ]
        ]);
    }

    /**
     * Exportar datos de uso en JSON seguro
     */
    public function exportUsageData()
    {
        $datos = DatoUso::with('user:id,nombre,apellido')->get()->map(function($item){
            return [
                'user_id' => $item->user_id,
                'estudiante_nombre' => $item->user ? $item->user->nombre.' '.$item->user->apellido : 'Usuario eliminado',
                'fecha_ingreso' => $item->fecha_ingreso,
                'tiempo_sesion' => $item->tiempo_sesion,
                'actividades_completadas' => $item->actividades_completadas
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $datos
        ]);
    }

    /**
     * Exportar datos de uso en CSV seguro
     */
    public function exportUsageCSV()
    {
        $datos = DatoUso::with('user:id,nombre,apellido')->get();

        $filename = 'datos_uso_'.date('Y_m_d_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];

        $callback = function() use ($datos) {
            $file = fopen('php://output', 'w');
            // Columnas
            fputcsv($file, ['User ID', 'Nombre Estudiante', 'Fecha Ingreso', 'Tiempo Sesión', 'Actividades Completadas']);

            foreach ($datos as $item) {
                fputcsv($file, [
                    $item->user_id,
                    $item->user ? $item->user->nombre.' '.$item->user->apellido : 'Usuario eliminado',
                    $item->fecha_ingreso,
                    $item->tiempo_sesion,
                    $item->actividades_completadas
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
