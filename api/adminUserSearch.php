<?php
include 'config.php';
include 'require_admin.php';

$adminUserId = isset($_POST['adminUserId']) ? (int) $_POST['adminUserId'] : 0;
require_admin($pdo, $adminUserId);

$keyword = isset($_POST['keyword']) ? trim($_POST['keyword']) : '';
if ($keyword === '') {
    echo json_encode(['code' => 0, 'msg' => '请输入查询关键词'], JSON_UNESCAPED_UNICODE);
    exit;
}

$like = '%' . $keyword . '%';
$idCandidate = ctype_digit($keyword) ? (int) $keyword : 0;

$stmt = $pdo->prepare(
    'SELECT id, nickname, username, phone, role, is_muted, created_at
     FROM users
     WHERE nickname LIKE ?
        OR username LIKE ?
        OR phone LIKE ?
        OR (? > 0 AND id = ?)
     ORDER BY role DESC, is_muted DESC, id DESC
     LIMIT 20'
);
$stmt->execute([$like, $like, $like, $idCandidate, $idCandidate]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'code' => 1,
    'data' => $rows,
], JSON_UNESCAPED_UNICODE);
