<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Recurso;
use Illuminate\Support\Facades\Storage;
use Cloudinary\Cloudinary;

class RecursoController extends Controller
{
    private $cloudinary;

    public function __construct()
    {
        // Configuración manual directa de Cloudinary
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
        \Log::info('Iniciando store method');

        $request->validate([
            'docente_id' => 'required|exists:users,id',
            'tematica_id' => 'required|exists:tematicas,id',
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'tipo' => 'required|string|in:documento,video,imagen,enlace,otros',
            'archivo' => 'nullable|file|max:51200',
            'url_recurso' => 'nullable|url',
        ]);

        \Log::info('Validación pasada');

        $archivoUrl = null;
        $archivoPublicId = null;
        $tipoArchivo = $request->tipo;
        $nombreArchivoOriginal = null; // ✅ AGREGADO
        $extensionOriginal = null;     // ✅ AGREGADO

        if ($request->hasFile('archivo') && $request->tipo !== 'enlace') {
            $file = $request->file('archivo');
            $nombreArchivoOriginal = $file->getClientOriginalName(); // ✅ GUARDAR NOMBRE ORIGINAL
            $extensionOriginal = $file->getClientOriginalExtension(); // ✅ GUARDAR EXTENSIÓN ORIGINAL
            
            \Log::info('Archivo recibido: ' . $nombreArchivoOriginal);
            
            // Validar tipos de archivo
            $extension = strtolower($file->getClientOriginalExtension());
            
            $tiposPermitidos = [
                'documento' => ['pdf', 'doc', 'docx', 'txt', 'ppt', 'pptx', 'xlsx', 'csv', 'odt', 'rtf'],
                'imagen' => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'],
                'video' => ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm'],
                'otros' => ['zip', 'rar', '7z', 'tar', 'gz']
            ];

            if (!in_array($extension, $tiposPermitidos[$request->tipo])) {
                \Log::error('Tipo de archivo no permitido');
                return response()->json([
                    'success' => false,
                    'message' => 'Tipo de archivo no permitido. Extensiones permitidas: ' . implode(', ', $tiposPermitidos[$request->tipo])
                ], 422);
            }

            try {
                \Log::info('Intentando subir a Cloudinary');
                
                // Determinar resource_type según el tipo de archivo
                $resourceType = 'auto';
                if ($request->tipo === 'documento') {
                    $resourceType = 'raw';
                } elseif ($request->tipo === 'video') {
                    $resourceType = 'video';
                }

                // Subir a Cloudinary
                $uploadResult = $this->cloudinary->uploadApi()->upload(
                    $file->getRealPath(),
                    [
                        'folder' => 'softgam/recursos',
                        'resource_type' => $resourceType
                    ]
                );

                \Log::info('Archivo subido a Cloudinary: ' . $uploadResult['secure_url']);

                $archivoUrl = $uploadResult['secure_url'];
                $archivoPublicId = $uploadResult['public_id'];

            } catch (\Exception $e) {
                \Log::error('Error en Cloudinary: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Error al subir el archivo: ' . $e->getMessage()
                ], 500);
            }
        }

        \Log::info('Creando recurso en base de datos');
        
        $recurso = Recurso::create([
            'docente_id' => $request->docente_id,
            'tematica_id' => $request->tematica_id,
            'titulo' => $request->titulo,
            'descripcion' => $request->descripcion,
            'tipo' => $tipoArchivo,
            'url_recurso' => $request->url_recurso,
            'archivo_path' => $archivoUrl,
            'archivo_public_id' => $archivoPublicId,
            'nombre_archivo_original' => $nombreArchivoOriginal, // ✅ GUARDAR EN BD
            'extension_original' => $extensionOriginal,         // ✅ GUARDAR EN BD
            'fecha_publicacion' => now(),
            'visible_estudiantes' => true,
        ]);

        \Log::info('Recurso creado exitosamente: ' . $recurso->id);

        return response()->json([
            'success' => true,
            'message' => 'Recurso guardado correctamente en la nube',
            'data' => $recurso,
        ], 201);
    }

    // Descargar archivo - OPTIMIZADO PARA TODOS LOS TIPOS
    public function descargar($id)
    {
        $recurso = Recurso::findOrFail($id);

        if (!$recurso->archivo_path) {
            return response()->json([
                'success' => false,
                'message' => 'El recurso no tiene archivo asociado'
            ], 404);
        }

        // Optimizar URL según el tipo de archivo
        $downloadUrl = $recurso->archivo_path;
        
        // Para documentos, forzar descarga en lugar de vista previa
        if ($recurso->tipo === 'documento') {
            // Cloudinary: agregar fl_attachment para forzar descarga
            if (strpos($downloadUrl, 'image/upload') !== false) {
                $downloadUrl = str_replace('image/upload', 'image/upload/fl_attachment', $downloadUrl);
            } elseif (strpos($downloadUrl, 'raw/upload') !== false) {
                $downloadUrl = str_replace('raw/upload', 'raw/upload/fl_attachment', $downloadUrl);
            }
        }

        return response()->json([
            'success' => true,
            'download_url' => $downloadUrl,
            'file_name' => $this->generarNombreDescarga($recurso),
            'file_type' => $recurso->tipo,
            'action' => $this->determinarAccion($recurso->tipo)
        ]);
    }

    // Generar nombre de archivo para descarga
    private function generarNombreDescarga($recurso)
    {
        // ✅ PRIMERO usar el nombre original si está disponible
        if ($recurso->nombre_archivo_original) {
            return $recurso->nombre_archivo_original;
        }

        // Si no, generar nombre basado en título
        $nombreBase = preg_replace('/[^a-zA-Z0-9-_]/', '_', $recurso->titulo);
        $extension = $this->determinarExtension($recurso);
        
        return $nombreBase . '.' . $extension;
    }

    // Determinar extensión del archivo
    private function determinarExtension($recurso)
    {
        // ✅ PRIMERO usar extensión original si está guardada
        if ($recurso->extension_original) {
            return $recurso->extension_original;
        }

        // Intentar obtener de la URL
        $urlExtension = pathinfo($recurso->archivo_path, PATHINFO_EXTENSION);
        if ($urlExtension && $urlExtension !== 'cloudinary') {
            return $urlExtension;
        }

        // Si no se puede determinar, usar mapeo por tipo
        $extensiones = [
            'documento' => 'pdf',
            'imagen' => 'jpg',
            'video' => 'mp4',
            'otros' => 'zip'
        ];

        return $extensiones[$recurso->tipo] ?? 'bin';
    }

    // Determinar la acción recomendada (descargar/ver)
    private function determinarAccion($tipo)
    {
        $acciones = [
            'documento' => 'descargar',
            'imagen' => 'ver',
            'video' => 'ver', 
            'otros' => 'descargar'
        ];
        
        return $acciones[$tipo] ?? 'descargar';
    }

    // Eliminar recurso
    public function destroy($id)
    {
        $recurso = Recurso::findOrFail($id);

        if ($recurso->archivo_public_id) {
            try {
                // Determinar resource_type para eliminación
                $resourceType = 'image';
                if ($recurso->tipo === 'documento') {
                    $resourceType = 'raw';
                } elseif ($recurso->tipo === 'video') {
                    $resourceType = 'video';
                }
                
                $this->cloudinary->uploadApi()->destroy($recurso->archivo_public_id, [
                    'resource_type' => $resourceType
                ]);
            } catch (\Exception $e) {
                \Log::error('Error al eliminar archivo de Cloudinary: ' . $e->getMessage());
            }
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
        $recursos = Recurso::select('id', 'titulo', 'descripcion', 'fecha_publicacion', 'tipo', 'url_recurso', 'archivo_path', 'docente_id', 'tematica_id', 'nombre_archivo_original')
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