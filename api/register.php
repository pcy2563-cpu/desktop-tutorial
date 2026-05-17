<?php
include 'config.php';
require_once 'require_admin.php';

$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';
$nickname = isset($_POST['nickname']) ? trim($_POST['nickname']) : '';

enforce_rate_limit($pdo, 'register_ip', 8, 3600);
if ($phone !== '') {
    enforce_rate_limit($pdo, 'register_phone', 3, 3600, $phone);
}

if ($phone === '' || $password === '' || $nickname === '') {
    echo json_encode(['code' => 0, 'msg' => '请输入手机号、密码和昵称'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (!preg_match('/^1\d{10}$/', $phone)) {
    echo json_encode(['code' => 0, 'msg' => '请输入11位中国大陆手机号'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($phone === '19900000001') {
    echo json_encode(['code' => 0, 'msg' => '该手机号不可用'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(['code' => 0, 'msg' => '密码至少 6 位'], JSON_UNESCAPED_UNICODE);
    exit;
}

$nickLength = function_exists('mb_strlen') ? mb_strlen($nickname, 'UTF-8') : strlen($nickname);
if ($nickLength > 30) {
    echo json_encode(['code' => 0, 'msg' => '昵称最多 30 个字'], JSON_UNESCAPED_UNICODE);
    exit;
}

$pStmt = $pdo->prepare('SELECT id FROM users WHERE phone = ?');
$pStmt->execute([$phone]);
if ($pStmt->fetch()) {
    echo json_encode(['code' => 0, 'msg' => '该手机号已注册'], JSON_UNESCAPED_UNICODE);
    exit;
}

$username = 'u' . $phone;
$uStmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
$uStmt->execute([$username]);
if ($uStmt->fetch()) {
    echo json_encode(['code' => 0, 'msg' => '注册失败，请稍后再试'], JSON_UNESCAPED_UNICODE);
    exit;
}

$openid = 'web_m' . $phone;
$oStmt = $pdo->prepare('SELECT id FROM users WHERE openid = ?');
$oStmt->execute([$openid]);
if ($oStmt->fetch()) {
    echo json_encode(['code' => 0, 'msg' => '注册失败，请稍后再试'], JSON_UNESCAPED_UNICODE);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare(
    'INSERT INTO users (openid, username, password, nickname, role, phone) VALUES (?, ?, ?, ?, ?, ?)'
);
if ($stmt->execute([$openid, $username, $hash, $nickname, 'student', $phone])) {
    $userId = (int) $pdo->lastInsertId();
    $authToken = issue_user_token($pdo, $userId);
    echo json_encode([
        'code' => 1,
        'msg' => '注册成功',
        'data' => [
            'id' => $userId,
            'username' => $username,
            'nickname' => $nickname,
            'phone' => $phone,
            'avatar_url' => null,
            'role' => 'student',
            'is_muted' => 0,
            'authToken' => $authToken,
        ],
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['code' => 0, 'msg' => '注册失败'], JSON_UNESCAPED_UNICODE);
}
