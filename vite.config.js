import { defineConfig } from "vite";
import laravel from "laravel-vite-plugin";

export default defineConfig({
    plugins: [
        laravel({
            input: [
                "resources/sass/app.scss",
                "resources/js/app.js",
                "resources/js/styles/admin.css",
                "resources/js/styles/docente.css",
                "resources/js/styles/gamificacion.css",
                "resources/js/styles/login.css",
                "resources/js/styles/navbar.css",
                "resources/js/styles/register.css",
                "resources/js/styles/sidebar.css",
            ],
            refresh: true,
        }),
    ],
});
