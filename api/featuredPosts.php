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
            COALESCE(NULLIF(u.nickname, ''), NULLIF(u.username, ''), CONCAT('User ', p.user_id)) AS user_nickname,
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

$items = array_map(static function ($row) use ($likedMap, $userId) {
    $row = cc_normalize_post_row($row, $likedMap, $userId);
    $likes = (int) ($row['likes'] ?? 0);
    $comments = (int) ($row['comment_count'] ?? 0);
    $views = (int) ($row['view_count'] ?? 0);

    if ((int) ($row['is_top'] ?? 0) === 1) {
        $row['featured_reason'] = forum_u('\u7ad9\u5185\u7f6e\u9876\u5185\u5bb9\uff0c\u9002\u5408\u4f5c\u4e3a\u9996\u9875\u91cd\u70b9\u5c55\u793a');
    } elseif ($comments >= 3) {
        $row['featured_reason'] = forum_u('\u8bc4\u8bba\u4e92\u52a8\u6d3b\u8dc3\uff0c\u8ba8\u8bba\u70ed\u5ea6\u8f83\u9ad8');
    } elseif ($likes >= 4) {
        $row['featured_reason'] = forum_u('\u70b9\u8d5e\u8868\u73b0\u7a81\u51fa\uff0c\u7528\u6237\u8ba4\u53ef\u5ea6\u8f83\u9ad8');
    } elseif ($views >= 120) {
        $row['featured_reason'] = forum_u('\u6d4f\u89c8\u91cf\u8f83\u9ad8\uff0c\u5177\u5907\u8f83\u5f3a\u5173\u6ce8\u5ea6');
    } else {
        $row['featured_reason'] = forum_u('\u7efc\u5408\u70ed\u5ea6\u548c\u65f6\u6548\u6027\u8fdb\u5165\u7cbe\u9009');
    }

    $row['feature_score'] = round((float) ($row['feature_score'] ?? 0), 2);
    return $row;
}, $rows);

forum_json([
    'code' => 1,
    'msg' => 'ok',
    'data' => $items,
]);
