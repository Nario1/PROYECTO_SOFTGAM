<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class DatoUso extends Model
{
    use HasFactory;

    protected $table = 'datos_uso'; // <- Esto es clave

    protected $fillable = [
        'user_id',
        'fecha_ingreso',
        'tiempo_sesion',
        'actividades_completadas'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
