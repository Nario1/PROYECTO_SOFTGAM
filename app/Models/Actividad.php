<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Actividad extends Model
{
    use HasFactory;

    protected $fillable = [
        'titulo',
        'descripcion',
        'tematica_id',
        'docente_id',
        'fecha_limite',
        'archivo_material', // PDF o imagen que suba el docente
    ];

    // RELACIONES
    public function docente()
    {
        return $this->belongsTo(User::class, 'docente_id');
    }

    public function tematica()
    {
        return $this->belongsTo(Tematica::class, 'tematica_id');
    }

    public function asignaciones()
    {
        return $this->hasMany(Asignacion::class, 'actividad_id');
    }
}
