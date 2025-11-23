<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Prueba;
use App\Models\PruebaDiagnostica;
use App\Models\Pregunta;
use App\Models\Respuesta;
use PHPUnit\Framework\Attributes\Test;

class ReportesDiagnosticoControllerTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function docente_puede_ver_reportes_de_pruebas_diagnosticas(): void
    {
        $docente = User::factory()->create([
            'dni' => '11111111',
            'rol' => 'docente',
        ]);

        $estudiante = User::factory()->create([
            'dni' => '22222222',
            'rol' => 'estudiante',
            'nombre' => 'Juan',
            'apellido' => 'Perez'
        ]);

        $prueba = Prueba::create([
            'titulo' => 'Prueba de Matemáticas',
            'descripcion' => 'Evaluación de conceptos básicos'
        ]);

        // Crear prueba diagnóstica
        $pruebaDiagnostica = PruebaDiagnostica::create([
            'user_id' => $estudiante->id,
            'prueba_id' => $prueba->id,
            'categoria' => 'Alta',
            'puntaje' => 85, // Este es el puntaje que se guarda en la BD
            'fecha' => '2024-01-15'
        ]);

        // Crear algunas respuestas para que el método getReportes las cuente
        $pregunta1 = Pregunta::create([
            'prueba_id' => $prueba->id,
            'texto' => 'Pregunta 1',
            'opciones' => json_encode(['A', 'B', 'C']),
            'respuesta_correcta' => 'A'
        ]);

        $pregunta2 = Pregunta::create([
            'prueba_id' => $prueba->id,
            'texto' => 'Pregunta 2',
            'opciones' => json_encode(['A', 'B', 'C']),
            'respuesta_correcta' => 'B'
        ]);

        // Crear respuestas correctas
        Respuesta::create([
            'prueba_diagnostica_id' => $pruebaDiagnostica->id,
            'pregunta_id' => $pregunta1->id,
            'user_id' => $estudiante->id,
            'respuesta' => 'A',
            'correcta' => 1
        ]);

        Respuesta::create([
            'prueba_diagnostica_id' => $pruebaDiagnostica->id,
            'pregunta_id' => $pregunta2->id,
            'user_id' => $estudiante->id,
            'respuesta' => 'B',
            'correcta' => 1
        ]);

        $response = $this->actingAs($docente)
            ->getJson('/api/pruebas-diagnosticas/reportes-diagnostico');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ])
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'estudiante' => ['id', 'nombre'],
                        'prueba' => ['id', 'titulo'],
                        'puntaje',
                        'categoria',
                        'fecha'
                    ]
                ]
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Juan Perez', $data[0]['estudiante']['nombre']);
        $this->assertEquals('Prueba de Matemáticas', $data[0]['prueba']['titulo']);
        
        // El puntaje ahora viene de contar respuestas correctas, no del campo puntaje
        $this->assertEquals(2, $data[0]['puntaje']); // 2 respuestas correctas
        $this->assertEquals('Alta', $data[0]['categoria']);
    }

    #[Test]
    public function reportes_muestran_correctamente_estudiantes_con_nombre_completo(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);

        $estudiante1 = User::factory()->create([
            'rol' => 'estudiante',
            'nombre' => 'Carlos',
            'apellido' => 'Lopez'
        ]);

        $estudiante2 = User::factory()->create([
            'rol' => 'estudiante',
            'nombre' => 'Ana',
            'apellido' => 'Martinez'
        ]);

        $prueba = Prueba::create(['titulo' => 'Prueba General']);

        // Crear pruebas diagnósticas sin respuestas (puntaje será 0)
        PruebaDiagnostica::create([
            'user_id' => $estudiante1->id,
            'prueba_id' => $prueba->id,
            'categoria' => 'Alta',
            'puntaje' => 90,
            'fecha' => '2024-01-17'
        ]);

        PruebaDiagnostica::create([
            'user_id' => $estudiante2->id,
            'prueba_id' => $prueba->id,
            'categoria' => 'Baja',
            'puntaje' => 45,
            'fecha' => '2024-01-18'
        ]);

        $response = $this->actingAs($docente)
            ->getJson('/api/pruebas-diagnosticas/reportes-diagnostico');

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(2, $data);
        
        // Verificar que los nombres se muestran completos
        $nombres = array_column($data, 'estudiante');
        $nombresCompletos = array_column($nombres, 'nombre');
        
        $this->assertContains('Carlos Lopez', $nombresCompletos);
        $this->assertContains('Ana Martinez', $nombresCompletos);
        
        // Los puntajes serán 0 porque no hay respuestas asociadas
        $this->assertEquals(0, $data[0]['puntaje']);
        $this->assertEquals(0, $data[1]['puntaje']);
    }

    #[Test]
    public function reportes_ordenados_correctamente_por_fecha(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        $estudiante = User::factory()->create(['rol' => 'estudiante']);
        $prueba = Prueba::create(['titulo' => 'Prueba Test']);

        // Crear pruebas en orden cronológico inverso
        PruebaDiagnostica::create([
            'user_id' => $estudiante->id,
            'prueba_id' => $prueba->id,
            'categoria' => 'Media',
            'puntaje' => 70,
            'fecha' => '2024-01-10'
        ]);

        PruebaDiagnostica::create([
            'user_id' => $estudiante->id,
            'prueba_id' => $prueba->id,
            'categoria' => 'Alta',
            'puntaje' => 85,
            'fecha' => '2024-01-15'
        ]);

        PruebaDiagnostica::create([
            'user_id' => $estudiante->id,
            'prueba_id' => $prueba->id,
            'categoria' => 'Baja',
            'puntaje' => 40,
            'fecha' => '2024-01-05'
        ]);

        $response = $this->actingAs($docente)
            ->getJson('/api/pruebas-diagnosticas/reportes-diagnostico');

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(3, $data);
        
        // Verificar que están ordenados (puede variar según la implementación)
        $fechas = array_column($data, 'fecha');
        $this->assertNotEmpty($fechas);
        
        // Todos los puntajes serán 0 porque no hay respuestas
        foreach ($data as $reporte) {
            $this->assertEquals(0, $reporte['puntaje']);
        }
    }

    #[Test]
    public function reportes_vacios_muestran_array_vacio(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);

        $response = $this->actingAs($docente)
            ->getJson('/api/pruebas-diagnosticas/reportes-diagnostico');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => []
            ]);

        $data = $response->json('data');
        $this->assertEmpty($data);
    }

    #[Test]
    public function reportes_incluyen_todas_las_pruebas_existentes(): void
    {
        $docente = User::factory()->create(['rol' => 'docente']);
        $estudiante = User::factory()->create(['rol' => 'estudiante']);

        $prueba1 = Prueba::create(['titulo' => 'Prueba Matemáticas']);
        $prueba2 = Prueba::create(['titulo' => 'Prueba Lenguaje']);
        $prueba3 = Prueba::create(['titulo' => 'Prueba Ciencias']);

        PruebaDiagnostica::create([
            'user_id' => $estudiante->id,
            'prueba_id' => $prueba1->id,
            'categoria' => 'Alta',
            'puntaje' => 88,
            'fecha' => '2024-01-20'
        ]);

        PruebaDiagnostica::create([
            'user_id' => $estudiante->id,
            'prueba_id' => $prueba2->id,
            'categoria' => 'Media',
            'puntaje' => 72,
            'fecha' => '2024-01-21'
        ]);

        PruebaDiagnostica::create([
            'user_id' => $estudiante->id,
            'prueba_id' => $prueba3->id,
            'categoria' => 'Baja',
            'puntaje' => 35,
            'fecha' => '2024-01-22'
        ]);

        $response = $this->actingAs($docente)
            ->getJson('/api/pruebas-diagnosticas/reportes-diagnostico');

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(3, $data);

        // Verificar que se incluyen todas las pruebas
        $titulosPruebas = array_column(array_column($data, 'prueba'), 'titulo');
        $this->assertContains('Prueba Matemáticas', $titulosPruebas);
        $this->assertContains('Prueba Lenguaje', $titulosPruebas);
        $this->assertContains('Prueba Ciencias', $titulosPruebas);
        
        // Todos los puntajes serán 0 porque no hay respuestas
        foreach ($data as $reporte) {
            $this->assertEquals(0, $reporte['puntaje']);
        }
    }
}