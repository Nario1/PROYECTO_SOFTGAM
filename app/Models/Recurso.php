<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recurso extends Model
{
    use HasFactory;

    protected $fillable = [
        'docente_id',
        'tematica_id',
        'titulo',
        'descripcion',
        'tipo',
        'url_recurso',
        'archivo_path',
        'fecha_publicacion',
        'visible_estudiantes',
    ];

    public function docente()
    {
        return $this->belongsTo(User::class, 'docente_id');
    }

    public function tematica()
    {
        return $this->belongsTo(Tematica::class, 'tematica_id');
    }
}
