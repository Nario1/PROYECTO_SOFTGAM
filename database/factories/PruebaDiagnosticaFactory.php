<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\PruebaDiagnostica;
use App\Models\User;
use App\Models\Prueba;

class PruebaDiagnosticaFactory extends Factory
{
    protected $model = PruebaDiagnostica::class;

    public function definition()
    {
        $prueba = Prueba::factory()->create();
        $user = User::factory()->create();

        return [
            'user_id' => $user->id,
            'prueba_id' => $prueba->id,
            'categoria' => 'inicio',
            'puntaje' => 0,
            'fecha' => now(),
        ];
    }
}
