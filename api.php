<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

$csvFile = 'data/guests.csv';

if (!file_exists($csvFile)) {
    if (!is_dir('data')) { mkdir('data', 0755, true); }
    file_put_contents($csvFile, "id;nome;cognome;relazione;conferma;quiz\n");
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';
    
    if ($action === 'search') {
        $q = isset($_GET['q']) ? strtolower(trim($_GET['q'])) : '';
        $results = [];
        
        if (($handle = fopen($csvFile, "r")) !== FALSE) {
            $header = fgetcsv($handle, 1000, ";");
            while (($data = fgetcsv($handle, 1000, ";")) !== FALSE) {
                if (count($data) >= 3) {
                    $id = trim($data[0]);
                    $nome = trim($data[1]);
                    $cognome = trim($data[2]);
                    $fullnameStr = strtolower($nome . ' ' . $cognome);
                    
                    if ($q === '' || strpos($fullnameStr, $q) !== false) {
                        $results[] = [
                            "id" => $id,
                            "nome" => $nome,
                            "cognome" => $cognome
                        ];
                    }
                }
            }
            fclose($handle);
        }
        echo json_encode($results);
        exit;
    }
    
    if ($action === 'images') {
        $images = [];
        
        $upload_dir = __DIR__ . "/assets/images_upload/";
        if (is_dir($upload_dir)) {
            $files = array_diff(scandir($upload_dir), array('.', '..'));
            usort($files, function($a, $b) use ($upload_dir) {
                return filemtime($upload_dir . $b) - filemtime($upload_dir . $a);
            });
            foreach ($files as $f) {
                if (preg_match('/\.(jpg|jpeg|png|gif|webp|heic)$/i', $f)) {
                    $images[] = "assets/images_upload/" . $f;
                }
            }
        }
        
        $base_dir = __DIR__ . "/assets/images/";
        if (is_dir($base_dir)) {
            $files = array_diff(scandir($base_dir), array('.', '..'));
            foreach ($files as $f) {
                if (preg_match('/\.(jpg|jpeg|png|gif|webp|heic)$/i', $f)) {
                    $images[] = "assets/images/" . $f;
                }
            }
        }
        
        echo json_encode(["status" => "ok", "images" => $images]);
        exit;
    }
}

if ($method === 'POST') {
    $action = isset($_POST['action']) ? $_POST['action'] : '';
    
        if ($action === 'upload') {
        if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
            $target_dir = __DIR__ . "/assets/images_upload/";
            if (!is_dir($target_dir)) {
                mkdir($target_dir, 0777, true);
            }
            
            $file = $_FILES['photo'];
            $check = getimagesize($file["tmp_name"]);
            if ($check === false) {
                echo json_encode(["status" => "error", "message" => "Il file non è un'immagine."]);
                exit;
            }
            
            $ext = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];
            if(!in_array($ext, $allowed)) {
                echo json_encode(["status" => "error", "message" => "Formato non supportato."]);
                exit;
            }
            
            $new_name = uniqid("guest_") . "." . $ext;
            $target_file = $target_dir . $new_name;
            
            if (move_uploaded_file($file["tmp_name"], $target_file)) {
                echo json_encode(["status" => "ok", "file" => "assets/images_upload/" . $new_name]);
                exit;
            } else {
                echo json_encode(["status" => "error", "message" => "Errore di salvataggio file."]);
                exit;
            }
        } else {
            echo json_encode(["status" => "error", "message" => "Nessun file o errore di caricamento."]);
            exit;
        }
    }

    if ($action === 'confirm' || $action === 'quiz') {
        $idTarget = isset($_POST['id']) ? trim($_POST['id']) : '';
        
        $rows = [];
        $updated = false;
        
        if (($handle = fopen($csvFile, "r")) !== FALSE) {
            $header = fgetcsv($handle, 1000, ";");
            if ($header === false || count($header) < 6) {
                $header = ["id", "nome", "cognome", "relazione", "conferma", "quiz"];
            }
            $rows[] = $header;
            
            while (($data = fgetcsv($handle, 1000, ";")) !== FALSE) {
                while(count($data) < 6) { $data[] = ""; }
                
                $rowId = trim($data[0]);
                
                if ($rowId !== "" && $rowId === $idTarget) {
                    if ($action === 'confirm') {
                        $data[4] = isset($_POST['value']) ? trim($_POST['value']) : $data[4];
                    } else if ($action === 'quiz') {
                        $data[5] = isset($_POST['score']) ? trim($_POST['score']) : $data[5];
                    }
                    $updated = true;
                }
                $rows[] = $data;
            }
            fclose($handle);
        }
        
        if ($updated) {
            if (($handle = fopen($csvFile, "w")) !== FALSE) {
                foreach ($rows as $row) { fputcsv($handle, $row, ";"); }
                fclose($handle);
            }
            
            if ($action === 'quiz') {
                $scores = [];
                $leaderboard = [];
                foreach ($rows as $i => $row) {
                    if ($i > 0 && isset($row[5]) && trim($row[5]) !== "") {
                        $sc = (int)trim($row[5]);
                        $scores[] = $sc;
                        $leaderboard[] = [
                            "name" => ucwords(strtolower(trim($row[1]) . ' ' . trim($row[2]))),
                            "score" => $sc
                        ];
                    }
                }
                
                usort($leaderboard, function($a, $b) { return $b['score'] <=> $a['score']; });
                $top5 = array_slice($leaderboard, 0, 5);
                
                rsort($scores);
                $myScore = isset($_POST['score']) ? (int)$_POST['score'] : 0;
                $rank = 1;
                foreach ($scores as $s) {
                    if ($myScore < $s) { $rank++; } else if ($myScore == $s) {} else { break; }
                }
                
                echo json_encode(["status" => "ok", "rank" => $rank, "leaderboard" => $top5]);
                exit;
            }
            echo json_encode(["status" => "ok"]);
            exit;
        } else {
            echo json_encode(["status" => "not_found", "message" => "ID associato non caricato"]);
            exit;
        }
    }
}

echo json_encode(["status" => "invalid_request"]);
?>
