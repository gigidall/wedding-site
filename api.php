<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

$csvFile = 'data/guests.csv';

// Ensure data directory and file exist for safety
if (!file_exists($csvFile)) {
    if (!is_dir('data')) {
        mkdir('data', 0755, true);
    }
    file_put_contents($csvFile, "nome;cognome;confermato;quiz_score\n");
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
                if (count($data) >= 2) {
                    $nome = trim($data[0]);
                    $cognome = trim($data[1]);
                    $fullnameStr = strtolower($nome . ' ' . $cognome);
                    
                    if ($q === '' || strpos($fullnameStr, $q) !== false) {
                        $results[] = [
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
}

if ($method === 'POST') {
    $action = isset($_POST['action']) ? $_POST['action'] : '';
    
    if ($action === 'confirm' || $action === 'quiz') {
        $nomeTarget = isset($_POST['nome']) ? strtolower(trim($_POST['nome'])) : '';
        $cognomeTarget = isset($_POST['cognome']) ? strtolower(trim($_POST['cognome'])) : '';
        
        $rows = [];
        $updated = false;
        
        if (($handle = fopen($csvFile, "r")) !== FALSE) {
            $header = fgetcsv($handle, 1000, ";");
            if ($header === false) {
                $header = ["nome", "cognome", "confermato", "quiz_score"];
            }
            // Normalize old 'punteggio' header gracefully just in case, or write what user requested
            $header[3] = "quiz_score"; 
            $rows[] = $header;
            
            while (($data = fgetcsv($handle, 1000, ";")) !== FALSE) {
                while(count($data) < 4) {
                    $data[] = "";
                }
                
                $rowNome = strtolower(trim($data[0]));
                $rowCognome = strtolower(trim($data[1]));
                
                if ($rowNome === $nomeTarget && $rowCognome === $cognomeTarget) {
                    if ($action === 'confirm') {
                        $data[2] = isset($_POST['value']) ? trim($_POST['value']) : $data[2];
                    } else if ($action === 'quiz') {
                        $data[3] = isset($_POST['score']) ? trim($_POST['score']) : $data[3];
                    }
                    $updated = true;
                }
                $rows[] = $data;
            }
            fclose($handle);
        }
        
        if ($updated) {
            if (($handle = fopen($csvFile, "w")) !== FALSE) {
                foreach ($rows as $row) {
                    fputcsv($handle, $row, ";");
                }
                fclose($handle);
            }
            echo json_encode(["status" => "ok"]);
        } else {
            echo json_encode(["status" => "not_found"]);
        }
        exit;
    }
}

echo json_encode(["status" => "invalid_request"]);
?>
