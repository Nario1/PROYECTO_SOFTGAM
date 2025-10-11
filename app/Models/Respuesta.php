<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Respuesta extends Model
{
    use HasFactory;

    // Campos asignables
    protected $fillable = [
        'prueba_diagnostica_id', // <- agregar este campo
        'pregunta_id',
        'user_id',
        'respuesta',
        'correcta'
    ];

    // Relaciones (opcional)
    public function pruebaDiagnostica()
    {
        return $this->belongsTo(PruebaDiagnostica::class);
    }

    public function pregunta()
    {
        return $this->belongsTo(Pregunta::class);
    }

    public function estudiante()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
