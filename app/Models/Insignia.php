<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Insignia extends Model
{
    use HasFactory;

    // ==========================
    // CAMPOS ASIGNABLES
    // ==========================
    protected $fillable = [
        'nombre',
        'descripcion',
        'criterio'
    ];

    // ==========================
    // RELACIONES
    // ==========================
    public function estudiantes()
    {
        return $this->belongsToMany(
            User::class,
            'estudiante_insignias',
            'insignia_id', // clave foránea de esta tabla (insignias)
            'user_id'      // clave foránea de la tabla pivote que apunta a users
        )
            ->withTimestamps()
            ->withPivot('fecha');
    }
}
