<?php
include 'config.php';
include 'require_admin.php';
include 'forum_response_helper.php';

$adminUserId = isset($_POST['adminUserId']) ? (int) $_POST['adminUserId'] : 0;
$adminUserId = require_admin($pdo, $adminUserId);

$postId = isset($_POST['postId']) ? (int) $_POST['postId'] : (isset($_GET['postId']) ? (int) $_GET['postId'] : 0);
if ($postId <= 0) {
    forum_json(['code' => 0, 'msg' => forum_u('\u53c2\u6570\u9519\u8bef')]);
}

$stmt = $pdo->prepare(
    'SELECT p.id AS post_id, p.title AS post_title, p.user_id, p.is_anonymous, p.created_at AS post_created_at,
            u.nickname, u.username, u.phone, u.role, u.is_muted, u.created_at AS user_created_at
     FROM forum_posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.id = ? AND p.status <> ?
     LIMIT 1'
);
$stmt->execute([$postId, 'deleted']);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    forum_json(['code' => 0, 'msg' => forum_u('\u5e16\u5b50\u4e0d\u5b58\u5728')]);
}

$row['post_id'] = (int) ($row['post_id'] ?? 0);
$row['user_id'] = (int) ($row['user_id'] ?? 0);
$row['is_anonymous'] = !empty($row['is_anonymous']) ? 1 : 0;
$row['is_muted'] = !empty($row['is_muted']) ? 1 : 0;

log_admin_action($pdo, $adminUserId, 'view_post_author_info', 'post', (string) $postId, [
    'is_anonymous' => $row['is_anonymous'],
    'author_user_id' => $row['user_id'],
]);

forum_json([
    'code' => 1,
    'msg' => 'ok',
    'data' => $row,
]);
