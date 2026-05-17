<?php
include 'config.php';

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

function read_site_announcement(PDO $pdo): array
{
    ensure_site_settings_table($pdo);

    $announcement = [
        'enabled' => false,
        'title' => '',
        'body' => '',
        'image' => '',
        'link' => '',
    ];

    $stmt = $pdo->query(
        "SELECT setting_key, setting_value
         FROM site_settings
         WHERE setting_key IN (
            'site_announcement_enabled',
            'site_announcement_title',
            'site_announcement_body',
            'site_announcement_image',
            'site_announcement_link'
         )"
    );

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $key = (string) ($row['setting_key'] ?? '');
        $value = (string) ($row['setting_value'] ?? '');

        if ($key === 'site_announcement_enabled') {
            $announcement['enabled'] = trim($value) === '1';
        } elseif ($key === 'site_announcement_title') {
            $announcement['title'] = limit_setting_text($value, 50);
        } elseif ($key === 'site_announcement_body') {
            $announcement['body'] = normalize_setting_body($value);
        } elseif ($key === 'site_announcement_image') {
            $announcement['image'] = normalize_setting_image($value);
        } elseif ($key === 'site_announcement_link') {
            $announcement['link'] = normalize_setting_link($value);
        }
    }

    return $announcement;
}

echo json_encode([
    'code' => 1,
    'data' => read_site_announcement($pdo),
], JSON_UNESCAPED_UNICODE);
