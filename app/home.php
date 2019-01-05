<?php
  $compiler = include('compiler.php');
  $data['title'] = 'Home';

  echo $compiler->render('home', $data);
?>