<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asignacion extends Model
{
    use HasFactory;

    protected $fillable = [
        'actividad_id',
        'estudiante_id',
        'docente_id',
        'fecha_entrega',
        'texto_entrega',     // Texto ingresado por el estudiante
        'archivo_entrega',   // Archivo enviado por el estudiante
    ];

    // RELACIONES
    public function actividad()
    {
        return $this->belongsTo(Actividad::class, 'actividad_id');
    }

    public function estudiante()
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }

    public function docente()
    {
        return $this->belongsTo(User::class, 'docente_id');
    }
}
