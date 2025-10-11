<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Juego extends Model
{
    use HasFactory;

    // ==========================
    // CAMPOS ASIGNABLES
    // ==========================
    protected $fillable = [
        'nombre',
        'descripcion',
        'imagen',
        'tematica_id'
    ];

    // ==========================
    // RELACIONES
    // ==========================

    // Un juego pertenece a una temática
    public function tematica()
    {
        return $this->belongsTo(Tematica::class, 'tematica_id');
    }

    // Un juego tiene muchas actividades
    public function actividades()
    {
        return $this->hasMany(Actividad::class, 'juego_id');
    }

    // Un juego tiene muchas jugadas (estudiantes que lo juegan)
    public function jugadas()
    {
        return $this->hasMany(Jugada::class, 'juego_id');
    }
}
