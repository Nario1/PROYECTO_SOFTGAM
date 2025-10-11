<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Nivel extends Model
{
    use HasFactory;

    // ==========================
    // CAMPOS ASIGNABLES
    // ==========================
    protected $fillable = [
        'nombre',
        'descripcion',
        'requisito_puntos',
        'dificultad' // agregada según la migración de niveles
    ];

    // ==========================
    // RELACIONES
    // ==========================
    public function estudiantes()
    {
        return $this->belongsToMany(
            User::class,
            'estudiante_niveles',
            'nivel_id',    // clave foránea de esta tabla (niveles)
            'user_id'      // clave foránea de la tabla pivote que apunta a users
        )
            ->withTimestamps()
            ->withPivot('fecha_asignacion');
    }
}
