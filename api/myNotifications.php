<?php
include 'config.php';
include 'require_admin.php';
include 'content_center_helper.php';

$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : 0;
$userId = require_user($pdo, $userId);
cc_assert_valid_user($pdo, $userId);

$replyStmt = $pdo->prepare(
    "SELECT 'reply' AS notify_type,
            c.id AS action_id,
            c.post_id,
            c.user_id,
            c.content,
            c.images,
            c.is_anonymous,
            c.created_at,
            p.title AS post_title,
            p.category,
            COALESCE(NULLIF(u.nickname, ''), NULLIF(u.username, ''), CONCAT('用户', c.user_id)) AS user_nickname,
            u.avatar AS user_avatar
     FROM forum_comments c
     INNER JOIN forum_posts p ON p.id = c.post_id
     LEFT JOIN users u ON u.id = c.user_id
     WHERE p.user_id = ?
       AND c.user_id <> ?
       AND p.status = 'normal'
       AND c.status = 'normal'
     ORDER BY c.created_at DESC, c.id DESC
     LIMIT 40"
);
$replyStmt->execute([$userId, $userId]);
$replyRows = $replyStmt->fetchAll(PDO::FETCH_ASSOC);

$likeStmt = $pdo->prepare(
    "SELECT 'like' AS notify_type,
            l.id AS action_id,
            l.post_id,
            l.user_id,
            '' AS content,
            '[]' AS images,
            0 AS is_anonymous,
            l.created_at,
            p.title AS post_title,
            p.category,
            COALESCE(NULLIF(u.nickname, ''), NULLIF(u.username, ''), CONCAT('用户', l.user_id)) AS user_nickname,
            u.avatar AS user_avatar
     FROM forum_likes l
     INNER JOIN forum_posts p ON p.id = l.post_id
     LEFT JOIN users u ON u.id = l.user_id
     WHERE p.user_id = ?
       AND l.user_id <> ?
       AND p.status = 'normal'
     ORDER BY l.created_at DESC, l.id DESC
     LIMIT 40"
);
$likeStmt->execute([$userId, $userId]);
$likeRows = $likeStmt->fetchAll(PDO::FETCH_ASSOC);

$items = [];
foreach (array_merge($replyRows, $likeRows) as $row) {
    $row = cc_normalize_actor($row);
    $imageCount = count(cc_parse_images($row['images'] ?? '[]', 6));
    if (($row['notify_type'] ?? '') === 'like') {
        $row['message'] = '点赞了你的帖子';
    } elseif (trim((string) ($row['content'] ?? '')) !== '') {
        $row['message'] = '回复了你：' . cc_summarize_text((string) $row['content'], 56);
    } elseif ($imageCount > 0) {
        $row['message'] = '回复了你的帖子，并附带图片';
    } else {
        $row['message'] = '回复了你的帖子';
    }
    $items[] = $row;
}

usort($items, static function (array $a, array $b): int {
    return strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? ''));
});

$items = array_slice($items, 0, 50);

echo json_encode([
    'code' => 1,
    'data' => $items,
], JSON_UNESCAPED_UNICODE);
