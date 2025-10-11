<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'dni' => $this->faker->unique()->numerify('########'),
            'nombre' => $this->faker->firstName(),
            'apellido' => $this->faker->lastName(),
            'password' => Hash::make('password'), // password por defecto
            'rol' => $this->faker->randomElement(['estudiante', 'docente', 'admin']),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
