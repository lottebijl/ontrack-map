<?php

// autoload_static.php @generated by Composer

namespace Composer\Autoload;

class ComposerStaticInit3daeb22084b7a77d35c4b1f3bb70e54f
{
    public static $prefixesPsr0 = array (
        'M' => 
        array (
            'Mustache' => 
            array (
                0 => __DIR__ . '/..' . '/mustache/mustache/src',
            ),
        ),
        'H' => 
        array (
            'Handlebars' => 
            array (
                0 => __DIR__ . '/..' . '/xamin/handlebars.php/src',
            ),
        ),
    );

    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->prefixesPsr0 = ComposerStaticInit3daeb22084b7a77d35c4b1f3bb70e54f::$prefixesPsr0;

        }, null, ClassLoader::class);
    }
}