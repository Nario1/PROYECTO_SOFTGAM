<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Retroalimentacion extends Model
{
    use HasFactory;

    protected $fillable = [
        'asignacion_id',
        'docente_id',
        'comentario',
        'calificacion',
    ];

    public function asignacion()
    {
        return $this->belongsTo(Asignacion::class);
    }

    public function docente()
    {
        return $this->belongsTo(User::class, 'docente_id');
    }
}
