<?php
header('Content-Type: application/json; charset=utf-8');
include 'config.php';

$stmt = $pdo->query(
    "SELECT id, title, image, link_url FROM banners WHERE status = 'active' ORDER BY sort_order ASC, id ASC"
);
echo json_encode(['code' => 1, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
