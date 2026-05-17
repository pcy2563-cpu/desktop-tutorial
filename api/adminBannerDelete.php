<?php
include 'config.php';
include 'require_admin.php';

$adminUserId = isset($_POST['adminUserId']) ? (int) $_POST['adminUserId'] : 0;
$adminUserId = require_admin($pdo, $adminUserId);

$id = isset($_POST['id']) ? (int) $_POST['id'] : 0;
if ($id <= 0) {
    echo json_encode(['code' => 0, 'msg' => '参数错误']);
    exit;
}

$stmt = $pdo->prepare('SELECT image FROM banners WHERE id = ? LIMIT 1');
$stmt->execute([$id]);
$banner = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$banner) {
    echo json_encode(['code' => 0, 'msg' => '轮播不存在']);
    exit;
}

$image = isset($banner['image']) ? trim((string) $banner['image']) : '';
$pdo->prepare('DELETE FROM banners WHERE id = ?')->execute([$id]);
log_admin_action($pdo, $adminUserId, 'banner_delete', 'banner', (string) $id, ['image' => $image]);

$deletedFile = false;
if ($image !== '' && preg_match('#^/uploads/#', $image)) {
    $safePath = dirname(__DIR__) . $image;
    $real = realpath($safePath);
    $uploadsRoot = realpath(dirname(__DIR__) . '/uploads');
    if ($real && $uploadsRoot && str_starts_with($real, $uploadsRoot) && is_file($real)) {
        $checkBanner = $pdo->prepare('SELECT COUNT(*) FROM banners WHERE image = ?');
        $checkBanner->execute([$image]);
        $bannerRefs = (int) $checkBanner->fetchColumn();

        $checkPost = $pdo->prepare('SELECT COUNT(*) FROM forum_posts WHERE images LIKE ?');
        $checkPost->execute(['%"' . $image . '"%']);
        $postRefs = (int) $checkPost->fetchColumn();

        if ($bannerRefs === 0 && $postRefs === 0) {
            $deletedFile = @unlink($real);
        }
    }
}

echo json_encode([
    'code' => 1,
    'msg' => $deletedFile ? '已删除轮播并清理图片' : '已删除轮播',
]);

