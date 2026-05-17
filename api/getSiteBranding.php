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

function read_logo_text(string $value): string
{
    if (str_starts_with($value, 'b64:')) {
        $decoded = base64_decode(substr($value, 4), true);
        if ($decoded !== false) {
            return clean_logo_text($decoded);
        }
    }

    return clean_logo_text($value);
}

function read_site_branding(PDO $pdo): array
{
    ensure_site_settings_table($pdo);

    $branding = [
        'mode' => 'text',
        'text' => "\u{901A}",
        'image' => '',
    ];

    $stmt = $pdo->query(
        "SELECT setting_key, setting_value
         FROM site_settings
         WHERE setting_key IN ('header_logo_type', 'header_logo_text', 'header_logo_image')"
    );

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $key = (string) ($row['setting_key'] ?? '');
        $value = trim((string) ($row['setting_value'] ?? ''));
        if ($key === 'header_logo_type' && in_array($value, ['text', 'image'], true)) {
            $branding['mode'] = $value;
        } elseif ($key === 'header_logo_text') {
            $branding['text'] = read_logo_text($value);
        } elseif ($key === 'header_logo_image' && preg_match('#^/uploads/forum/#', $value) === 1) {
            $branding['image'] = $value;
        }
    }

    if ($branding['mode'] === 'image' && $branding['image'] === '') {
        $branding['mode'] = 'text';
    }

    return $branding;
}

echo json_encode([
    'code' => 1,
    'data' => read_site_branding($pdo),
], JSON_UNESCAPED_UNICODE);
