<?php
include 'config.php';
include 'content_center_helper.php';

$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : 0;
cc_assert_valid_user($pdo, $userId);

$postSummaryStmt = $pdo->prepare(
    "SELECT COUNT(*) AS post_count,
            COALESCE(SUM(view_count), 0) AS total_views,
            COALESCE(SUM(like_count), 0) AS total_likes,
            COALESCE(SUM(comment_count), 0) AS total_comments,
            MAX(created_at) AS latest_post_at
     FROM forum_posts
     WHERE user_id = ? AND status = 'normal'"
);
$postSummaryStmt->execute([$userId]);
$postSummary = $postSummaryStmt->fetch(PDO::FETCH_ASSOC) ?: [];

$replyCountStmt = $pdo->prepare(
    "SELECT COUNT(*) AS total
     FROM forum_comments c
     INNER JOIN forum_posts p ON p.id = c.post_id
     WHERE p.user_id = ?
       AND c.user_id <> ?
       AND p.status = 'normal'
       AND c.status = 'normal'"
);
$replyCountStmt->execute([$userId, $userId]);
$replyCount = (int) $replyCountStmt->fetchColumn();

$likedCountStmt = $pdo->prepare(
    "SELECT COUNT(*) AS total
     FROM forum_likes l
     INNER JOIN forum_posts p ON p.id = l.post_id
     WHERE l.user_id = ?
       AND p.status = 'normal'"
);
$likedCountStmt->execute([$userId]);
$likedCount = (int) $likedCountStmt->fetchColumn();

$featuredCountStmt = $pdo->query(
    "SELECT COUNT(*) AS total
     FROM forum_posts
     WHERE status = 'normal'
       AND (
         is_top = 1
         OR like_count >= 2
         OR comment_count >= 2
         OR view_count >= 50
       )"
);
$featuredCount = (int) $featuredCountStmt->fetchColumn();

$likeReceivedCountStmt = $pdo->prepare(
    "SELECT COUNT(*) AS total
     FROM forum_likes l
     INNER JOIN forum_posts p ON p.id = l.post_id
     WHERE p.user_id = ?
       AND l.user_id <> ?
       AND p.status = 'normal'"
);
$likeReceivedCountStmt->execute([$userId, $userId]);
$likeReceivedCount = (int) $likeReceivedCountStmt->fetchColumn();

$summary = [
    'post_count' => (int) ($postSummary['post_count'] ?? 0),
    'reply_count' => $replyCount,
    'liked_count' => $likedCount,
    'featured_count' => $featuredCount,
    'notification_count' => $replyCount + $likeReceivedCount,
    'received_like_count' => $likeReceivedCount,
    'total_views' => (int) ($postSummary['total_views'] ?? 0),
    'total_likes' => (int) ($postSummary['total_likes'] ?? 0),
    'total_comments' => (int) ($postSummary['total_comments'] ?? 0),
    'engagement_score' => (int) round(
        ((float) ($postSummary['total_likes'] ?? 0) * 2)
        + ((float) ($postSummary['total_comments'] ?? 0) * 3)
        + ((float) ($postSummary['total_views'] ?? 0) * 0.05)
    ),
    'latest_post_at' => $postSummary['latest_post_at'] ?? null,
];

echo json_encode([
    'code' => 1,
    'data' => $summary,
], JSON_UNESCAPED_UNICODE);
