<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Registrar bindings y servicios en el contenedor.
     */
    public function register(): void
    {
        // Aquí puedes registrar servicios si los necesitas
    }

    /**
     * Ejecutar código al iniciar la aplicación.
     */
    public function boot(): void
    {
        // Inicializaciones globales
    }
}
