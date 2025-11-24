<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cloudinary Configuration
    |--------------------------------------------------------------------------
    |
    | An HTTP or HTTPS URL to specify your cloudinary account.
    | Uses the following format:
    | https://res.cloudinary.com/{cloud_name}/{resource_type}/{type}/{version}/{public_id}.{format}
    |
    */

    'cloud_url' => env('CLOUDINARY_URL', 'cloudinary://141732261349856:hpboEwwBC_o_v5EQ810gS54y1go@dh1bttxzc'),

    /**
     * Upload Preset From Cloudinary Dashboard
     *
     * @see https://cloudinary.com/documentation/upload_presets
     */
    'upload_preset' => env('CLOUDINARY_UPLOAD_PRESET'),

    /*
    |--------------------------------------------------------------------------
    | Cloudinary Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your Cloudinary settings. Cloudinary is a cloud
    | hosted image management service for all your web or mobile application
    | needs. This provides a smooth deployment environment for your app.
    |
    */

    /**
     * Cloud Name
     *
     * @see https://cloudinary.com/documentation/how_to_integrate_cloudinary#get_familiar_with_the_cloudinary_management_console
     */
    'cloud_name' => env('CLOUDINARY_CLOUD_NAME', 'dh1bttxzc'),

    /**
     * API Key
     *
     * @see https://cloudinary.com/documentation/how_to_integrate_cloudinary#get_familiar_with_the_cloudinary_management_console
     */
    'api_key' => env('CLOUDINARY_API_KEY', '141732261349856'),

    /**
     * API Secret
     *
     * @see https://cloudinary.com/documentation/how_to_integrate_cloudinary#get_familiar_with_the_cloudinary_management_console
     */
    'api_secret' => env('CLOUDINARY_API_SECRET', 'hpboEwwBC_o_v5EQ810gS54y1go'),

    /**
     * Scaling Configuration
     *
     * @see https://cloudinary.com/documentation/image_transformations#configuring_an_image_upload_preset_for_automatic_scaling
     */
    'scaling' => [
        'format' => 'png',
        'width' => 150,
        'height' => 150,
        'crop' => 'fit',
        'effect' => 'colorize',
        'background' => 'black',
    ],

    /**
     * Default Storage Path
     *
     * @see https://cloudinary.com/documentation/php_integration#deliver_and_transform_images
     */
    'path' => env('CLOUDINARY_STORAGE_PATH', 'https://res.cloudinary.com/dh1bttxzc'),

    /**
     * Should we use a secure URL when generating Cloudinary URLs?
     *
     * @see https://cloudinary.com/documentation/php_integration#deliver_and_transform_images
     */
    'secure' => env('CLOUDINARY_SECURE', true),
];