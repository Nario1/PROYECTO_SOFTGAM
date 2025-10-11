<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Ranking extends Model
{
    use HasFactory;

    // ==========================
    // CAMPOS ASIGNABLES
    // ==========================
    protected $fillable = [
        'user_id',   // corregido para coincidir con la migración
        'posicion',
        'fecha'
    ];

    // ==========================
    // RELACIONES
    // ==========================
    public function estudiante()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
