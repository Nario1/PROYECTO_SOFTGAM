<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pregunta extends Model
{
    use HasFactory;

    protected $fillable = [
        'prueba_id',        // relación con la prueba
        'texto',            // el enunciado de la pregunta
        'opciones',         // JSON con las opciones
        'respuesta_correcta'// la respuesta correcta
    ];

    // Relación con prueba
    public function prueba()
    {
        return $this->belongsTo(Prueba::class);
    }
}
