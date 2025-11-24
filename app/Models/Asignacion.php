<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asignacion extends Model
{
    use HasFactory;

    protected $fillable = [
        'actividad_id',
        'estudiante_id',
        'docente_id',
        'fecha_entrega',
        'texto_entrega',     // Texto ingresado por el estudiante
        'archivo_entrega',   // Archivo enviado por el estudiante
        'archivo_entrega_public_id', // ✅ NUEVO: ID público de Cloudinary para entrega
        'nombre_archivo_original_entrega', // ✅ NUEVO: Nombre original del archivo de entrega
        'extension_original_entrega', // ✅ NUEVO: Extensión original del archivo de entrega
    ];

    // RELACIONES
    public function actividad()
    {
        return $this->belongsTo(Actividad::class, 'actividad_id');
    }

    public function estudiante()
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }

    public function docente()
    {
        return $this->belongsTo(User::class, 'docente_id');
    }

    // ✅ NUEVO: Método para obtener nombre de archivo completo de entrega
    public function getNombreArchivoEntregaCompletoAttribute()
    {
        if ($this->nombre_archivo_original_entrega && $this->extension_original_entrega) {
            return $this->nombre_archivo_original_entrega . '.' . $this->extension_original_entrega;
        }
        return basename($this->archivo_entrega) ?? 'entrega';
    }

    // ✅ NUEVO: Método para verificar si tiene archivo de entrega
    public function getTieneArchivoEntregaAttribute()
    {
        return !empty($this->archivo_entrega);
    }

    // ✅ NUEVO: Método para verificar si fue entregada
    public function getFueEntregadaAttribute()
    {
        return !empty($this->fecha_entrega);
    }
}