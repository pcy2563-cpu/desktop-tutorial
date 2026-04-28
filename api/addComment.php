<?php
include 'config.php';
include 'require_admin.php';
include 'user_mute_guard.php';
include 'sensitive_words.php';
include 'behavior_logger.php';

$postId = isset($_POST['postId']) ? (int) $_POST['postId'] : 0;
$userId = isset($_POST['userId']) ? (int) $_POST['userId'] : 0;
$userId = require_user($pdo, $userId);
enforce_rate_limit($pdo, 'create_comment', 40, 600, (string) $userId);
$content = isset($_POST['content']) ? trim($_POST['content']) : '';
$imagesRaw = isset($_POST['images']) ? trim((string) $_POST['images']) : '[]';
$isAnonymous = isset($_POST['isAnonymous']) ? (int) $_POST['isAnonymous'] : 0;

$images = json_decode($imagesRaw, true);
if (!is_array($images)) {
    $images = [];
}

$images = array_values(array_filter($images, function ($item) {
    return is_string($item) && preg_match('#^/uploads/forum/#', trim($item));
}));
$images = array_slice($images, 0, 6);
$imagesJson = json_encode($images, JSON_UNESCAPED_UNICODE);
$isAnonymous = $isAnonymous === 1 ? 1 : 0;

if ($postId <= 0 || $userId <= 0 || ($content === '' && count($images) === 0)) {
    echo json_encode(['code' => 0, 'msg' => '参数缺失']);
    exit;
}

$clen = function_exists('mb_strlen') ? mb_strlen($content, 'UTF-8') : strlen($content);
if ($clen > 500) {
    echo json_encode(['code' => 0, 'msg' => '评论内容过长']);
    exit;
}

if ($content !== '') {
    $matchedWord = match_sensitive_word($content);
    if ($matchedWord !== null) {
        echo json_encode(['code' => 0, 'msg' => '评论内容包含敏感词']);
        exit;
    }
}

$chk = $pdo->prepare('SELECT id, category, title FROM forum_posts WHERE id = ? AND status = ?');
$chk->execute([$postId, 'normal']);
$postInfo = $chk->fetch(PDO::FETCH_ASSOC);
if (!$postInfo) {
    echo json_encode(['code' => 0, 'msg' => '帖子不存在']);
    exit;
}

$usr = $pdo->prepare('SELECT id FROM users WHERE id = ?');
$usr->execute([$userId]);
if (!$usr->fetch()) {
    echo json_encode(['code' => 0, 'msg' => '用户不存在']);
    exit;
}

assert_user_not_muted($pdo, $userId);

$stmt = $pdo->prepare(
    'INSERT INTO forum_comments (post_id, user_id, content, images, is_anonymous, status) VALUES (?, ?, ?, ?, ?, ?)'
);
if ($stmt->execute([$postId, $userId, $content, $imagesJson, $isAnonymous, 'normal'])) {
    $pdo->prepare('UPDATE forum_posts SET comment_count = comment_count + 1 WHERE id = ?')->execute([$postId]);
    log_behavior($pdo, [
        'user_id' => $userId,
        'behavior_type' => 'comment_post',
        'target_type' => 'post',
        'target_id' => $postId,
        'category' => $postInfo['category'] ?? null,
        'extra_data' => [
            'title' => $postInfo['title'] ?? '',
            'comment_length' => $clen,
            'comment_images_count' => count($images),
            'is_anonymous' => $isAnonymous,
        ],
    ]);
    echo json_encode(['code' => 1, 'msg' => '评论成功'], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['code' => 0, 'msg' => '评论失败'], JSON_UNESCAPED_UNICODE);
}
