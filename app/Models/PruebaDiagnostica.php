<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PruebaDiagnostica extends Model
{
    use HasFactory;

    // ==========================
    // NOMBRE DE LA TABLA
    // ==========================
    protected $table = 'pruebas_diagnosticas';

    // ==========================
    // CAMPOS ASIGNABLES
    // ==========================
    protected $fillable = [
        'user_id',
        'prueba_id', // ⚡ agregado
        'categoria',
        'puntaje',
        'fecha'
    ];

    // ==========================
    // RELACIONES
    // ==========================
    public function estudiante()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
    public function prueba()
    {
        return $this->belongsTo(Prueba::class, 'prueba_id');
    }

}
