<?php
include 'config.php';
include 'require_admin.php';

$id = isset($_POST['id']) ? (int) $_POST['id'] : 0;
$userId = isset($_POST['userId']) ? (int) $_POST['userId'] : 0;
$userId = require_user($pdo, $userId);

if ($id <= 0 || $userId <= 0) {
    echo json_encode(['code' => 0, 'msg' => '参数不完整']);
    exit;
}

$stmt = $pdo->prepare('SELECT user_id FROM forum_posts WHERE id = ?');
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    echo json_encode(['code' => 0, 'msg' => '帖子不存在']);
    exit;
}

$actor = $pdo->prepare('SELECT role FROM users WHERE id = ?');
$actor->execute([$userId]);
$actorRow = $actor->fetch(PDO::FETCH_ASSOC);
$isAdmin = $actorRow && ($actorRow['role'] ?? '') === 'admin';

if ((int) $row['user_id'] !== $userId && !$isAdmin) {
    echo json_encode(['code' => 0, 'msg' => '只能删除自己的帖子']);
    exit;
}

$pdo->prepare('UPDATE forum_comments SET status = ? WHERE post_id = ?')->execute(['deleted', $id]);
$pdo->prepare('UPDATE forum_posts SET status = ? WHERE id = ?')->execute(['deleted', $id]);

echo json_encode(['code' => 1, 'msg' => '删除成功']);
