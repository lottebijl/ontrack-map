<?php

require_once('../vendor/autoload.php');
use Handlebars\Handlebars;

return $compiler = new Handlebars(array(
   'loader' => new \Handlebars\Loader\FilesystemLoader('./views'),
   'partials_loader' => new \Handlebars\Loader\FilesystemLoader(
        './views/',
        array(
          ''
        )
    )
));

?>
