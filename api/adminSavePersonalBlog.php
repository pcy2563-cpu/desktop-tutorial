<?php
include 'config.php';
include 'require_admin.php';
include 'personal_blog_helper.php';

$adminUserId = isset($_POST['adminUserId']) ? (int) $_POST['adminUserId'] : 0;
$adminUserId = require_admin($pdo, $adminUserId);

$payloadRaw = isset($_POST['payload']) ? trim((string) $_POST['payload']) : '';
if ($payloadRaw === '') {
    echo json_encode(['code' => 0, 'msg' => '请提交博客内容'], JSON_UNESCAPED_UNICODE);
    exit;
}

$decoded = json_decode($payloadRaw, true);
if (!is_array($decoded)) {
    echo json_encode(['code' => 0, 'msg' => '博客内容格式不正确'], JSON_UNESCAPED_UNICODE);
    exit;
}

$saved = save_personal_blog_payload($pdo, $decoded);
log_admin_action($pdo, $adminUserId, 'personal_blog_save', 'personal_blog', 'content');

echo json_encode([
    'code' => 1,
    'msg' => '个人博客已更新',
    'data' => $saved,
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
