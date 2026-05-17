<?php

function ensure_content_reports_table(PDO $pdo): void
{
    static $ready = false;
    if ($ready) {
        return;
    }

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS content_reports (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            target_type VARCHAR(20) NOT NULL,
            target_id INT NOT NULL,
            reporter_user_id INT NOT NULL,
            reason VARCHAR(40) NOT NULL,
            detail TEXT DEFAULT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'pending',
            handler_admin_id INT DEFAULT NULL,
            handle_action VARCHAR(40) DEFAULT NULL,
            handle_note TEXT DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            handled_at DATETIME DEFAULT NULL,
            INDEX idx_content_reports_target (target_type, target_id),
            INDEX idx_content_reports_status (status),
            INDEX idx_content_reports_reporter (reporter_user_id),
            INDEX idx_content_reports_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $ready = true;
}

function report_reason_label(string $reason): string
{
    $map = [
        'ad' => forum_u('\u5e7f\u544a'),
        'abuse' => forum_u('\u8fb1\u9a82'),
        'attack' => forum_u('\u4eba\u8eab\u653b\u51fb'),
        'privacy' => forum_u('\u9690\u79c1\u6cc4\u9732'),
        'illegal' => forum_u('\u8fdd\u6cd5\u8fdd\u89c4'),
        'other' => forum_u('\u5176\u4ed6'),
    ];
    return $map[$reason] ?? $map['other'];
}

function normalize_report_reason(string $reason): string
{
    $value = strtolower(trim($reason));
    $allowed = ['ad', 'abuse', 'attack', 'privacy', 'illegal', 'other'];
    return in_array($value, $allowed, true) ? $value : 'other';
}
