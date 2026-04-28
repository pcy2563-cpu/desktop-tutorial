<?php
include 'config.php';
include 'require_admin.php';

$debug = isset($_GET['debug']) || isset($_POST['debug']);

$userId = isset($_POST['userId']) ? (int) $_POST['userId'] : 0;
$userId = require_user($pdo, $userId);
enforce_rate_limit($pdo, 'upload_image', 40, 3600, (string) $userId);
if ($userId <= 0) {
    sendResponse(0, 'Not logged in');
}

$chk = $pdo->prepare('SELECT id FROM users WHERE id = ?');
$chk->execute([$userId]);
if (!$chk->fetch()) {
    sendResponse(0, 'Invalid user');
}

if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
    sendResponse(0, 'Please choose an image');
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE => 'File exceeds server limit',
        UPLOAD_ERR_FORM_SIZE => 'File exceeds form limit',
        UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
        UPLOAD_ERR_NO_FILE => 'No file uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Temporary directory missing',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file',
        UPLOAD_ERR_EXTENSION => 'Upload blocked by extension',
    ];
    sendResponse(0, $errorMessages[$file['error']] ?? ('Upload failed: ' . $file['error']));
}

$maxSize = 20 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    sendResponse(0, 'Image must be 20MB or smaller');
}

$tmpPath = $file['tmp_name'];
$originalName = $file['name'];
$originalSize = (int) $file['size'];

if ($debug) {
    error_log("upload debug: name={$originalName}, size={$originalSize}, tmp={$tmpPath}");
}

$mimeType = detectMimeType($tmpPath, $file);
$mimeType = strtolower(trim((string) $mimeType));

$allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/pjpeg', 'image/jfif',
    'image/png', 'image/x-png',
    'image/webp',
];

if (!in_array($mimeType, $allowedMimeTypes, true)) {
    sendResponse(0, 'Unsupported image format. Please upload JPG, PNG, or WEBP.');
}

$extensionMap = [
    'image/jpeg' => 'jpg',
    'image/jpg' => 'jpg',
    'image/pjpeg' => 'jpg',
    'image/jfif' => 'jpg',
    'image/png' => 'png',
    'image/x-png' => 'png',
    'image/webp' => 'webp',
];

$extension = $extensionMap[$mimeType] ?? strtolower((string) pathinfo($originalName, PATHINFO_EXTENSION));
if ($extension === '') {
    $extension = 'jpg';
}

$subdir = date('Y/m');
$uploadRoot = dirname(__DIR__) . '/uploads/forum/' . $subdir;
if (!is_dir($uploadRoot) && !mkdir($uploadRoot, 0755, true)) {
    sendResponse(0, 'Unable to create upload directory');
}

$uniqueName = bin2hex(random_bytes(12)) . '.' . $extension;
$destination = $uploadRoot . '/' . $uniqueName;

$saved = saveOptimizedImage($tmpPath, $destination, $mimeType);
if (!$saved) {
    if (!move_uploaded_file($tmpPath, $destination)) {
        sendResponse(0, 'Failed to save file');
    }
}

$publicPath = '/uploads/forum/' . $subdir . '/' . $uniqueName;
$finalSize = is_file($destination) ? (int) filesize($destination) : $originalSize;

sendResponse(1, 'Upload success', [
    'url' => $publicPath,
    'filename' => $uniqueName,
    'original_name' => $originalName,
    'size' => $finalSize,
    'original_size' => $originalSize,
    'mime_type' => $mimeType,
    'extension' => $extension,
]);

function detectMimeType($tmpPath, array $file) {
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo) {
            $mimeType = finfo_file($finfo, $tmpPath);
            finfo_close($finfo);
            if ($mimeType) {
                return $mimeType;
            }
        }
    }

    if (function_exists('mime_content_type')) {
        $mimeType = mime_content_type($tmpPath);
        if ($mimeType) {
            return $mimeType;
        }
    }

    return $file['type'] ?? '';
}

function saveOptimizedImage($tmpPath, $destination, $mimeType) {
    if (!extension_loaded('gd')) {
        return false;
    }

    $imageInfo = @getimagesize($tmpPath);
    if (!$imageInfo || empty($imageInfo[0]) || empty($imageInfo[1])) {
        return false;
    }

    $width = (int) $imageInfo[0];
    $height = (int) $imageInfo[1];
    $maxDimension = 1600;
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
            $canvas = createCanvas($targetWidth, $targetHeight, false);
            imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);
            $ok = imagejpeg($canvas, $destination, 82);
            imagedestroy($source);
            imagedestroy($canvas);
            return $ok;

        case 'image/png':
        case 'image/x-png':
            $source = @imagecreatefrompng($tmpPath);
            if (!$source) {
                return false;
            }
            $canvas = createCanvas($targetWidth, $targetHeight, true);
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
            $canvas = createCanvas($targetWidth, $targetHeight, true);
            imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);
            $ok = imagewebp($canvas, $destination, 80);
            imagedestroy($source);
            imagedestroy($canvas);
            return $ok;
    }

    return false;
}

function createCanvas($width, $height, $transparent) {
    $canvas = imagecreatetruecolor($width, $height);
    if ($transparent) {
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparentColor = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefilledrectangle($canvas, 0, 0, $width, $height, $transparentColor);
    }
    return $canvas;
}

function sendResponse($code, $message, $data = null) {
    while (ob_get_level()) {
        ob_end_clean();
    }

    $response = ['code' => $code, 'msg' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}
