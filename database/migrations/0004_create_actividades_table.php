<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('actividades', function (Blueprint $table) {
            $table->id();
            $table->string('titulo', 100);
            $table->text('descripcion')->nullable();
            $table->unsignedBigInteger('tematica_id');
            $table->unsignedBigInteger('docente_id');
            $table->date('fecha_limite')->nullable();
            $table->string('archivo_material')->nullable(); // PDF/Imagen
            $table->timestamps();

            // Relaciones
            $table->foreign('tematica_id')->references('id')->on('tematicas')->onDelete('cascade');
            $table->foreign('docente_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('actividades');
    }
};
