<?php
include 'config.php';
include 'require_admin.php';
include 'behavior_logger.php';
include 'forum_response_helper.php';

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : 0;
if ($userId > 0) {
    $userId = require_user($pdo, $userId);
}

if ($id <= 0) {
    forum_json(['code' => 0, 'msg' => forum_u('\u53c2\u6570\u9519\u8bef')]);
}

$skipView = isset($_GET['skipView']) && $_GET['skipView'] === '1';
if (!$skipView) {
    $pdo->prepare('UPDATE forum_posts SET view_count = view_count + 1 WHERE id = ? AND status = ?')->execute([$id, 'normal']);
}

$stmt = $pdo->prepare(
    'SELECT p.id, p.user_id, p.title, p.content, p.images, p.category, p.is_anonymous, p.view_count, p.like_count AS likes,
            p.comment_count, p.is_top, p.created_at, p.updated_at,
            u.nickname AS user_nickname, u.avatar AS user_avatar
     FROM forum_posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.id = ? AND p.status = ?'
);
$stmt->execute([$id, 'normal']);
$post = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$post) {
    forum_json(['code' => 0, 'msg' => forum_u('\u5e16\u5b50\u4e0d\u5b58\u5728')]);
}

$slug = strtolower((string) ($post['category'] ?? ''));
$likedMap = [];
if ($userId > 0) {
    $likeStmt = $pdo->prepare('SELECT id FROM forum_likes WHERE user_id = ? AND post_id = ? LIMIT 1');
    $likeStmt->execute([$userId, $id]);
    if ($likeStmt->fetch()) {
        $likedMap[$id] = 1;
    }
}
$post = forum_public_post($post, $userId, $likedMap);

$cstmt = $pdo->prepare(
    'SELECT c.id, c.post_id, c.user_id, c.parent_id, c.content, c.images, c.is_anonymous, c.like_count, c.created_at,
            u.nickname AS user_nickname, u.avatar AS user_avatar
     FROM forum_comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.post_id = ? AND c.status = ?
     ORDER BY c.created_at ASC'
);
$cstmt->execute([$id, 'normal']);
$comments = $cstmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($comments as &$comment) {
    $comment = forum_public_comment($comment, $userId);
}
unset($comment);

if (!$skipView && $userId > 0) {
    log_behavior($pdo, [
        'user_id' => $userId,
        'behavior_type' => 'view_post',
        'target_type' => 'post',
        'target_id' => $id,
        'category' => $slug,
        'extra_data' => [
            'title' => $post['title'] ?? '',
        ],
    ]);
}

forum_json([
    'code' => 1,
    'msg' => 'ok',
    'data' => [
        'post' => $post,
        'comments' => $comments,
    ],
]);
