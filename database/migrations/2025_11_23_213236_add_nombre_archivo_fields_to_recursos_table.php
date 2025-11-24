<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('recursos', function (Blueprint $table) {
            $table->string('nombre_archivo_original')->nullable()->after('archivo_public_id');
            $table->string('extension_original')->nullable()->after('nombre_archivo_original');
        });
    }

    public function down()
    {
        Schema::table('recursos', function (Blueprint $table) {
            $table->dropColumn(['nombre_archivo_original', 'extension_original']);
        });
    }
};
