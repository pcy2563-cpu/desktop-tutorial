<?php
// 确保在包含 config.php 前没有输出
if (ob_get_level()) ob_clean();
include 'config.php';
require_once 'require_admin.php';

$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

enforce_rate_limit($pdo, 'login_ip', 30, 600);
if ($phone !== '') {
    enforce_rate_limit($pdo, 'login_phone', 12, 600, $phone);
}

if ($phone === '' || $password === '') {
    echo json_encode(['code' => 0, 'msg' => '请输入手机号和密码']);
    exit;
}

if (!preg_match('/^1\d{10}$/', $phone)) {
    echo json_encode(['code' => 0, 'msg' => '请输入11位中国大陆手机号']);
    exit;
}

$stmt = $pdo->prepare(
    'SELECT id, username, nickname, phone, avatar AS avatar_url, role, is_muted, password FROM users WHERE phone = ? LIMIT 1'
);
$stmt->execute([$phone]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && verify_forum_password($password, (string) ($user['password'] ?? ''))) {
    if (should_rehash_forum_password((string) ($user['password'] ?? ''))) {
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $update = $pdo->prepare('UPDATE users SET password = ? WHERE id = ?');
        $update->execute([$newHash, (int) $user['id']]);
    }

    unset($user['password']);
    $user['authToken'] = issue_user_token($pdo, (int) $user['id']);
    if (($user['role'] ?? '') === 'admin') {
        $user['adminToken'] = issue_admin_token($pdo, (int) $user['id']);
    }
    $response = json_encode(['code' => 1, 'msg' => '登录成功', 'data' => $user], JSON_UNESCAPED_UNICODE);
} else {
    $response = json_encode(['code' => 0, 'msg' => '手机号或密码错误']);
}

// 清除任何可能的输出
if (ob_get_level()) ob_clean();
echo $response;
exit;

function verify_forum_password($plain, $stored) {
    if ($stored === '') {
        return false;
    }

    $info = password_get_info($stored);
    if (!empty($info['algo'])) {
        return password_verify($plain, $stored);
    }

    if (preg_match('/^[a-f0-9]{32}$/i', $stored)) {
        return hash_equals(strtolower($stored), md5($plain));
    }

    return false;
}

function should_rehash_forum_password($stored) {
    if ($stored === '') {
        return false;
    }

    $info = password_get_info($stored);
    if (empty($info['algo'])) {
        return true;
    }

    return password_needs_rehash($stored, PASSWORD_DEFAULT);
}
