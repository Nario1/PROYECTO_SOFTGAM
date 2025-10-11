<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\Test;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function login_exitoso(): void
    {
        // Crear un usuario con contraseña conocida
        $user = User::factory()->create([
            'dni' => '12345678',
            'password' => Hash::make('password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'dni' => '12345678',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'message',
                     'data' => [
                         'user' => [
                             'id',
                             'dni',
                             'nombre',
                             'apellido',
                             'rol',
                         ],
                         'token',
                     ],
                 ]);

        $this->assertTrue($response->json('success'));
        $this->assertEquals('Login exitoso', $response->json('message'));
    }

    #[Test]
    public function login_falla_con_credenciales_incorrectas(): void
    {
        $user = User::factory()->create([
            'dni' => '87654321',
            'password' => Hash::make('password'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'dni' => '87654321',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
                 ->assertJson([
                     'success' => false,
                     'message' => 'Credenciales incorrectas',
                 ]);
    }

    #[Test]
    public function login_falla_si_campos_vacios(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'dni' => '',
            'password' => '',
        ]);

        $response->assertStatus(422)
                 ->assertJson([
                     'success' => false,
                 ]);
    }
}
