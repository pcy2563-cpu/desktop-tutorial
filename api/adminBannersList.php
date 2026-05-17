<?php
include 'config.php';
include 'require_admin.php';

$adminUserId = isset($_POST['adminUserId']) ? (int) $_POST['adminUserId'] : 0;
$adminUserId = require_admin($pdo, $adminUserId);

$stmt = $pdo->query(
    'SELECT id, title, image, link_type, link_url, sort_order, status, created_at FROM banners ORDER BY sort_order ASC, id ASC'
);
echo json_encode(['code' => 1, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)], JSON_UNESCAPED_UNICODE);
