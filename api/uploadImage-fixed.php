<?php
include 'config.php';
include 'require_admin.php';

// 调试模式
$debug = isset($_GET['debug']) || isset($_POST['debug']);

// 获取用户ID
$userId = isset($_POST['userId']) ? (int) $_POST['userId'] : 0;
$userId = require_user($pdo, $userId);
enforce_rate_limit($pdo, 'upload_image', 40, 3600, (string) $userId);
if ($userId <= 0) {
    sendResponse(0, '未登录');
}

// 验证用户
$chk = $pdo->prepare('SELECT id FROM users WHERE id = ?');
$chk->execute([$userId]);
if (!$chk->fetch()) {
    sendResponse(0, '用户无效');
}

// 检查文件上传
if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
    sendResponse(0, '请选择图片文件');
}

$file = $_FILES['file'];

// 检查上传错误
if ($file['error'] !== UPLOAD_ERR_OK) {
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE => '文件大小超过服务器限制',
        UPLOAD_ERR_FORM_SIZE => '文件大小超过表单限制',
        UPLOAD_ERR_PARTIAL => '文件只有部分被上传',
        UPLOAD_ERR_NO_FILE => '没有文件被上传',
        UPLOAD_ERR_NO_TMP_DIR => '找不到临时文件夹',
        UPLOAD_ERR_CANT_WRITE => '文件写入失败',
        UPLOAD_ERR_EXTENSION => 'PHP扩展阻止了文件上传'
    ];
    sendResponse(0, $errorMessages[$file['error']] ?? '上传失败 (错误代码: ' . $file['error'] . ')');
}

// 文件大小限制 (20MB)
$maxSize = 20 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    sendResponse(0, '单张图片不能超过 20MB');
}

// 获取文件信息
$tmpPath = $file['tmp_name'];
$originalName = $file['name'];
$fileSize = $file['size'];

// 调试信息
if ($debug) {
    error_log("上传调试: 文件名={$originalName}, 大小={$fileSize}, 临时文件={$tmpPath}");
}

// 获取MIME类型
$mimeType = null;
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo) {
        $mimeType = finfo_file($finfo, $tmpPath);
        finfo_close($finfo);
    }
}

// 如果finfo不可用，使用备用方法
if (!$mimeType) {
    $mimeType = mime_content_type($tmpPath) ?: $file['type'];
}

// 统一转为小写
$mimeType = strtolower(trim($mimeType));

// 只允许安全且可压缩的网页图片格式。
$allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/pjpeg', 'image/jfif',
    'image/png', 'image/x-png',
    'image/webp',
];

// 检查MIME类型是否允许
$mimeAllowed = false;
foreach ($allowedMimeTypes as $allowedMime) {
    if (strtolower($allowedMime) === $mimeType) {
        $mimeAllowed = true;
        break;
    }
}

if (!$mimeAllowed) {
    sendResponse(0, '不支持的文件格式。仅支持 JPG、PNG、WEBP');
}

// 根据MIME类型确定文件扩展名
$extensionMap = [
    'jpeg' => 'jpg',
    'jpg' => 'jpg',
    'pjpeg' => 'jpg',
    'jfif' => 'jpg',
    'png' => 'png',
    'x-png' => 'png',
    'webp' => 'webp',
];

// 提取MIME类型的主要部分
$mimeParts = explode('/', $mimeType);
$mimeSubtype = $mimeParts[1] ?? '';
$extension = $extensionMap[$mimeSubtype] ?? $mimeSubtype;

// 如果无法从MIME类型确定扩展名，使用原始文件名（不区分大小写）
if (!$extension) {
    $originalExt = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $extension = $originalExt ?: 'jpg';
}

// 确保扩展名是小写
$extension = strtolower($extension);

// 创建存储目录
$subdir = date('Y/m');
$uploadRoot = dirname(__DIR__) . '/uploads/forum/' . $subdir;

if (!is_dir($uploadRoot) && !mkdir($uploadRoot, 0755, true)) {
    sendResponse(0, '服务器无法创建目录');
}

// 生成唯一文件名
$uniqueName = bin2hex(random_bytes(12)) . '.' . $extension;
$destination = $uploadRoot . '/' . $uniqueName;

// 移动上传的文件
if (!move_uploaded_file($tmpPath, $destination)) {
    sendResponse(0, '文件保存失败');
}

// 生成公开访问路径
$publicPath = '/uploads/forum/' . $subdir . '/' . $uniqueName;

// 返回成功响应
sendResponse(1, '上传成功', [
    'url' => $publicPath,
    'filename' => $uniqueName,
    'original_name' => $originalName,
    'size' => $fileSize,
    'mime_type' => $mimeType,
    'extension' => $extension
]);

/**
 * 发送JSON响应
 */
function sendResponse($code, $message, $data = null) {
    // 清除输出缓冲区
    while (ob_get_level()) ob_end_clean();
    
    $response = ['code' => $code, 'msg' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}
?>
