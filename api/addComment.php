<?php
include 'config.php';
include 'require_admin.php';
include 'user_mute_guard.php';
include 'sensitive_words.php';
include 'behavior_logger.php';
include 'forum_response_helper.php';

$postId = isset($_POST['postId']) ? (int) $_POST['postId'] : 0;
$userId = isset($_POST['userId']) ? (int) $_POST['userId'] : 0;
$userId = require_user($pdo, $userId);
enforce_rate_limit($pdo, 'create_comment', 40, 600, (string) $userId);

$content = isset($_POST['content']) ? trim($_POST['content']) : '';
$imagesRaw = isset($_POST['images']) ? trim((string) $_POST['images']) : '[]';
$isAnonymous = isset($_POST['isAnonymous']) ? (int) $_POST['isAnonymous'] : 0;

$images = forum_parse_images($imagesRaw, 6);
$imagesJson = json_encode($images, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$isAnonymous = $isAnonymous === 1 ? 1 : 0;

if ($postId <= 0 || $userId <= 0 || ($content === '' && count($images) === 0)) {
    forum_json(['code' => 0, 'msg' => forum_u('\u53c2\u6570\u7f3a\u5931')]);
}

$clen = function_exists('mb_strlen') ? mb_strlen($content, 'UTF-8') : strlen($content);
if ($clen > 500) {
    forum_json(['code' => 0, 'msg' => forum_u('\u8bc4\u8bba\u5185\u5bb9\u8fc7\u957f')]);
}

if ($content !== '') {
    $matchedWord = match_sensitive_word($content);
    if ($matchedWord !== null) {
        forum_json(['code' => 0, 'msg' => forum_u('\u8bc4\u8bba\u5185\u5bb9\u5305\u542b\u654f\u611f\u8bcd')]);
    }
}

$chk = $pdo->prepare('SELECT id, category, title FROM forum_posts WHERE id = ? AND status = ?');
$chk->execute([$postId, 'normal']);
$postInfo = $chk->fetch(PDO::FETCH_ASSOC);
if (!$postInfo) {
    forum_json(['code' => 0, 'msg' => forum_u('\u5e16\u5b50\u4e0d\u5b58\u5728')]);
}

$usr = $pdo->prepare('SELECT id FROM users WHERE id = ?');
$usr->execute([$userId]);
if (!$usr->fetch()) {
    forum_json(['code' => 0, 'msg' => forum_u('\u7528\u6237\u4e0d\u5b58\u5728')]);
}

assert_user_not_muted($pdo, $userId);

$stmt = $pdo->prepare(
    'INSERT INTO forum_comments (post_id, user_id, content, images, is_anonymous, status) VALUES (?, ?, ?, ?, ?, ?)'
);
if ($stmt->execute([$postId, $userId, $content, $imagesJson, $isAnonymous, 'normal'])) {
    $commentId = (int) $pdo->lastInsertId();
    $pdo->prepare('UPDATE forum_posts SET comment_count = comment_count + 1 WHERE id = ?')->execute([$postId]);
    log_behavior($pdo, [
        'user_id' => $userId,
        'behavior_type' => 'comment_post',
        'target_type' => 'post',
        'target_id' => $postId,
        'category' => $postInfo['category'] ?? null,
        'extra_data' => [
            'title' => $postInfo['title'] ?? '',
            'comment_id' => $commentId,
            'comment_length' => $clen,
            'comment_images_count' => count($images),
            'is_anonymous' => $isAnonymous,
        ],
    ]);
    forum_json(['code' => 1, 'msg' => forum_u('\u8bc4\u8bba\u6210\u529f'), 'data' => ['id' => $commentId]]);
}

forum_json(['code' => 0, 'msg' => forum_u('\u8bc4\u8bba\u5931\u8d25')]);
