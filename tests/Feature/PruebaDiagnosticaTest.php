<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Prueba;

class PruebaDiagnosticaTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function docente_puede_crear_una_prueba(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);

        // Ahora enviamos los campos que requiere la validación
        $response = $this->actingAs($docente, 'sanctum')->postJson('/api/pruebas-diagnosticas', [
            'titulo' => 'Prueba de ejemplo',
            'descripcion' => 'Descripción de prueba',
            'user_id' => $docente->id,
            'categoria' => 'Matemática',
            'respuestas' => [
                ['pregunta_id' => 1, 'respuesta' => 'A']
            ]
        ]);

        $response->assertStatus(201)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('pruebas', ['titulo' => 'Prueba de ejemplo']);
    }

    /** @test */
    public function estudiante_no_puede_crear_una_prueba(): void
    {
        $estudiante = User::factory()->create(['rol' => 'estudiante']);

        $response = $this->actingAs($estudiante, 'sanctum')->postJson('/api/pruebas-diagnosticas', [
            'titulo' => 'Intento no permitido',
            'descripcion' => 'No debería poder crear',
            'user_id' => $estudiante->id,
            'categoria' => 'Matemática',
            'respuestas' => []
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function puede_listar_todas_las_pruebas(): void
    {
        $user = User::factory()->create(['rol' => 'docente']);
        Prueba::factory()->count(3)->create();

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/pruebas-diagnosticas/pruebas');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }

    /** @test */
    public function estudiante_puede_enviar_respuestas_y_obtener_feedback(): void
    {
        $estudiante = User::factory()->create(['rol' => 'estudiante']);
        $prueba = Prueba::factory()->create();

        // Suponemos que la prueba ya tiene una pregunta con id=1
        $respuestasPayload = [
            'respuestas' => [
                [
                    'pregunta_id' => 1,
                    'respuesta' => 'A'
                ]
            ]
        ];

        $response = $this->actingAs($estudiante, 'sanctum')->postJson("/api/pruebas-diagnosticas/guardar-respuestas/{$prueba->id}", $respuestasPayload);

        $response->assertStatus(200);
        $response->assertJsonStructure(['puntaje', 'feedback']);
    }

    /** @test */
    public function admin_puede_eliminar_prueba_completamente(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $prueba = Prueba::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/pruebas-diagnosticas/{$prueba->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('pruebas', ['id' => $prueba->id]);
    }

    /** @test */
    public function estudiante_no_puede_eliminar_prueba(): void
    {
        $estudiante = User::factory()->create(['rol' => 'estudiante']);
        $prueba = Prueba::factory()->create();

        $response = $this->actingAs($estudiante, 'sanctum')->deleteJson("/api/pruebas-diagnosticas/{$prueba->id}");

        $response->assertStatus(403);
    }
}
