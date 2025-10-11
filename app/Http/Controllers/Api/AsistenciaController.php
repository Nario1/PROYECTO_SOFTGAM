<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Asistencia;
use Illuminate\Support\Facades\Validator;

class AsistenciaController extends Controller
{
    // 🔹 Listar todas las asistencias
    public function index()
    {
        $asistencias = Asistencia::with(['estudiante:id,nombre', 'docente:id,nombre'])
            ->orderBy('fecha', 'desc')
            ->get();

        return response()->json(['data' => $asistencias]);
    }

    // 🔹 Registrar o actualizar (evita duplicados en la misma fecha)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'estudiante_id' => 'required|exists:users,id',
            'docente_id' => 'required|exists:users,id',
            'fecha' => 'required|date',
            'estado' => 'required|in:presente,ausente,tarde',
            'incidencias' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // ✅ Verificar si ya existe una asistencia para el mismo estudiante y fecha
        $asistenciaExistente = Asistencia::where('estudiante_id', $request->estudiante_id)
            ->where('fecha', $request->fecha)
            ->first();

        if ($asistenciaExistente) {
            // 🔁 Si ya existe, actualizamos
            $asistenciaExistente->update([
                'estado' => $request->estado,
                'incidencias' => $request->incidencias,
            ]);

            return response()->json([
                'message' => 'Asistencia actualizada correctamente',
                'data' => $asistenciaExistente,
            ]);
        }

        // 🆕 Si no existe, creamos una nueva
        $asistencia = Asistencia::create($request->all());

        return response()->json([
            'message' => 'Asistencia registrada correctamente',
            'data' => $asistencia,
        ]);
    }

    // 🔹 Actualizar asistencia existente manualmente
    public function update(Request $request, $id)
    {
        $asistencia = Asistencia::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'estado' => 'sometimes|in:presente,ausente,tarde',
            'incidencias' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $asistencia->update($request->only('estado', 'incidencias'));

        return response()->json([
            'message' => 'Asistencia actualizada correctamente',
            'data' => $asistencia,
        ]);
    }

    // 🔹 Obtener asistencias de un estudiante
    // 🔹 Obtener asistencias de un estudiante con nombre y apellido del docente
    public function show($estudiante_id)
    {
        $asistencias = Asistencia::where('estudiante_id', $estudiante_id)
            ->with(['docente' => function ($q) {
                $q->select('id', 'nombre', 'apellido');
            }])
            ->orderBy('fecha', 'desc')
            ->get()
            ->map(function ($asistencia) {
                return [
                    'id' => $asistencia->id,
                    'fecha' => $asistencia->fecha,
                    'estado' => ucfirst($asistencia->estado),
                    'docente_nombre' => $asistencia->docente
                        ? $asistencia->docente->nombre . ' ' . $asistencia->docente->apellido
                        : null,
                ];
            });

        return response()->json(['data' => $asistencias]);
    }



    // 🔹 Nuevo método: obtener asistencias por fecha (para el frontend)
    public function getByFecha($fecha)
    {
        $asistencias = Asistencia::whereDate('fecha', $fecha)
            ->with(['estudiante:id,nombre', 'docente:id,nombre'])
            ->orderBy('estudiante_id')
            ->get();

        return response()->json($asistencias); // 👈 sin ['data' => ...]
    }

}
