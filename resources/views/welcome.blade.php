<!-- Favicon -->
<link rel="shortcut icon" href="https://trilenium.site/softgam/public/img/logo.jpg" type="image/jpg" />

<body>
    <div id="root"></div>

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

    {{-- Cargar JS de entrada --}}
    @foreach($manifest as $file)
        @if(isset($file['isEntry']) && $file['isEntry'] === true && isset($file['file']))
            <script type="module" src="{{ asset('build/' . $file['file']) }}"></script>
        @endif
    @endforeach
</body>
