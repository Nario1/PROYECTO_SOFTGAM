<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('estudiante_insignias', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('insignia_id');
            $table->timestamp('fecha')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('insignia_id')->references('id')->on('insignias')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('estudiante_insignias');
    }
};
