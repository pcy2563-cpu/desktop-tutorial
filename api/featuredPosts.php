<?php
include 'config.php';
include 'require_admin.php';
include 'content_center_helper.php';

$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : 0;
if ($userId > 0) {
    $userId = require_user($pdo, $userId);
    cc_assert_valid_user($pdo, $userId);
}

$stmt = $pdo->query(
    "SELECT p.id, p.user_id, p.title, p.content, p.images, p.category, p.is_anonymous,
            p.view_count, p.like_count AS likes, p.comment_count, p.is_top, p.created_at, p.updated_at,
            COALESCE(NULLIF(u.nickname, ''), NULLIF(u.username, ''), CONCAT('用户', p.user_id)) AS user_nickname,
            u.avatar AS user_avatar,
            (
                (CASE WHEN p.is_top = 1 THEN 24 ELSE 0 END)
                + LEAST(120, p.like_count * 4 + p.comment_count * 6 + p.view_count * 0.06)
                + GREATEST(0, 24 - TIMESTAMPDIFF(HOUR, p.created_at, NOW()) / 8)
            ) AS feature_score
     FROM forum_posts p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.status = 'normal'
       AND (
         p.is_top = 1
         OR p.like_count >= 2
         OR p.comment_count >= 2
         OR p.view_count >= 50
       )
     ORDER BY p.is_top DESC, feature_score DESC, p.created_at DESC
     LIMIT 24"
);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$likedMap = cc_fetch_liked_post_map($pdo, $userId, array_map(static function ($row) {
    return (int) ($row['id'] ?? 0);
}, $rows));

$items = array_map(static function ($row) use ($likedMap) {
    $row = cc_normalize_post_row($row, $likedMap);
    $likes = (int) ($row['likes'] ?? 0);
    $comments = (int) ($row['comment_count'] ?? 0);
    $views = (int) ($row['view_count'] ?? 0);

    if ((int) ($row['is_top'] ?? 0) === 1) {
        $row['featured_reason'] = '站内置顶内容，适合作为首页重点展示';
    } elseif ($comments >= 3) {
        $row['featured_reason'] = '评论互动活跃，讨论热度较高';
    } elseif ($likes >= 4) {
        $row['featured_reason'] = '点赞表现突出，用户认可度较高';
    } elseif ($views >= 120) {
        $row['featured_reason'] = '浏览量较高，具备较强关注度';
    } else {
        $row['featured_reason'] = '综合热度和时效性后进入精选';
    }

    $row['feature_score'] = round((float) ($row['feature_score'] ?? 0), 2);
    return $row;
}, $rows);

echo json_encode([
    'code' => 1,
    'data' => $items,
], JSON_UNESCAPED_UNICODE);
