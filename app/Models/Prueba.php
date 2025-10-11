<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Prueba extends Model
{
    use HasFactory;

    // Tabla asociada
    protected $table = 'pruebas';

    // Campos asignables
    protected $fillable = [
        'titulo',
        'descripcion',
    ];
    public function preguntas()
    {
        return $this->hasMany(Pregunta::class, 'prueba_id');
    }

}
