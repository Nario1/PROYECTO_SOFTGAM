<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">

    <!-- Favicon -->
    <link rel="shortcut icon" href="/img/logo.jpg" type="image/png" />

    <title>SOFTWARE GAMIFICADO</title>

    @php
        $manifestPath = public_path('build/manifest.json');
        $manifest = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : [];
    @endphp

    {{-- Cargar todos los CSS del build --}}
    @foreach($manifest as $file)
        @if(isset($file['css']))
            @foreach($file['css'] as $cssFile)
                <link rel="stylesheet" href="{{ asset('build/' . $cssFile) }}">
            @endforeach
        @endif
    @endforeach
</head>
<body>
    <div id="root"></div>

    {{-- Cargar JS de entrada --}}
    @foreach($manifest as $file)
        @if(isset($file['isEntry']) && $file['isEntry'] === true && isset($file['file']))
            <script type="module" src="{{ asset('build/' . $file['file']) }}"></script>
        @endif
    @endforeach
</body>
</html>
