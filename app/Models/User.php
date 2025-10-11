<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Spatie\Permission\Traits\HasRoles;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles, HasApiTokens;

    protected $fillable = [
        'dni',
        'password',
        'nombre',
        'apellido',
        'rol',
        
    ];

    protected $hidden = ['password', 'remember_token'];

    // ==========================
    // RELACIONES
    // ==========================

    // Estudiante
    public function jugadas()
    {
        return $this->hasMany(Jugada::class, 'user_id');
    }

    public function puntos()
    {
        return $this->hasMany(Punto::class, 'user_id');
    }

    public function niveles()
    {
        return $this->belongsToMany(Nivel::class, 'estudiante_niveles', 'user_id', 'nivel_id')
            ->withTimestamps()
            ->withPivot('fecha_asignacion');
    }

    public function insignias()
    {
        return $this->belongsToMany(Insignia::class, 'estudiante_insignias', 'user_id', 'insignia_id')
            ->withTimestamps()
            ->withPivot('fecha');
    }

    public function ranking()
    {
        return $this->hasOne(Ranking::class, 'user_id');
    }

    public function pruebasDiagnosticas()
    {
        return $this->hasMany(PruebaDiagnostica::class, 'user_id');
    }

    public function datosUso()
    {
        return $this->hasMany(DatoUso::class, 'user_id');
    }

    // Docente
    public function actividades()
    {
        return $this->hasMany(Actividad::class, 'docente_id');
    }
}
