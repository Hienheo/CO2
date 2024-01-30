<?php
        $pdo = new PDO('mysql:charset=UTF8;dbname=envdata;host=localhost', 'info109' , 'info109') ;
        $str =  "select * from data limit 1";
        $sql = $pdo->query($str) 
        $userData = array();
        while( $row = $sql->fetch (PDO::FETCH_ASSOC)){
                $userData[] = $row ;
            }
            echo json_encode($userData);
        ?>