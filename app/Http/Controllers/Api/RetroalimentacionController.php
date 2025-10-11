<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RetroalimentacionController extends Controller
{
    /**
     * Guardar retroalimentación de una entrega
     */
    public function store(Request $request, $actividadId)
    {
        $user = $request->user();

        if ($user->rol !== 'docente') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los docentes pueden retroalimentar'
            ], 403);
        }

        $request->validate([
            'estudiante_id'     => 'required|exists:users,id',
            'retroalimentacion' => 'required|string',
            'calificacion'     => 'nullable|numeric|min:0|max:20',
        ]);

        $entrega = DB::table('asignaciones')
            ->where('actividad_id', $actividadId)
            ->where('estudiante_id', $request->estudiante_id)
            ->first();

        if (!$entrega) {
            return response()->json([
                'success' => false,
                'message' => 'Entrega no encontrada'
            ], 404);
        }

        DB::table('asignaciones')
            ->where('id', $entrega->id)
            ->update([
                'retroalimentacion'   => $request->retroalimentacion,
                'calificacion'       => $request->calificacion,
                'retroalimentado_at' => now(),
            ]);

        $entregaActualizada = DB::table('asignaciones')->where('id', $entrega->id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Retroalimentación guardada correctamente',
            'data'    => $entregaActualizada
        ]);
    }

    /**
     * Actualizar retroalimentación existente
     */
    public function update(Request $request, $actividadId, $estudianteId)
    {
        $user = $request->user();

        if ($user->rol !== 'docente') {
            return response()->json([
                'success' => false,
                'message' => 'Solo los docentes pueden retroalimentar'
            ], 403);
        }

        $entrega = DB::table('asignaciones')
            ->where('actividad_id', $actividadId)
            ->where('estudiante_id', $estudianteId)
            ->first();

        if (!$entrega) {
            return response()->json([
                'success' => false,
                'message' => 'Entrega no encontrada'
            ], 404);
        }

        $request->validate([
            'retroalimentacion' => 'required|string',
            'calificacion'     => 'nullable|numeric|min:0|max:20',
        ]);

        DB::table('asignaciones')
            ->where('id', $entrega->id)
            ->update([
                'retroalimentacion'   => $request->retroalimentacion,
                'calificacion'       => $request->calificacion,
                'retroalimentado_at' => now(),
            ]);

        $entregaActualizada = DB::table('asignaciones')->where('id', $entrega->id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Retroalimentación actualizada correctamente',
            'data'    => $entregaActualizada
        ]);
    }

    /**
     * Eliminar retroalimentación
     */
    public function destroy($actividadId, $estudianteId)
    {
        $entrega = DB::table('asignaciones')
            ->where('actividad_id', $actividadId)
            ->where('estudiante_id', $estudianteId)
            ->first();

        if (!$entrega) {
            return response()->json([
                'success' => false,
                'message' => 'Entrega no encontrada'
            ], 404);
        }

        DB::table('asignaciones')
            ->where('id', $entrega->id)
            ->update([
                'retroalimentacion'   => null,
                'calificacion'       => null,
                'retroalimentado_at' => null,
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Retroalimentación eliminada correctamente'
        ]);
    }

    /**
     * Obtener retroalimentación de un estudiante específico para una actividad
     */
    public function getByEstudiante($actividadId, $estudianteId)
    {
        $entrega = DB::table('asignaciones')
            ->where('actividad_id', $actividadId)
            ->where('estudiante_id', $estudianteId)
            ->first();

        if (!$entrega) {
            return response()->json([
                'success' => false,
                'message' => 'Entrega no encontrada'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $entrega
        ]);
    }

    /**
     * Obtener todas las asignaciones de un docente
     */
    public function getDocenteActividades($docenteId)
    {
        $asignaciones = DB::table('asignaciones as a')
            ->join('actividades as act', 'a.actividad_id', '=', 'act.id')
            ->join('users as e', 'a.estudiante_id', '=', 'e.id')
            ->where('a.docente_id', $docenteId)
            ->select(
                'a.*',
                'act.titulo as actividad_titulo',
                DB::raw('CONCAT(e.nombre, " ", e.apellido) as estudiante_nombre')
            )
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $asignaciones
        ]);
    }

    /**
     * Obtener todas las asignaciones de un estudiante con retroalimentación
     */
    public function getEstudianteRetro($estudianteId)
    {
        $asignaciones = DB::table('asignaciones as a')
            ->join('actividades as act', 'a.actividad_id', '=', 'act.id')
            ->join('users as d', 'a.docente_id', '=', 'd.id')
            ->where('a.estudiante_id', $estudianteId)
            ->select(
                'a.*',
                'act.titulo as actividad_titulo',
                DB::raw('CONCAT(d.nombre, " ", d.apellido) as docente_nombre')
            )
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $asignaciones
        ]);
    }
}
