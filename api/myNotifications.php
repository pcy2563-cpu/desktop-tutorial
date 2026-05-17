<?php
include 'config.php';
include 'require_admin.php';
include 'content_center_helper.php';
include 'content_report_helper.php';

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

ensure_content_reports_table($pdo);

try {
$reportStmt = $pdo->prepare(
    "SELECT 'report' AS notify_type, r.id AS action_id, r.target_id, r.target_type,
            r.reason, r.status, r.handle_action, r.handle_note, r.handled_at AS created_at,
            CASE WHEN r.target_type = 'post' THEN r.target_id ELSE c.post_id END AS post_id,
            CASE WHEN r.target_type = 'post' THEN p.title ELSE cp.title END AS post_title,
            CASE WHEN r.target_type = 'post' THEN p.category ELSE cp.category END AS category
     FROM content_reports r
     LEFT JOIN forum_posts p ON r.target_type = 'post' AND p.id = r.target_id
     LEFT JOIN forum_comments c ON r.target_type = 'comment' AND c.id = r.target_id
     LEFT JOIN forum_posts cp ON cp.id = c.post_id
     WHERE r.reporter_user_id = ? AND r.status IN ('resolved', 'rejected')
     ORDER BY r.handled_at DESC LIMIT 20"
);
$reportStmt->execute([$userId]);
$reportRows = $reportStmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    $reportRows = [];
}

$items = [];
foreach (array_merge($replyRows, $likeRows, $reportRows) as $row) {
    $row = cc_normalize_actor($row);
    $imageCount = count(cc_parse_images($row['images'] ?? '[]', 6));
    if (($row['notify_type'] ?? '') === 'like') {
        $row['message'] = '点赞了你的帖子';
    } elseif (($row['notify_type'] ?? '') === 'report') {
        $action = (string) ($row['handle_action'] ?? '');
        $targetLabel = ($row['target_type'] ?? '') === 'post' ? '帖子' : '评论';
        $note = trim((string) ($row['handle_note'] ?? ''));
        if ($action === 'hide') {
            $row['message'] = '你举报的' . $targetLabel . '已被隐藏处理';
        } elseif ($action === 'reject') {
            $row['message'] = '你举报的' . $targetLabel . '经审核未违规';
        } else {
            $row['message'] = '你举报的' . $targetLabel . '已审核处理';
        }
        if ($note !== '') {
            $row['message'] .= '（' . $note . '）';
        }
        $row['post_id'] = (int) ($row['post_id'] ?? 0);
    } elseif (trim((string) ($row['content'] ?? '')) !== '') {
        $row['message'] = '回复了你：' . cc_summarize_text((string) $row['content'], 56);
    } elseif ($imageCount > 0) {
        $row['message'] = '回复了你的帖子，并附带图片';
    } else {
        $row['message'] = '回复了你的帖子';
    }
    $row['id'] = (int) ($row['post_id'] ?? 0);
    $row['content'] = $row['message'] ?? '';
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
