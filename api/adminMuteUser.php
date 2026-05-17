<?php
include 'config.php';
include 'require_admin.php';

$adminUserId = isset($_POST['adminUserId']) ? (int) $_POST['adminUserId'] : 0;
$adminUserId = require_admin($pdo, $adminUserId);

$userId = isset($_POST['userId']) ? (int) $_POST['userId'] : 0;
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$muted = isset($_POST['muted']) ? (int) $_POST['muted'] : -1;

if ($muted !== 0 && $muted !== 1) {
    echo json_encode(['code' => 0, 'msg' => '参数错误']);
    exit;
}

$stmt = null;
if ($userId > 0) {
    $stmt = $pdo->prepare('SELECT id, role, phone, nickname FROM users WHERE id = ?');
    $stmt->execute([$userId]);
} else {
    if (!preg_match('/^1\d{10}$/', $phone)) {
        echo json_encode(['code' => 0, 'msg' => '请输入11位手机号']);
        exit;
    }
    $stmt = $pdo->prepare('SELECT id, role, phone, nickname FROM users WHERE phone = ?');
    $stmt->execute([$phone]);
}

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['code' => 0, 'msg' => '未找到该用户']);
    exit;
}

if (($user['role'] ?? '') === 'admin') {
    echo json_encode(['code' => 0, 'msg' => '不能对管理员执行禁言']);
    exit;
}

if ((int) $user['id'] === $adminUserId) {
    echo json_encode(['code' => 0, 'msg' => '不能禁言自己']);
    exit;
}

$pdo->prepare('UPDATE users SET is_muted = ? WHERE id = ?')->execute([$muted, (int) $user['id']]);
log_admin_action($pdo, $adminUserId, $muted ? 'user_mute' : 'user_unmute', 'user', (string) $user['id'], [
    'phone' => $user['phone'] ?? '',
    'nickname' => $user['nickname'] ?? '',
]);
echo json_encode([
    'code' => 1,
    'msg' => $muted ? '已禁言' : '已解除禁言',
    'data' => [
        'id' => (int) $user['id'],
        'phone' => $user['phone'] ?? null,
        'nickname' => $user['nickname'] ?? '',
        'is_muted' => $muted,
    ],
], JSON_UNESCAPED_UNICODE);

