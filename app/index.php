<?php
  $compiler = include('compiler.php');
  $data['title'] = 'Pageindex';

  echo $compiler->render('index', $data);
?>