<?php
include 'config.php';
include 'require_admin.php';

$adminUserId = isset($_POST['adminUserId']) ? (int) $_POST['adminUserId'] : 0;
require_admin($pdo, $adminUserId);

$postId = isset($_POST['postId']) ? (int) $_POST['postId'] : 0;
if ($postId <= 0) {
    echo json_encode(['code' => 0, 'msg' => '参数错误'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt = $pdo->prepare(
    'SELECT p.id AS post_id, p.title AS post_title, p.user_id AS user_id, p.is_anonymous, p.created_at AS post_created_at,
            u.nickname, u.username, u.phone, u.role, u.is_muted, u.created_at AS user_created_at
     FROM forum_posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.id = ? AND p.status = ?
     LIMIT 1'
);
$stmt->execute([$postId, 'normal']);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    echo json_encode(['code' => 0, 'msg' => '帖子不存在'], JSON_UNESCAPED_UNICODE);
    exit;
}

$row['post_id'] = (int) ($row['post_id'] ?? 0);
$row['user_id'] = (int) ($row['user_id'] ?? 0);
$row['is_anonymous'] = !empty($row['is_anonymous']) ? 1 : 0;
$row['is_muted'] = !empty($row['is_muted']) ? 1 : 0;

echo json_encode([
    'code' => 1,
    'data' => $row,
], JSON_UNESCAPED_UNICODE);
