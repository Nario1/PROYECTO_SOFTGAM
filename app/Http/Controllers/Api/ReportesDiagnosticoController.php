<?php
// app/Http/Controllers/ReportesDiagnosticoController.php
namespace App\Http\Controllers;

use App\Models\PruebaDiagnostica;
use Illuminate\Http\Request;

class ReportesDiagnosticoController extends Controller
{
    public function index()
    {
        // Traemos todas las pruebas diagnósticas con la info del estudiante y de la prueba
        $reportes = PruebaDiagnostica::with(['estudiante:id,name', 'prueba:id,titulo'])
            ->get()
            ->map(function ($pd) {
                return [
                    'id' => $pd->id,
                    'estudiante' => [
                        'id' => $pd->estudiante->id,
                        'nombre' => $pd->estudiante->name,
                    ],
                    'prueba' => [
                        'id' => $pd->prueba->id,
                        'titulo' => $pd->prueba->titulo,
                    ],
                    'correctas' => $pd->correctas ?? 0,
                    'total' => $pd->total ?? 0,
                    'puntaje' => $pd->puntaje,
                    'categoria' => $pd->categoria,
                    'fecha' => $pd->fecha,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $reportes,
        ]);
    }
}
