<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use PHPUnit\Framework\Attributes\Test;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function registro_exitoso_usuario_estudiante()
    {
        $response = $this->postJson('/api/auth/register', [
            'dni' => '87654321',
            'nombre' => 'Juan',
            'apellido' => 'Perez',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'rol' => 'estudiante'
        ]);

        $response->assertStatus(201)
                 ->assertJson([
                     'success' => true,
                     'message' => 'Usuario registrado exitosamente'
                 ])
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'user' => ['id','dni','nombre','apellido','rol'],
                         'token'
                     ]
                 ]);
    }

    #[Test]
    public function registro_falla_si_dni_duplicado()
    {
        User::factory()->create(['dni' => '87654321']);

        $response = $this->postJson('/api/auth/register', [
            'dni' => '87654321',
            'nombre' => 'Juan',
            'apellido' => 'Perez',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'rol' => 'estudiante'
        ]);

        $response->assertStatus(422)
                 ->assertJsonStructure(['success','message','errors']);
    }

    #[Test]
    public function registro_falla_si_campos_invalidos()
    {
        $response = $this->postJson('/api/auth/register', [
            'dni' => '',
            'nombre' => '',
            'apellido' => '',
            'password' => '123',
            'password_confirmation' => '456',
            'rol' => 'invalid'
        ]);

        $response->assertStatus(422)
                 ->assertJsonStructure(['success','message','errors']);
    }
}
