<?php
        $last_id = $_POST['last_id'];
        $pdo = new PDO('mysql:charset=UTF8;dbname=envdata;host=localhost', 'info109' , 'info109') ;
        if ($count != 0) {
            $str =  "select * from data where time like '%{$date}%' order by id desc limit {$count}";
        } else {
            $str =  "select * from data where time like '%{$date}%'";
        }
        $sql = $pdo->query($str) 
        $userData = array();
        while( $row = $sql->fetch (PDO::FETCH_ASSOC)){
                $userData[] = $row ;
            }
            echo json_encode($userData);
        ?>