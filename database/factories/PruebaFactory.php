<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Prueba;

class PruebaFactory extends Factory
{
    protected $model = Prueba::class;

    public function definition()
    {
        return [
            'titulo' => $this->faker->sentence(3),
            'descripcion' => $this->faker->paragraph(),
        ];
    }
}
