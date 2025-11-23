<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Prueba;
use App\Models\Pregunta;
use App\Models\PruebaDiagnostica;
use PHPUnit\Framework\Attributes\Test;

class PruebaDiagnosticaControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function docente_puede_crear_prueba_diagnostica(): void
    {
        $docente = User::factory()->create([
            'dni' => '11111111',
            'rol' => 'docente',
        ]);

        $response = $this->actingAs($docente)
            ->postJson('/api/pruebas-diagnosticas/pruebas', [
                'titulo' => 'Prueba de Matemáticas Básicas',
                'descripcion' => 'Evaluación de conceptos fundamentales'
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true
            ]);

        $this->assertDatabaseHas('pruebas', [
            'titulo' => 'Prueba de Matemáticas Básicas'
        ]);
    }

    #[Test]
    public function docente_puede_agregar_pregunta_a_prueba(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        
        $prueba = Prueba::create([
            'titulo' => 'Prueba Test',
            'descripcion' => 'Descripción test'
        ]);

        $response = $this->actingAs($docente)
            ->postJson("/api/pruebas-diagnosticas/{$prueba->id}/preguntas", [
                'texto' => '¿Cuánto es 2 + 2?',
                'opciones' => json_encode(['3', '4', '5', '6']),
                'respuesta_correcta' => '4'
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ]);

        $this->assertDatabaseHas('preguntas', [
                'prueba_id' => $prueba->id,
                'texto' => '¿Cuánto es 2 + 2?'
            ]);
    }

    #[Test]
    public function estudiante_puede_rendir_prueba_diagnostica(): void
    {
        $estudiante = User::factory()->create([
            'dni' => '22222222',
            'rol' => 'estudiante',
        ]);

        $prueba = Prueba::create([
            'titulo' => 'Prueba de Conocimientos',
            'descripcion' => 'Evaluación inicial'
        ]);

        $pregunta1 = Pregunta::create([
            'prueba_id' => $prueba->id,
            'texto' => '¿Capital de Perú?',
            'opciones' => json_encode(['Lima', 'Bogotá', 'Santiago', 'Quito']),
            'respuesta_correcta' => 'Lima'
        ]);

        $pregunta2 = Pregunta::create([
            'prueba_id' => $prueba->id,
            'texto' => '¿2 + 3?',
            'opciones' => json_encode(['4', '5', '6', '7']),
            'respuesta_correcta' => '5'
        ]);

        $response = $this->actingAs($estudiante)
            ->postJson("/api/pruebas-diagnosticas/guardar-respuestas/{$prueba->id}", [
                'respuestas' => [
                    ['pregunta_id' => $pregunta1->id, 'respuesta' => 'Lima'],
                    ['pregunta_id' => $pregunta2->id, 'respuesta' => '5']
                ]
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Prueba rendida exitosamente'
            ])
            ->assertJsonStructure([
                'data' => [
                    'prueba_diagnostica_id',
                    'correctas',
                    'total',
                    'puntaje',
                    'categoria',
                    'feedback'
                ]
            ]);

        $data = $response->json('data');
        $this->assertEquals(2, $data['correctas']);
        $this->assertEquals(2, $data['total']);
        $this->assertEquals(100, $data['puntaje']);
        $this->assertEquals('Alta', $data['categoria']);
    }

    #[Test]
    public function docente_puede_eliminar_prueba_diagnostica(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        
        $prueba = Prueba::create([
            'titulo' => 'Prueba a Eliminar',
            'descripcion' => 'Esta será eliminada'
        ]);

        $response = $this->actingAs($docente)
            ->deleteJson("/api/pruebas-diagnosticas/{$prueba->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Prueba eliminada correctamente'
            ]);

        $this->assertDatabaseMissing('pruebas', ['id' => $prueba->id]);
    }

    #[Test]
    public function estudiante_puede_ver_sus_propias_pruebas(): void
    {
        $estudiante = User::factory()->create(['rol' => 'estudiante']);
        $prueba = Prueba::create(['titulo' => 'Prueba Test']);

        PruebaDiagnostica::create([
            'user_id' => $estudiante->id,
            'prueba_id' => $prueba->id,
            'categoria' => 'Alta',
            'puntaje' => 85,
            'fecha' => now()->format('Y-m-d')
        ]);

        $response = $this->actingAs($estudiante)
            ->getJson("/api/pruebas-diagnosticas/estudiante/{$estudiante->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
    }

    #[Test]
    public function estudiante_no_puede_ver_pruebas_de_otros_estudiantes(): void
    {
        $estudiante1 = User::factory()->create(['rol' => 'estudiante']);
        $estudiante2 = User::factory()->create(['rol' => 'estudiante']);
        
        $prueba = Prueba::create(['titulo' => 'Prueba Test']);

        PruebaDiagnostica::create([
            'user_id' => $estudiante2->id,
            'prueba_id' => $prueba->id,
            'categoria' => 'Alta',
            'puntaje' => 90,
            'fecha' => now()->format('Y-m-d')
        ]);

        $response = $this->actingAs($estudiante1)
            ->getJson("/api/pruebas-diagnosticas/estudiante/{$estudiante2->id}");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'No puedes ver pruebas de otro estudiante'
            ]);
    }

    #[Test]
    public function se_pueden_obtener_estadisticas_de_pruebas(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        
        PruebaDiagnostica::create([
            'user_id' => User::factory()->create()->id,
            'prueba_id' => Prueba::create(['titulo' => 'Prueba 1'])->id,
            'categoria' => 'Alta',
            'puntaje' => 85,
            'fecha' => now()->format('Y-m-d')
        ]);

        PruebaDiagnostica::create([
            'user_id' => User::factory()->create()->id,
            'prueba_id' => Prueba::create(['titulo' => 'Prueba 2'])->id,
            'categoria' => 'Media',
            'puntaje' => 65,
            'fecha' => now()->format('Y-m-d')
        ]);

        $response = $this->actingAs($docente)
            ->getJson('/api/pruebas-diagnosticas/estadisticas');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ])
            ->assertJsonStructure([
                'data' => [
                    'total_pruebas',
                    'por_categoria',
                    'promedio_puntaje'
                ]
            ]);

        $data = $response->json('data');
        $this->assertEquals(2, $data['total_pruebas']);
        $this->assertEquals(75, $data['promedio_puntaje']);
    }
}