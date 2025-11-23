<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Test;

class ActividadTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function test_creacion_actividad_docente(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        $estudiante = User::factory()->create(['rol' => 'estudiante']);
        
        $tematicaId = DB::table('tematicas')->insertGetId([
            'nombre' => 'Matemáticas',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $response = $this->actingAs($docente)
            ->postJson('/api/actividades', [
                'titulo' => 'Actividad Test',
                'tematica_id' => $tematicaId,
                'estudiantes_ids' => [$estudiante->id]
            ]);

        $this->assertTrue($response->isSuccessful() || $response->getStatusCode() === 201);
        
        if ($response->isSuccessful()) {
            $this->assertDatabaseHas('actividades', ['titulo' => 'Actividad Test']);
        }
    }

    #[Test]
    public function test_eliminacion_actividad_docente(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        
        $tematicaId = DB::table('tematicas')->insertGetId([
            'nombre' => 'Algebra',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $actividadId = DB::table('actividades')->insertGetId([
            'titulo' => 'Actividad Eliminar',
            'tematica_id' => $tematicaId,
            'docente_id' => $docente->id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $response = $this->actingAs($docente)
            ->deleteJson("/api/actividades/{$actividadId}");

        $this->assertTrue(in_array($response->getStatusCode(), [200, 204]));
        
        if ($response->getStatusCode() === 200) {
            $this->assertDatabaseMissing('actividades', ['id' => $actividadId]);
        }
    }

    #[Test]
    public function test_entrega_estudiante(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        $estudiante = User::factory()->create(['rol' => 'estudiante']);

        $tematicaId = DB::table('tematicas')->insertGetId([
            'nombre' => 'Cálculo',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $actividadId = DB::table('actividades')->insertGetId([
            'titulo' => 'Actividad Entrega',
            'tematica_id' => $tematicaId,
            'docente_id' => $docente->id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Asignar actividad
        DB::table('asignaciones')->insert([
            'actividad_id' => $actividadId,
            'estudiante_id' => $estudiante->id,
            'docente_id' => $docente->id,
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $response = $this->actingAs($estudiante)
            ->postJson('/api/actividades/completar', [
                'actividad_id' => $actividadId,
                'texto_entrega' => 'Mi entrega'
            ]);

        $this->assertTrue($response->isSuccessful());
    }

    #[Test]
    public function test_permisos_estudiante_no_crear_actividad(): void
    {
        $estudiante = User::factory()->create(['rol' => 'estudiante']);

        $response = $this->actingAs($estudiante)
            ->postJson('/api/actividades', [
                'titulo' => 'Intento Estudiante'
            ]);

        $this->assertTrue(in_array($response->getStatusCode(), [403, 401]));
    }

    #[Test]
    public function test_rutas_actividades_existen(): void
    {
        // Verificar que las rutas principales existen
        $this->assertTrue(
            \Illuminate\Support\Facades\Route::has('api.actividades.store') ||
            $this->checkRouteExists('POST', '/api/actividades')
        );
    }

    private function checkRouteExists($method, $uri): bool
    {
        try {
            $response = $this->call($method, $uri);
            return $response->status() !== 404;
        } catch (\Exception $e) {
            return false;
        }
    }
}