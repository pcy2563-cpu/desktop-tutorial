<?php
include 'config.php';
include 'require_admin.php';
include 'user_mute_guard.php';
include 'sensitive_words.php';
include 'behavior_logger.php';

$userId = isset($_POST['userId']) ? (int) $_POST['userId'] : 0;
$userId = require_user($pdo, $userId);
enforce_rate_limit($pdo, 'create_post', 20, 600, (string) $userId);
$title = isset($_POST['title']) ? trim($_POST['title']) : '';
$content = isset($_POST['content']) ? trim($_POST['content']) : '';
$categoryId = isset($_POST['categoryId']) ? (int) $_POST['categoryId'] : 0;
$imagesRaw = isset($_POST['images']) ? trim($_POST['images']) : '';
$isAnonymous = isset($_POST['isAnonymous']) ? (int) $_POST['isAnonymous'] : 0;

$slugByCatId = [
    1 => 'study',
    2 => 'life',
    3 => 'used',
    4 => 'activity',
];

if ($userId <= 0) {
    echo json_encode(['code' => 0, 'msg' => '参数不完整']);
    exit;
}

$imageUrls = [];
if ($imagesRaw !== '') {
    $decoded = json_decode($imagesRaw, true);
    if (!is_array($decoded)) {
        echo json_encode(['code' => 0, 'msg' => '图片数据格式错误']);
        exit;
    }
    $forumDir = dirname(__DIR__) . '/uploads/forum';
    if (!is_dir($forumDir)) {
        mkdir($forumDir, 0755, true);
    }
    $forumBase = realpath($forumDir);
    foreach (array_slice($decoded, 0, 9) as $u) {
        if (!is_string($u)) {
            continue;
        }
        $u = trim($u);
        if (strlen($u) > 500 || strpos($u, '..') !== false || $u[0] !== '/') {
            continue;
        }
        if (!preg_match('#^/uploads/forum/\d{4}/\d{2}/#', $u)) {
            continue;
        }
        $full = realpath(dirname(__DIR__) . $u);
        if ($forumBase && $full && str_starts_with($full, $forumBase) && is_file($full)) {
            $imageUrls[] = $u;
        }
    }
}

if ($content === '' && count($imageUrls) === 0) {
    echo json_encode(['code' => 0, 'msg' => '请填写正文或至少上传一张图片']);
    exit;
}

if ($title === '') {
    $title = generate_post_title($content, count($imageUrls));
}

$matchedWord = match_sensitive_word($title . "\n" . $content);
if ($matchedWord !== null) {
    echo json_encode(['code' => 0, 'msg' => '内容包含敏感词，请修改后再发布']);
    exit;
}

$tlen = function_exists('mb_strlen') ? mb_strlen($title, 'UTF-8') : strlen($title);
if ($tlen > 100) {
    echo json_encode(['code' => 0, 'msg' => '标题过长']);
    exit;
}

$clen = function_exists('mb_strlen') ? mb_strlen($content, 'UTF-8') : strlen($content);
if ($clen > 2000) {
    echo json_encode(['code' => 0, 'msg' => '内容过长']);
    exit;
}

$slug = $slugByCatId[$categoryId] ?? 'life';

$usr = $pdo->prepare('SELECT id FROM users WHERE id = ?');
$usr->execute([$userId]);
if (!$usr->fetch()) {
    echo json_encode(['code' => 0, 'msg' => '用户无效']);
    exit;
}

assert_user_not_muted($pdo, $userId);

$imagesJson = count($imageUrls) ? json_encode($imageUrls, JSON_UNESCAPED_UNICODE) : null;
$contentDb = $content === '' ? null : $content;
$isAnonymous = $isAnonymous === 1 ? 1 : 0;

$stmt = $pdo->prepare(
    'INSERT INTO forum_posts (user_id, title, content, images, category, is_anonymous, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
);
if ($stmt->execute([$userId, $title, $contentDb, $imagesJson, $slug, $isAnonymous, 'normal'])) {
    $postId = (int) $pdo->lastInsertId();
    log_behavior($pdo, [
        'user_id' => $userId,
        'behavior_type' => 'create_post',
        'target_type' => 'post',
        'target_id' => $postId,
        'category' => $slug,
        'extra_data' => [
            'title' => $title,
            'image_count' => count($imageUrls),
            'is_anonymous' => $isAnonymous,
        ],
    ]);
    echo json_encode(['code' => 1, 'msg' => '发布成功', 'data' => ['id' => $postId]]);
} else {
    echo json_encode(['code' => 0, 'msg' => '发布失败']);
}

function text_length($value) {
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function text_slice($value, $start, $length) {
    return function_exists('mb_substr')
        ? mb_substr($value, $start, $length, 'UTF-8')
        : substr($value, $start, $length);
}

function generate_post_title($content, $imageCount) {
    $plain = preg_replace('/\s+/u', ' ', trim((string) $content));
    if ($plain !== '') {
        $limit = 24;
        if (text_length($plain) > $limit) {
            return text_slice($plain, 0, $limit) . '...';
        }
        return $plain;
    }

    return $imageCount > 1 ? '图片帖子' : '图片动态';
}

