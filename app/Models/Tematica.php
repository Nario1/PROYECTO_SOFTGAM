<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Tematica extends Model
{
    use HasFactory;

    // ==========================
    // CAMPOS ASIGNABLES
    // ==========================
    protected $fillable = [
        'nombre'
    ];

    // ==========================
    // RELACIONES
    // ==========================

    // Una temática tiene muchos juegos
    public function juegos()
    {
        return $this->hasMany(Juego::class, 'tematica_id');
    }

    // Una temática tiene muchas actividades
    public function actividades()
    {
        return $this->hasMany(Actividad::class, 'tematica_id');
    }
}
