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

function limit_setting_text(string $value, int $maxChars): string
{
    $safe = trim($value);
    if ($safe === '') {
        return '';
    }

    if (preg_match_all('/./us', $safe, $matches)) {
        return implode('', array_slice($matches[0], 0, $maxChars));
    }

    return substr($safe, 0, $maxChars);
}

function normalize_setting_body(string $value): string
{
    $safe = preg_replace("/\r\n?/", "\n", trim($value));
    return limit_setting_text($safe, 500);
}

function normalize_setting_link(string $value): string
{
    $safe = trim($value);
    if ($safe === '') {
        return '';
    }

    return preg_match('#^(https?://|/)#i', $safe) === 1 ? $safe : '';
}

function normalize_setting_image(string $value): string
{
    $safe = trim($value);
    if ($safe === '') {
        return '';
    }

    return preg_match('#^(https?://|/uploads/forum/)#i', $safe) === 1 ? $safe : '';
}

function announcement_payload(array $input): array
{
    $title = limit_setting_text((string) ($input['title'] ?? ''), 50);
    $body = normalize_setting_body((string) ($input['body'] ?? ''));
    $image = normalize_setting_image((string) ($input['image'] ?? ''));
    $link = normalize_setting_link((string) ($input['link'] ?? ''));
    $enabled = ((string) ($input['enabled'] ?? '0')) === '1';

    return [
        'enabled' => $enabled,
        'title' => $title,
        'body' => $body,
        'image' => $image,
        'link' => $link,
    ];
}

$adminUserId = isset($_POST['adminUserId']) ? (int) $_POST['adminUserId'] : 0;
require_admin($pdo, $adminUserId);

ensure_site_settings_table($pdo);

$rawLink = isset($_POST['link']) ? (string) $_POST['link'] : '';
$rawImage = isset($_POST['image']) ? (string) $_POST['image'] : '';
$payload = announcement_payload($_POST);

if (trim($rawLink) !== '' && $payload['link'] === '') {
    echo json_encode(['code' => 0, 'msg' => '公告链接仅支持 http(s) 或站内 / 路径'], JSON_UNESCAPED_UNICODE);
    exit;
}

if (trim($rawImage) !== '' && $payload['image'] === '') {
    echo json_encode(['code' => 0, 'msg' => '公告图片地址仅支持 http(s) 或 /uploads/forum/ 路径'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($payload['enabled'] && $payload['title'] === '' && $payload['body'] === '' && $payload['image'] === '') {
    echo json_encode(['code' => 0, 'msg' => '启用公告前请至少填写标题、正文或上传图片'], JSON_UNESCAPED_UNICODE);
    exit;
}

$upsert = $pdo->prepare(
    "INSERT INTO site_settings (setting_key, setting_value, updated_at)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       setting_value = VALUES(setting_value),
       updated_at = NOW()"
);

$upsert->execute(['site_announcement_enabled', $payload['enabled'] ? '1' : '0']);
$upsert->execute(['site_announcement_title', $payload['title']]);
$upsert->execute(['site_announcement_body', $payload['body']]);
$upsert->execute(['site_announcement_image', $payload['image']]);
$upsert->execute(['site_announcement_link', $payload['link']]);

echo json_encode([
    'code' => 1,
    'msg' => '公告已保存',
    'data' => $payload,
], JSON_UNESCAPED_UNICODE);
