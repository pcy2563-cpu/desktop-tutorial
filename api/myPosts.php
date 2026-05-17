<?php
include 'config.php';
include 'require_admin.php';
include 'content_center_helper.php';

$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : 0;
$userId = require_user($pdo, $userId);
cc_assert_valid_user($pdo, $userId);

$stmt = $pdo->prepare(
    "SELECT p.id, p.user_id, p.title, p.content, p.images, p.category, p.is_anonymous,
            p.view_count, p.like_count AS likes, p.comment_count, p.is_top, p.created_at, p.updated_at,
            COALESCE(NULLIF(u.nickname, ''), NULLIF(u.username, ''), CONCAT('User ', p.user_id)) AS user_nickname,
            u.avatar AS user_avatar
     FROM forum_posts p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.user_id = ? AND p.status = 'normal'
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT 40"
);
$stmt->execute([$userId]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$likedMap = cc_fetch_liked_post_map($pdo, $userId, array_map(static function ($row) {
    return (int) ($row['id'] ?? 0);
}, $rows));

$items = array_map(static function ($row) use ($likedMap, $userId) {
    return cc_normalize_post_row($row, $likedMap, $userId);
}, $rows);

forum_json([
    'code' => 1,
    'msg' => 'ok',
    'data' => $items,
]);
