<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Recurso;
use Illuminate\Support\Facades\Storage;

class RecursoController extends Controller
{
    // Listar todos los recursos del docente
    public function getByDocente($docente_id)
    {
        $recursos = Recurso::where('docente_id', $docente_id)
            ->with(['tematica:id,nombre'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $recursos]);
    }
    // Listar todos los recursos (para GET /api/recursos)
    public function index(Request $request)
    {
        $query = Recurso::with(['tematica:id,nombre', 'docente:id,name'])
            ->orderBy('created_at', 'desc');

        // Filtrar por visibilidad para estudiantes si se indica
        if ($request->has('visible_estudiantes')) {
            $query->where('visible_estudiantes', $request->visible_estudiantes);
        }

        // Filtrar por temática si se pasa tematica_id
        if ($request->has('tematica_id') && $request->tematica_id) {
            $query->where('tematica_id', $request->tematica_id);
        }

        $recursos = $query->get();

        return response()->json([
            'success' => true,
            'data' => $recursos
        ]);
    }


    // Guardar nuevo recurso
    public function store(Request $request)
    {
        $request->validate([
            'docente_id' => 'required|exists:users,id',
            'tematica_id' => 'required|exists:tematicas,id',
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'required|string|in:documento,video,imagen,enlace,otros', // ✅ corregido
            'archivo' => 'nullable|file|max:51200', // 50MB
            'url_recurso' => 'nullable|url',
        ]);

        $archivoPath = null;

        // Solo si hay archivo y el tipo no es 'enlace'
        if ($request->hasFile('archivo') && $request->tipo !== 'enlace') {
            $file = $request->file('archivo');

            // Validar tipo según enum
            $allowedMime = [
                'imagen' => 'image',
                'documento' => 'application/pdf',
                'video' => 'video',
                'otros' => null, // acepta cualquier archivo
            ];

            if (isset($allowedMime[$request->tipo]) && $allowedMime[$request->tipo]) {
                if (strpos($file->getMimeType(), $allowedMime[$request->tipo]) === false) {
                    return response()->json([
                        'error' => 'Tipo de archivo no coincide con el tipo seleccionado'
                    ], 422);
                }
            }

            // Guardar archivo en storage/public/recursos
            $nombreArchivo = time() . '_' . $file->getClientOriginalName();
            $archivoPath = $file->storeAs('recursos', $nombreArchivo, 'public');
        }

        $recurso = Recurso::create([
            'docente_id' => $request->docente_id,
            'tematica_id' => $request->tematica_id,
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'tipo' => $request->tipo,
            'url_recurso' => $request->url_recurso,
            'archivo_path' => $archivoPath,
            'fecha_publicacion' => now(),
            'visible_estudiantes' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Recurso guardado correctamente',
            'data' => $recurso,
        ], 201);
    }

    // Descargar archivo
    public function descargar($id)
    {
        $recurso = Recurso::findOrFail($id);

        if (!$recurso->archivo_path || !Storage::disk('public')->exists($recurso->archivo_path)) {
            abort(404, 'Archivo no encontrado.');
        }

        return Storage::disk('public')->download($recurso->archivo_path, basename($recurso->archivo_path));
    }

    // Eliminar recurso
    public function destroy($id)
    {
        $recurso = Recurso::findOrFail($id);

        if ($recurso->archivo_path && Storage::disk('public')->exists($recurso->archivo_path)) {
            Storage::disk('public')->delete($recurso->archivo_path);
        }

        $recurso->delete();

        return response()->json([
            'success' => true,
            'message' => 'Recurso eliminado correctamente'
        ]);
    }
     // Listar recursos visibles para estudiantes, filtrable por temática
    public function getParaEstudiantes(Request $request)
    {
        $recursos = Recurso::select('id', 'titulo', 'descripcion', 'fecha_publicacion', 'tipo', 'url_recurso', 'archivo_path', 'docente_id', 'tematica_id')
            ->with([
                'tematica:id,nombre',
                'docente:id,nombre,apellido'
            ])
            ->where('visible_estudiantes', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $recursos]);
    }





    // Cambiar visibilidad del recurso
    public function cambiarVisibilidad($id, Request $request)
    {
        $recurso = Recurso::find($id);

        if (!$recurso) {
            return response()->json([
                'success' => false,
                'message' => 'Recurso no encontrado'
            ], 404);
        }

        // Validar el campo visible_estudiantes (1 o 0)
        $request->validate([
            'visible' => 'required|boolean',
        ]);

        $recurso->visible_estudiantes = $request->visible;
        $recurso->save();

        return response()->json([
            'success' => true,
            'message' => 'Visibilidad actualizada correctamente',
            'data' => $recurso
        ]);
    }


}
