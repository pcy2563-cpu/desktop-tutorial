<?php
include 'config.php';
include 'require_admin.php';

$adminUserId = isset($_POST['adminUserId']) ? (int) $_POST['adminUserId'] : 0;
$adminUserId = require_admin($pdo, $adminUserId);
enforce_rate_limit($pdo, 'upload_asset', 30, 3600, (string) $adminUserId);

if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
    send_asset_response(0, '请选择要上传的资源');
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE => '文件超过服务器大小限制',
        UPLOAD_ERR_FORM_SIZE => '文件超过表单大小限制',
        UPLOAD_ERR_PARTIAL => '文件上传不完整',
        UPLOAD_ERR_NO_FILE => '没有上传文件',
        UPLOAD_ERR_NO_TMP_DIR => '服务器临时目录缺失',
        UPLOAD_ERR_CANT_WRITE => '文件写入失败',
        UPLOAD_ERR_EXTENSION => '文件被扩展拦截',
    ];
    send_asset_response(0, $errorMessages[$file['error']] ?? '上传失败');
}

$maxSize = 35 * 1024 * 1024;
if ((int) $file['size'] > $maxSize) {
    send_asset_response(0, '文件大小不能超过 35MB');
}

$tmpPath = $file['tmp_name'];
$originalName = (string) ($file['name'] ?? '');
$mimeType = detect_asset_mime_type($tmpPath, $file);
$mimeType = strtolower(trim((string) $mimeType));

$allowedMimeTypes = [
    'image/jpeg' => 'jpg',
    'image/jpg' => 'jpg',
    'image/pjpeg' => 'jpg',
    'image/jfif' => 'jpg',
    'image/png' => 'png',
    'image/x-png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
    'image/avif' => 'avif',
    'application/pdf' => 'pdf',
    'text/plain' => 'txt',
    'text/markdown' => 'md',
    'text/x-markdown' => 'md',
    'application/msword' => 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
    'application/vnd.ms-excel' => 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => 'xlsx',
    'application/vnd.ms-powerpoint' => 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation' => 'pptx',
    'text/csv' => 'csv',
];

$extension = $allowedMimeTypes[$mimeType] ?? '';
if ($extension === '') {
    $byName = strtolower((string) pathinfo($originalName, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'pdf', 'txt', 'md', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'];
    if ($byName !== '' && in_array($byName, $allowedExtensions, true)) {
        $extension = $byName === 'jpeg' ? 'jpg' : $byName;
    }
}

if ($extension === '') {
    send_asset_response(0, '当前文件类型不支持上传');
}

$subdir = date('Y/m');
$uploadRoot = dirname(__DIR__) . '/uploads/blog/assets/' . $subdir;
if (!is_dir($uploadRoot) && !mkdir($uploadRoot, 0755, true)) {
    send_asset_response(0, '无法创建资源目录');
}

$uniqueName = bin2hex(random_bytes(12)) . '.' . $extension;
$destination = $uploadRoot . '/' . $uniqueName;

$saved = save_asset_file($tmpPath, $destination, $mimeType);
if (!$saved && !move_uploaded_file($tmpPath, $destination)) {
    send_asset_response(0, '保存文件失败');
}

$publicPath = '/uploads/blog/assets/' . $subdir . '/' . $uniqueName;
$assetType = str_starts_with($mimeType, 'image/') ? 'image' : 'file';
$finalSize = is_file($destination) ? (int) filesize($destination) : (int) $file['size'];
log_admin_action($pdo, $adminUserId, 'asset_upload', 'asset', $publicPath, [
    'mime_type' => $mimeType,
    'size' => $finalSize,
    'original_name' => $originalName,
]);

send_asset_response(1, '资源上传成功', [
    'url' => $publicPath,
    'filename' => $uniqueName,
    'original_name' => $originalName,
    'mime_type' => $mimeType,
    'extension' => $extension,
    'asset_type' => $assetType,
    'size' => $finalSize,
]);

function detect_asset_mime_type(string $tmpPath, array $file): string
{
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo) {
            $mimeType = finfo_file($finfo, $tmpPath);
            finfo_close($finfo);
            if ($mimeType) {
                return (string) $mimeType;
            }
        }
    }

    if (function_exists('mime_content_type')) {
        $mimeType = mime_content_type($tmpPath);
        if ($mimeType) {
            return (string) $mimeType;
        }
    }

    return (string) ($file['type'] ?? '');
}

function save_asset_file(string $tmpPath, string $destination, string $mimeType): bool
{
    if (!extension_loaded('gd')) {
        return false;
    }

    if (!in_array($mimeType, ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/jfif', 'image/png', 'image/x-png', 'image/webp'], true)) {
        return false;
    }

    $imageInfo = @getimagesize($tmpPath);
    if (!$imageInfo || empty($imageInfo[0]) || empty($imageInfo[1])) {
        return false;
    }

    $width = (int) $imageInfo[0];
    $height = (int) $imageInfo[1];
    $maxDimension = 1800;
    $scale = min(1, $maxDimension / max($width, $height));
    $targetWidth = max(1, (int) round($width * $scale));
    $targetHeight = max(1, (int) round($height * $scale));

    switch ($mimeType) {
        case 'image/jpeg':
        case 'image/jpg':
        case 'image/pjpeg':
        case 'image/jfif':
            $source = @imagecreatefromjpeg($tmpPath);
            if (!$source) {
                return false;
            }
            $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
            imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);
            $ok = imagejpeg($canvas, $destination, 84);
            imagedestroy($source);
            imagedestroy($canvas);
            return $ok;

        case 'image/png':
        case 'image/x-png':
            $source = @imagecreatefrompng($tmpPath);
            if (!$source) {
                return false;
            }
            $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
            imagealphablending($canvas, false);
            imagesavealpha($canvas, true);
            $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
            imagefilledrectangle($canvas, 0, 0, $targetWidth, $targetHeight, $transparent);
            imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);
            $ok = imagepng($canvas, $destination, 6);
            imagedestroy($source);
            imagedestroy($canvas);
            return $ok;

        case 'image/webp':
            if (!function_exists('imagecreatefromwebp') || !function_exists('imagewebp')) {
                return false;
            }
            $source = @imagecreatefromwebp($tmpPath);
            if (!$source) {
                return false;
            }
            $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
            imagealphablending($canvas, false);
            imagesavealpha($canvas, true);
            $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
            imagefilledrectangle($canvas, 0, 0, $targetWidth, $targetHeight, $transparent);
            imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);
            $ok = imagewebp($canvas, $destination, 82);
            imagedestroy($source);
            imagedestroy($canvas);
            return $ok;
    }

    return false;
}

function send_asset_response(int $code, string $message, ?array $data = null): void
{
    while (ob_get_level()) {
        ob_end_clean();
    }

    header('Content-Type: application/json; charset=utf-8');
    $response = ['code' => $code, 'msg' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
