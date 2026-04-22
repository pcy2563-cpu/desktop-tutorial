<?php
include 'config.php';
include 'content_center_helper.php';

$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : 0;
cc_assert_valid_user($pdo, $userId);

$stmt = $pdo->prepare(
    "SELECT c.id AS comment_id, c.post_id, c.user_id, c.content, c.images, c.is_anonymous, c.created_at,
            p.title AS post_title, p.category, p.images AS post_images, p.content AS post_content,
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
     LIMIT 50"
);
$stmt->execute([$userId, $userId]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$items = array_map(static function ($row) {
    $row = cc_normalize_actor($row);
    $imageCount = count(cc_parse_images($row['images'] ?? '[]', 6));
    $content = trim((string) ($row['content'] ?? ''));
    if ($content !== '') {
        $row['reply_preview'] = cc_summarize_text($content, 72);
    } elseif ($imageCount > 0) {
        $row['reply_preview'] = '发布了图片评论';
    } else {
        $row['reply_preview'] = '发布了新的评论';
    }
    $row['post_preview'] = cc_summarize_text((string) ($row['post_content'] ?? ''), 80);
    $row['image_count'] = $imageCount;
    return $row;
}, $rows);

echo json_encode([
    'code' => 1,
    'data' => $items,
], JSON_UNESCAPED_UNICODE);
