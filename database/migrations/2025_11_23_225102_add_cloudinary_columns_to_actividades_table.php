<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('actividades', function (Blueprint $table) {
            $table->string('archivo_public_id')->nullable()->after('archivo_material');
            $table->string('nombre_archivo_original')->nullable()->after('archivo_public_id');
            $table->string('extension_original', 50)->nullable()->after('nombre_archivo_original');
        });
    }

    public function down()
    {
        Schema::table('actividades', function (Blueprint $table) {
            $table->dropColumn(['archivo_public_id', 'nombre_archivo_original', 'extension_original']);
        });
    }
};