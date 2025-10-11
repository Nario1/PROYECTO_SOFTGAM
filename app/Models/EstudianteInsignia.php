<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class EstudianteInsignia extends Pivot
{
    // ==========================
    // TABLA PIVOT
    // ==========================
    protected $table = 'estudiante_insignias';

    // ==========================
    // CAMPOS ASIGNABLES
    // ==========================
    protected $fillable = [
        'user_id',      // corregido para coincidir con la migración
        'insignia_id',
        'fecha'
    ];

    // ==========================
    // TIMESTAMPS
    // ==========================
    public $timestamps = true;
}
