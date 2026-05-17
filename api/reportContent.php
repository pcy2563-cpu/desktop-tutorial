<?php
include 'config.php';
include 'require_admin.php';
include 'forum_response_helper.php';
include 'content_report_helper.php';

$userId = isset($_POST['userId']) ? (int) $_POST['userId'] : 0;
$userId = require_user($pdo, $userId);
enforce_rate_limit($pdo, 'report_content', 20, 3600, (string) $userId);

$targetType = isset($_POST['targetType']) ? strtolower(trim((string) $_POST['targetType'])) : '';
$targetId = isset($_POST['targetId']) ? (int) $_POST['targetId'] : 0;
$reason = normalize_report_reason((string) ($_POST['reason'] ?? 'other'));
$detail = trim((string) ($_POST['detail'] ?? ''));

if (!in_array($targetType, ['post', 'comment'], true) || $targetId <= 0) {
    forum_json(['code' => 0, 'msg' => forum_u('\u53c2\u6570\u9519\u8bef')]);
}
if (function_exists('mb_strlen') ? mb_strlen($detail, 'UTF-8') > 300 : strlen($detail) > 300) {
    forum_json(['code' => 0, 'msg' => forum_u('\u8865\u5145\u8bf4\u660e\u8fc7\u957f')]);
}

if ($targetType === 'post') {
    $exists = $pdo->prepare("SELECT id FROM forum_posts WHERE id = ? AND status = 'normal' LIMIT 1");
} else {
    $exists = $pdo->prepare("SELECT id FROM forum_comments WHERE id = ? AND status = 'normal' LIMIT 1");
}
$exists->execute([$targetId]);
if (!$exists->fetch()) {
    forum_json(['code' => 0, 'msg' => forum_u('\u5185\u5bb9\u4e0d\u5b58\u5728\u6216\u5df2\u5904\u7406')]);
}

ensure_content_reports_table($pdo);
$dup = $pdo->prepare(
    "SELECT id FROM content_reports
     WHERE target_type = ? AND target_id = ? AND reporter_user_id = ? AND status = 'pending'
     LIMIT 1"
);
$dup->execute([$targetType, $targetId, $userId]);
if ($dup->fetch()) {
    forum_json(['code' => 1, 'msg' => forum_u('\u5df2\u6536\u5230\u4f60\u7684\u4e3e\u62a5')]);
}

$stmt = $pdo->prepare(
    'INSERT INTO content_reports (target_type, target_id, reporter_user_id, reason, detail)
     VALUES (?, ?, ?, ?, ?)'
);
$stmt->execute([$targetType, $targetId, $userId, $reason, $detail !== '' ? $detail : null]);

forum_json([
    'code' => 1,
    'msg' => forum_u('\u4e3e\u62a5\u5df2\u63d0\u4ea4'),
    'data' => ['id' => (int) $pdo->lastInsertId()],
]);
