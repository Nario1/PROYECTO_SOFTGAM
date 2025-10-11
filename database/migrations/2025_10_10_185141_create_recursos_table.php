<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recursos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('docente_id');
            $table->unsignedBigInteger('tematica_id');
            $table->string('titulo', 255);
            $table->text('descripcion')->nullable();
            $table->enum('tipo', ['documento', 'video', 'imagen', 'enlace', 'otros'])->default('documento');
            $table->string('url_recurso', 500)->nullable();
            $table->string('archivo_path', 500)->nullable();
            $table->date('fecha_publicacion')->default(DB::raw('CURRENT_DATE'));
            $table->boolean('visible_estudiantes')->default(true);
            $table->timestamps();

            // 🔗 Relaciones
            $table->foreign('docente_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('tematica_id')->references('id')->on('tematicas')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recursos');
    }
};
