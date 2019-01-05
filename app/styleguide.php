<?php
  $compiler = include('compiler.php');
  $data['title'] = 'Styleguide';

  echo $compiler->render('styleguide', $data);
?>