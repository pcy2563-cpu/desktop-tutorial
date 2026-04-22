<?php
include 'config.php';
include 'behavior_logger.php';

$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : 0;

if ($id <= 0) {
    echo json_encode(['code' => 0, 'msg' => '参数错误']);
    exit;
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
    echo json_encode(['code' => 0, 'msg' => '帖子不存在']);
    exit;
}

$idBySlug = ['study' => 1, 'life' => 2, 'used' => 3, 'secondhand' => 3, 'activity' => 4];
$slug = strtolower((string) ($post['category'] ?? ''));
$post['category_id'] = $idBySlug[$slug] ?? 0;
$post['is_anonymous'] = !empty($post['is_anonymous']) ? 1 : 0;
if ($post['is_anonymous'] === 1) {
    $post['user_nickname'] = '匿名用户';
    $post['user_avatar'] = null;
}

if ($userId > 0) {
    $likeStmt = $pdo->prepare('SELECT id FROM forum_likes WHERE user_id = ? AND post_id = ? LIMIT 1');
    $likeStmt->execute([$userId, $id]);
    $post['liked_by_me'] = $likeStmt->fetch() ? 1 : 0;
} else {
    $post['liked_by_me'] = 0;
}

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
    $comment['is_anonymous'] = !empty($comment['is_anonymous']) ? 1 : 0;
    if ($comment['is_anonymous'] === 1) {
        $comment['user_nickname'] = '匿名用户';
        $comment['user_avatar'] = null;
    }
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

echo json_encode([
    'code' => 1,
    'data' => [
        'post' => $post,
        'comments' => $comments,
    ],
], JSON_UNESCAPED_UNICODE);

