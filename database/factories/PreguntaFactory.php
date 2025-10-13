<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Pregunta;
use App\Models\Prueba;

class PreguntaFactory extends Factory
{
    protected $model = Pregunta::class;

    public function definition()
    {
        $opciones = [
            'A' => $this->faker->word,
            'B' => $this->faker->word,
            'C' => $this->faker->word,
            'D' => $this->faker->word,
        ];

        return [
            'prueba_id' => Prueba::factory(),
            'texto' => $this->faker->sentence(),
            'opciones' => json_encode($opciones),
            'respuesta_correcta' => $this->faker->randomElement(array_values($opciones)),
        ];
    }
}
