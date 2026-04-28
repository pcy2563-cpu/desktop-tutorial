<?php
include 'config.php';
include 'require_admin.php';
include 'behavior_logger.php';

$postId = isset($_POST['postId']) ? (int) $_POST['postId'] : 0;
$userId = isset($_POST['userId']) ? (int) $_POST['userId'] : 0;
$userId = require_user($pdo, $userId);
enforce_rate_limit($pdo, 'toggle_like', 120, 600, (string) $userId);

if ($postId <= 0 || $userId <= 0) {
    echo json_encode(['code' => 0, 'msg' => 'Invalid parameters']);
    exit;
}

$usr = $pdo->prepare('SELECT id FROM users WHERE id = ?');
$usr->execute([$userId]);
if (!$usr->fetch()) {
    echo json_encode(['code' => 0, 'msg' => 'Invalid user']);
    exit;
}

$postStmt = $pdo->prepare('SELECT id, category, title FROM forum_posts WHERE id = ? AND status = ?');
$postStmt->execute([$postId, 'normal']);
$postInfo = $postStmt->fetch(PDO::FETCH_ASSOC);
if (!$postInfo) {
    echo json_encode(['code' => 0, 'msg' => 'Post not found']);
    exit;
}

$pdo->beginTransaction();
try {
    $likeStmt = $pdo->prepare('SELECT id FROM forum_likes WHERE user_id = ? AND post_id = ? LIMIT 1');
    $likeStmt->execute([$userId, $postId]);
    $exists = $likeStmt->fetch(PDO::FETCH_ASSOC);

    if ($exists) {
        $pdo->prepare('DELETE FROM forum_likes WHERE id = ?')->execute([(int) $exists['id']]);
        $pdo->prepare('UPDATE forum_posts SET like_count = IF(like_count > 0, like_count - 1, 0) WHERE id = ?')->execute([$postId]);
        $liked = 0;
    } else {
        $pdo->prepare('INSERT INTO forum_likes (user_id, post_id, comment_id) VALUES (?, ?, NULL)')->execute([$userId, $postId]);
        $pdo->prepare('UPDATE forum_posts SET like_count = like_count + 1 WHERE id = ?')->execute([$postId]);
        $liked = 1;
    }

    $countStmt = $pdo->prepare('SELECT like_count FROM forum_posts WHERE id = ?');
    $countStmt->execute([$postId]);
    $likeCount = (int) $countStmt->fetchColumn();

    $pdo->commit();
    log_behavior($pdo, [
        'user_id' => $userId,
        'behavior_type' => $liked ? 'like_post' : 'unlike_post',
        'target_type' => 'post',
        'target_id' => $postId,
        'category' => $postInfo['category'] ?? null,
        'extra_data' => [
            'title' => $postInfo['title'] ?? '',
        ],
    ]);
    echo json_encode([
        'code' => 1,
        'msg' => $liked ? 'Liked' : 'Unliked',
        'data' => [
            'liked' => $liked,
            'like_count' => $likeCount,
        ],
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['code' => 0, 'msg' => 'Like action failed']);
}
