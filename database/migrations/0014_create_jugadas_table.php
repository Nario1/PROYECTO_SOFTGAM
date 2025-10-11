<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('jugadas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');    // estudiante que juega
            $table->unsignedBigInteger('juego_id');   // juego que se juega
            $table->timestamp('inicio_juego')->nullable();
            $table->timestamp('fin_juego')->nullable();
            $table->integer('puntos_obtenidos')->default(0);
            $table->boolean('finalizado')->default(false);
            $table->timestamps();

            // Relaciones
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('juego_id')->references('id')->on('juegos')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jugadas');
    }
};
