<?php
include 'config.php';

$userId = isset($_POST['userId']) ? (int) $_POST['userId'] : 0;
$avatar = isset($_POST['avatar']) ? trim((string) $_POST['avatar']) : '';

if ($userId <= 0 || $avatar === '') {
    echo json_encode(['code' => 0, 'msg' => '参数错误'], JSON_UNESCAPED_UNICODE);
    exit;
}

$allowedPreset = preg_match('/^preset:(jade|sky|sun|rose)$/', $avatar) === 1;
$allowedUpload = preg_match('#^/uploads/forum/#', $avatar) === 1;

if (!$allowedPreset && !$allowedUpload) {
    echo json_encode(['code' => 0, 'msg' => '头像格式不支持'], JSON_UNESCAPED_UNICODE);
    exit;
}

$stmt = $pdo->prepare('SELECT id, username, nickname, phone, role, is_muted FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['code' => 0, 'msg' => '用户不存在'], JSON_UNESCAPED_UNICODE);
    exit;
}

$pdo->prepare('UPDATE users SET avatar = ? WHERE id = ?')->execute([$avatar, $userId]);

echo json_encode([
    'code' => 1,
    'msg' => '头像已更新',
    'data' => [
        'id' => (int) $user['id'],
        'username' => $user['username'] ?? '',
        'nickname' => $user['nickname'] ?? '',
        'phone' => $user['phone'] ?? '',
        'avatar_url' => $avatar,
        'role' => $user['role'] ?? 'student',
        'is_muted' => (int) ($user['is_muted'] ?? 0),
    ],
], JSON_UNESCAPED_UNICODE);
