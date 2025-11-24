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
        'archivo_public_id', // ✅ NUEVO: ID público de Cloudinary
        'nombre_archivo_original', // ✅ NUEVO: Nombre original del archivo
        'extension_original', // ✅ NUEVO: Extensión original del archivo
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

    // ✅ NUEVO: Método para obtener nombre de archivo completo
    public function getNombreArchivoCompletoAttribute()
    {
        if ($this->nombre_archivo_original && $this->extension_original) {
            return $this->nombre_archivo_original . '.' . $this->extension_original;
        }
        return basename($this->archivo_material) ?? 'archivo';
    }

    // ✅ NUEVO: Método para verificar si tiene archivo
    public function getTieneArchivoAttribute()
    {
        return !empty($this->archivo_material);
    }
}