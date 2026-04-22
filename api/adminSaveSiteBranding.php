<?php
include 'config.php';
include 'require_admin.php';

function ensure_site_settings_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS site_settings (
            setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
            setting_value TEXT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
}

function clean_logo_text(string $value): string
{
    $text = preg_replace('/\s+/u', '', trim($value));
    if ($text === '') {
        return "\u{901A}";
    }

    if (preg_match_all('/./us', $text, $matches)) {
        return implode('', array_slice($matches[0], 0, 2));
    }

    return substr($text, 0, 2);
}

function branding_payload(string $mode, string $text, string $image): array
{
    $safeMode = $mode === 'image' && $image !== '' ? 'image' : 'text';
    return [
        'mode' => $safeMode,
        'text' => clean_logo_text($text),
        'image' => $safeMode === 'image' ? $image : '',
    ];
}

$adminUserId = isset($_POST['adminUserId']) ? (int) $_POST['adminUserId'] : 0;
require_admin($pdo, $adminUserId);

ensure_site_settings_table($pdo);

$logoText = isset($_POST['logoText']) ? (string) $_POST['logoText'] : '';
$logoTextBase64 = isset($_POST['logoTextBase64']) ? trim((string) $_POST['logoTextBase64']) : '';
$logoImage = isset($_POST['logoImage']) ? trim((string) $_POST['logoImage']) : '';
$mode = isset($_POST['mode']) ? trim((string) $_POST['mode']) : '';

if ($logoTextBase64 !== '') {
    $decodedText = base64_decode($logoTextBase64, true);
    if ($decodedText !== false) {
        $logoText = $decodedText;
    }
}

if ($logoImage !== '' && preg_match('#^/uploads/forum/#', $logoImage) !== 1) {
    echo json_encode(['code' => 0, 'msg' => '图标图片地址不合法'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($mode !== 'image' && $mode !== 'text') {
    $mode = $logoImage !== '' ? 'image' : 'text';
}

$branding = branding_payload($mode, $logoText, $logoImage);

$upsert = $pdo->prepare(
    "INSERT INTO site_settings (setting_key, setting_value, updated_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       setting_value = VALUES(setting_value),
       updated_at = NOW()"
);

$upsert->execute(['header_logo_type', $branding['mode']]);
$upsert->execute(['header_logo_text', 'b64:' . base64_encode($branding['text'])]);
$upsert->execute(['header_logo_image', $branding['image']]);

echo json_encode([
    'code' => 1,
    'msg' => '论坛图标已更新',
    'data' => $branding,
], JSON_UNESCAPED_UNICODE);
