<?php
include 'config.php';
include 'require_admin.php';

$adminUserId = isset($_POST['adminUserId']) ? (int) $_POST['adminUserId'] : 0;
$adminUserId = require_admin($pdo, $adminUserId);

$id = isset($_POST['id']) ? (int) $_POST['id'] : 0;
$title = isset($_POST['title']) ? trim($_POST['title']) : '';
$image = isset($_POST['image']) ? trim($_POST['image']) : '';
$linkUrl = isset($_POST['linkUrl']) ? trim($_POST['linkUrl']) : '';
$sortOrder = isset($_POST['sortOrder']) ? (int) $_POST['sortOrder'] : 0;

if ($title === '' || $image === '') {
    echo json_encode(['code' => 0, 'msg' => '请填写标题和图片']);
    exit;
}

if (strlen($image) > 500) {
    echo json_encode(['code' => 0, 'msg' => '图片地址过长']);
    exit;
}

$okImg = preg_match('#^https?://#i', $image) || preg_match('#^/uploads/#', $image);
if (!$okImg) {
    echo json_encode(['code' => 0, 'msg' => '图片须为 http(s) 链接或本站 /uploads/ 路径']);
    exit;
}

if ($linkUrl !== '' && strlen($linkUrl) > 500) {
    echo json_encode(['code' => 0, 'msg' => '链接过长']);
    exit;
}

if ($linkUrl !== '' && preg_match('#^(https?://|/)#i', $linkUrl) !== 1) {
    echo json_encode(['code' => 0, 'msg' => '链接仅支持 http(s) 或站内 / 路径'], JSON_UNESCAPED_UNICODE);
    exit;
}

$linkType = ($linkUrl !== '') ? 'webview' : 'none';
$linkUrlDb = $linkUrl !== '' ? $linkUrl : null;

if ($id > 0) {
    $stmt = $pdo->prepare(
        'UPDATE banners SET title = ?, image = ?, link_type = ?, link_url = ?, sort_order = ?, status = ? WHERE id = ?'
    );
    if ($stmt->execute([$title, $image, $linkType, $linkUrlDb, $sortOrder, 'active', $id])) {
        log_admin_action($pdo, $adminUserId, 'banner_save', 'banner', (string) $id, ['title' => $title]);
        echo json_encode(['code' => 1, 'msg' => '已保存', 'data' => ['id' => $id]], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['code' => 0, 'msg' => '保存失败']);
    }
    exit;
}

$stmt = $pdo->prepare(
    'INSERT INTO banners (title, image, link_type, link_id, link_url, sort_order, status) VALUES (?, ?, ?, NULL, ?, ?, ?)'
);
if ($stmt->execute([$title, $image, $linkType, $linkUrlDb, $sortOrder, 'active'])) {
    $newId = (int) $pdo->lastInsertId();
    log_admin_action($pdo, $adminUserId, 'banner_create', 'banner', (string) $newId, ['title' => $title]);
    echo json_encode(['code' => 1, 'msg' => '已添加', 'data' => ['id' => $newId]], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['code' => 0, 'msg' => '添加失败']);
}
