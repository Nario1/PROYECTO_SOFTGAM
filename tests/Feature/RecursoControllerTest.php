<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Recurso;
use App\Models\Tematica;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;

class RecursoControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function docente_puede_crear_recurso_con_archivo(): void
    {
        Storage::fake('public');

        $docente = User::factory()->create([
            'dni' => '11111111',
            'rol' => 'docente',
        ]);

        $tematica = Tematica::create([
            'nombre' => 'Matemáticas',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $archivo = UploadedFile::fake()->create('documento.pdf', 1000);

        $response = $this->actingAs($docente)
            ->postJson('/api/recursos', [
                'docente_id' => $docente->id,
                'tematica_id' => $tematica->id,
                'titulo' => 'Guía de Estudio',
                'descripcion' => 'Material de apoyo para estudiantes',
                'tipo' => 'documento',
                'archivo' => $archivo
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Recurso guardado correctamente'
            ])
            ->assertJsonStructure([
                'data' => [
                    'id', 'titulo', 'descripcion', 'tipo', 'archivo_path'
                ]
            ]);

        $this->assertDatabaseHas('recursos', [
            'titulo' => 'Guía de Estudio',
            'tipo' => 'documento',
            'docente_id' => $docente->id
        ]);

        // Verificar que el archivo se guardó
        $recurso = Recurso::first();
        Storage::disk('public')->assertExists($recurso->archivo_path);
    }

    #[Test]
    public function docente_puede_crear_recurso_con_enlace(): void
    {
        $docente = User::factory()->create([
            'dni' => '22222222',
            'rol' => 'docente',
        ]);

        $tematica = Tematica::create([
            'nombre' => 'Ciencias',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        $response = $this->actingAs($docente)
            ->postJson('/api/recursos', [
                'docente_id' => $docente->id,
                'tematica_id' => $tematica->id,
                'titulo' => 'Video Educativo',
                'descripcion' => 'Explicación de conceptos',
                'tipo' => 'enlace',
                'url_recurso' => 'https://www.youtube.com/watch?v=ejemplo'
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true
            ]);

        $this->assertDatabaseHas('recursos', [
            'titulo' => 'Video Educativo',
            'tipo' => 'enlace',
            'url_recurso' => 'https://www.youtube.com/watch?v=ejemplo'
        ]);
    }

    #[Test]
    public function docente_puede_ver_sus_recursos(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        $tematica = Tematica::create(['nombre' => 'Matemáticas']);

        Recurso::create([
            'docente_id' => $docente->id,
            'tematica_id' => $tematica->id,
            'titulo' => 'Recurso 1',
            'descripcion' => 'Descripción 1',
            'tipo' => 'documento',
            'visible_estudiantes' => true
        ]);

        Recurso::create([
            'docente_id' => $docente->id,
            'tematica_id' => $tematica->id,
            'titulo' => 'Recurso 2',
            'descripcion' => 'Descripción 2',
            'tipo' => 'video',
            'visible_estudiantes' => false
        ]);

        $response = $this->actingAs($docente)
            ->getJson("/api/recursos/docente/{$docente->id}");

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(2, $data);
        $this->assertEquals('Recurso 1', $data[0]['titulo']);
        $this->assertEquals('Recurso 2', $data[1]['titulo']);
    }

    #[Test]
    public function estudiante_puede_ver_recursos_visibles(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        $estudiante = User::factory()->create(['rol' => 'estudiante']);
        $tematica = Tematica::create(['nombre' => 'Matemáticas']);

        // Recurso visible
        Recurso::create([
            'docente_id' => $docente->id,
            'tematica_id' => $tematica->id,
            'titulo' => 'Recurso Visible',
            'descripcion' => 'Los estudiantes pueden ver esto',
            'tipo' => 'documento',
            'visible_estudiantes' => true
        ]);

        // Recurso no visible
        Recurso::create([
            'docente_id' => $docente->id,
            'tematica_id' => $tematica->id,
            'titulo' => 'Recurso Oculto',
            'descripcion' => 'Los estudiantes NO pueden ver esto',
            'tipo' => 'documento',
            'visible_estudiantes' => false
        ]);

        $response = $this->actingAs($estudiante)
            ->getJson('/api/recursos/estudiantes');

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Recurso Visible', $data[0]['titulo']);
    }

    #[Test]
    public function docente_puede_eliminar_recurso(): void
    {
        Storage::fake('public');

        $docente = User::factory()->create(['rol' => 'docente']);
        $tematica = Tematica::create(['nombre' => 'Matemáticas']);

        $archivo = UploadedFile::fake()->create('documento.pdf', 1000);
        $archivoPath = $archivo->storeAs('recursos', 'test.pdf', 'public');

        $recurso = Recurso::create([
            'docente_id' => $docente->id,
            'tematica_id' => $tematica->id,
            'titulo' => 'Recurso a Eliminar',
            'descripcion' => 'Este será eliminado',
            'tipo' => 'documento',
            'archivo_path' => $archivoPath
        ]);

        $response = $this->actingAs($docente)
            ->deleteJson("/api/recursos/{$recurso->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Recurso eliminado correctamente'
            ]);

        $this->assertDatabaseMissing('recursos', ['id' => $recurso->id]);
        Storage::disk('public')->assertMissing($archivoPath);
    }

    #[Test]
    public function docente_puede_cambiar_visibilidad_de_recurso(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        $tematica = Tematica::create(['nombre' => 'Matemáticas']);

        $recurso = Recurso::create([
            'docente_id' => $docente->id,
            'tematica_id' => $tematica->id,
            'titulo' => 'Recurso Test',
            'descripcion' => 'Para cambiar visibilidad',
            'tipo' => 'documento',
            'visible_estudiantes' => true
        ]);

        // Usar la ruta corregida
        $response = $this->actingAs($docente)
            ->postJson("/api/recursos/{$recurso->id}/visibilidad", [
                'visible' => false // booleano como espera tu controlador
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Visibilidad actualizada correctamente'
            ]);

        $this->assertDatabaseHas('recursos', [
            'id' => $recurso->id,
            'visible_estudiantes' => false
        ]);
    }
    #[Test]
    public function validacion_funciona_con_datos_incorrectos(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);

        $response = $this->actingAs($docente)
            ->postJson('/api/recursos', [
                'docente_id' => 999, // No existe
                'tematica_id' => 999, // No existe
                'titulo' => '', // Requerido
                'tipo' => 'tipo_invalido' // No válido
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['docente_id', 'tematica_id', 'titulo', 'tipo']);
    }

    #[Test]
    public function se_pueden_listar_todos_los_recursos_con_filtros(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        $tematica1 = Tematica::create(['nombre' => 'Matemáticas']);
        $tematica2 = Tematica::create(['nombre' => 'Ciencias']);

        Recurso::create([
            'docente_id' => $docente->id,
            'tematica_id' => $tematica1->id,
            'titulo' => 'Recurso Matemáticas',
            'tipo' => 'documento',
            'visible_estudiantes' => true
        ]);

        Recurso::create([
            'docente_id' => $docente->id,
            'tematica_id' => $tematica2->id,
            'titulo' => 'Recurso Ciencias',
            'tipo' => 'video',
            'visible_estudiantes' => false
        ]);

        // Listar todos
        $response = $this->actingAs($docente)
            ->getJson('/api/recursos');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ]);

        $data = $response->json('data');
        $this->assertCount(2, $data);

        // Filtrar por temática
        $response = $this->actingAs($docente)
            ->getJson("/api/recursos?tematica_id={$tematica1->id}");

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Recurso Matemáticas', $data[0]['titulo']);
    }
}