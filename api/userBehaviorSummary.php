<?php
include 'config.php';
include 'require_admin.php';
include 'behavior_insights.php';

$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : 0;
$userId = require_user($pdo, $userId);

if ($userId <= 0) {
    echo json_encode(['code' => 0, 'msg' => "\u{53C2}\u{6570}\u{9519}\u{8BEF}"]);
    exit;
}

$stmt = $pdo->prepare('SELECT id, nickname, role FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['code' => 0, 'msg' => "\u{7528}\u{6237}\u{4E0D}\u{5B58}\u{5728}"]);
    exit;
}

echo json_encode([
    'code' => 1,
    'data' => [
        'user' => $user,
        'summary' => get_user_behavior_snapshot($pdo, $userId, 120),
    ],
], JSON_UNESCAPED_UNICODE);
