<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class EstudianteNivel extends Pivot
{
    // ==========================
    // TABLA PIVOT
    // ==========================
    protected $table = 'estudiante_niveles';

    // ==========================
    // CAMPOS ASIGNABLES
    // ==========================
    protected $fillable = [
        'user_id',      // corregido para coincidir con la migración
        'nivel_id',
        'fecha_asignacion'
    ];

    // ==========================
    // TIMESTAMPS
    // ==========================
    public $timestamps = true;
}
