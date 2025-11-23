<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Asistencia;
use PHPUnit\Framework\Attributes\Test;

class AsistenciaControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function docente_puede_registrar_asistencia_para_estudiante(): void
    {
        $docente = User::factory()->create([
            'dni' => '11111111',
            'rol' => 'docente',
        ]);

        $estudiante = User::factory()->create([
            'dni' => '22222222',
            'rol' => 'estudiante',
        ]);

        $fecha = now()->format('Y-m-d');

        $response = $this->actingAs($docente)
            ->postJson('/api/asistencias', [
                'estudiante_id' => $estudiante->id,
                'docente_id' => $docente->id,
                'fecha' => $fecha,
                'estado' => 'presente',
                'incidencias' => 'Llegó puntual'
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Asistencia registrada correctamente'
            ]);

        $this->assertDatabaseHas('asistencias', [
            'estudiante_id' => $estudiante->id,
            'docente_id' => $docente->id,
            'fecha' => $fecha,
            'estado' => 'presente'
        ]);
    }

    #[Test]
    public function docente_puede_actualizar_asistencia_existente(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        $estudiante = User::factory()->create(['rol' => 'estudiante']);

        $asistencia = Asistencia::create([
            'estudiante_id' => $estudiante->id,
            'docente_id' => $docente->id,
            'fecha' => now()->format('Y-m-d'),
            'estado' => 'presente',
            'incidencias' => 'Sin novedad'
        ]);

        $response = $this->actingAs($docente)
            ->putJson("/api/asistencias/{$asistencia->id}", [
                'estado' => 'ausente',
                'incidencias' => 'Justificado con certificado médico'
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Asistencia actualizada correctamente'
            ]);

        $this->assertDatabaseHas('asistencias', [
            'id' => $asistencia->id,
            'estado' => 'ausente',
            'incidencias' => 'Justificado con certificado médico'
        ]);
    }

    #[Test]
    public function sistema_evita_duplicados_en_misma_fecha(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        $estudiante = User::factory()->create(['rol' => 'estudiante']);
        $fecha = '2024-01-15';

        // Primera asistencia
        $asistencia1 = Asistencia::create([
            'estudiante_id' => $estudiante->id,
            'docente_id' => $docente->id,
            'fecha' => $fecha,
            'estado' => 'presente'
        ]);

        // Intentar crear otra para misma fecha y estudiante
        $response = $this->actingAs($docente)
            ->postJson('/api/asistencias', [
                'estudiante_id' => $estudiante->id,
                'docente_id' => $docente->id,
                'fecha' => $fecha,
                'estado' => 'tarde'
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Asistencia actualizada correctamente'
            ]);

        // Verificar que se actualizó en lugar de crear nueva
        $this->assertDatabaseCount('asistencias', 1);
        $this->assertDatabaseHas('asistencias', [
            'estudiante_id' => $estudiante->id,
            'fecha' => $fecha,
            'estado' => 'tarde'
        ]);
    }

    #[Test]
    public function se_pueden_obtener_asistencias_de_estudiante(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        $estudiante = User::factory()->create(['rol' => 'estudiante']);

        Asistencia::create([
            'estudiante_id' => $estudiante->id,
            'docente_id' => $docente->id,
            'fecha' => '2024-01-10',
            'estado' => 'presente'
        ]);

        Asistencia::create([
            'estudiante_id' => $estudiante->id,
            'docente_id' => $docente->id,
            'fecha' => '2024-01-11',
            'estado' => 'ausente'
        ]);

        $response = $this->actingAs($docente)
            ->getJson("/api/asistencias/estudiante/{$estudiante->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [
                '*' => ['id', 'fecha', 'estado', 'docente_nombre']
            ]]);

        $data = $response->json('data');
        $this->assertCount(2, $data);
    }

   
    #[Test]
    public function validacion_funciona_con_datos_incorrectos(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);

        $response = $this->actingAs($docente)
            ->postJson('/api/asistencias', [
                'estudiante_id' => 999, // ID que no existe
                'docente_id' => $docente->id,
                'fecha' => 'fecha-invalida',
                'estado' => 'estado-invalido'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['estudiante_id', 'fecha', 'estado']);
    }

    
}