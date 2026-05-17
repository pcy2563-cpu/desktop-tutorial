<?php

function security_u(string $escaped): string {
    $decoded = json_decode('"' . $escaped . '"');
    return is_string($decoded) ? $decoded : $escaped;
}

function admin_error($message) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['code' => 0, 'msg' => $message], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ensure_admin_session_table(PDO $pdo) {
    static $ready = false;
    if ($ready) return;

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS admin_sessions (
            token_hash CHAR(64) NOT NULL PRIMARY KEY,
            user_id INT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            last_used_at DATETIME DEFAULT NULL,
            INDEX idx_admin_sessions_user_id (user_id),
            INDEX idx_admin_sessions_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $ready = true;
}

function ensure_user_session_table(PDO $pdo) {
    static $ready = false;
    if ($ready) return;

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS user_sessions (
            token_hash CHAR(64) NOT NULL PRIMARY KEY,
            user_id INT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            last_used_at DATETIME DEFAULT NULL,
            INDEX idx_user_sessions_user_id (user_id),
            INDEX idx_user_sessions_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $ready = true;
}

function ensure_security_rate_limit_table(PDO $pdo) {
    static $ready = false;
    if ($ready) return;

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS security_rate_limits (
            rate_key CHAR(64) NOT NULL PRIMARY KEY,
            scope VARCHAR(60) NOT NULL,
            client_id VARCHAR(120) NOT NULL,
            request_count INT NOT NULL DEFAULT 0,
            window_expires_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_security_rate_scope (scope),
            INDEX idx_security_rate_expires (window_expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $ready = true;
}

function ensure_admin_action_log_table(PDO $pdo) {
    static $ready = false;
    if ($ready) return;

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS admin_action_logs (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            admin_user_id INT NOT NULL,
            action VARCHAR(80) NOT NULL,
            target_type VARCHAR(60) DEFAULT NULL,
            target_id VARCHAR(80) DEFAULT NULL,
            ip_address VARCHAR(64) DEFAULT NULL,
            user_agent VARCHAR(255) DEFAULT NULL,
            detail TEXT DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_admin_action_admin (admin_user_id),
            INDEX idx_admin_action_action (action),
            INDEX idx_admin_action_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
    );
    $ready = true;
}

function security_client_ip() {
    return (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');
}

function enforce_rate_limit(PDO $pdo, $scope, $limit, $windowSeconds, $identity = '') {
    $limit = max(1, (int) $limit);
    $windowSeconds = max(10, (int) $windowSeconds);
    $scope = preg_replace('/[^a-zA-Z0-9:_-]/', '_', (string) $scope);
    $identity = trim((string) $identity);
    $clientId = substr(security_client_ip() . '|' . $identity, 0, 120);
    $rateKey = hash('sha256', $scope . '|' . $clientId);

    ensure_security_rate_limit_table($pdo);

    $stmt = $pdo->prepare(
        "INSERT INTO security_rate_limits (rate_key, scope, client_id, request_count, window_expires_at)
         VALUES (?, ?, ?, 1, DATE_ADD(NOW(), INTERVAL {$windowSeconds} SECOND))
         ON DUPLICATE KEY UPDATE
            request_count = IF(window_expires_at <= NOW(), 1, request_count + 1),
            window_expires_at = IF(window_expires_at <= NOW(), DATE_ADD(NOW(), INTERVAL {$windowSeconds} SECOND), window_expires_at),
            updated_at = NOW()"
    );
    $stmt->execute([$rateKey, $scope, $clientId]);

    $check = $pdo->prepare('SELECT request_count FROM security_rate_limits WHERE rate_key = ? LIMIT 1');
    $check->execute([$rateKey]);
    $row = $check->fetch(PDO::FETCH_ASSOC);

    if ($row && (int) ($row['request_count'] ?? 0) > $limit) {
        http_response_code(429);
        admin_error(security_u('\u64cd\u4f5c\u8fc7\u4e8e\u9891\u7e41\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5'));
    }

    if (random_int(1, 100) === 1) {
        $pdo->exec("DELETE FROM security_rate_limits WHERE window_expires_at < DATE_SUB(NOW(), INTERVAL 1 DAY)");
    }
}

function read_admin_token() {
    $token = isset($_POST['adminToken']) ? trim((string) $_POST['adminToken']) : '';
    if ($token === '' && isset($_GET['adminToken'])) {
        $token = trim((string) $_GET['adminToken']);
    }
    if ($token === '' && isset($_SERVER['HTTP_X_ADMIN_TOKEN'])) {
        $token = trim((string) $_SERVER['HTTP_X_ADMIN_TOKEN']);
    }
    if ($token === '' && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\s+(.+)/i', (string) $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
            $token = trim($matches[1]);
        }
    }
    return $token;
}

function issue_admin_token(PDO $pdo, $userId) {
    $id = (int) $userId;
    if ($id <= 0) {
        throw new RuntimeException('Invalid admin user');
    }

    ensure_admin_session_table($pdo);
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $stmt = $pdo->prepare(
        'INSERT INTO admin_sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))'
    );
    $stmt->execute([$hash, $id]);
    return $token;
}

function issue_user_token(PDO $pdo, $userId) {
    $id = (int) $userId;
    if ($id <= 0) {
        throw new RuntimeException('Invalid user');
    }

    ensure_user_session_table($pdo);
    $token = bin2hex(random_bytes(32));
    $hash = hash('sha256', $token);
    $stmt = $pdo->prepare(
        'INSERT INTO user_sessions (token_hash, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))'
    );
    $stmt->execute([$hash, $id]);
    return $token;
}

function read_auth_token() {
    $token = isset($_POST['authToken']) ? trim((string) $_POST['authToken']) : '';
    if ($token === '' && isset($_GET['authToken'])) {
        $token = trim((string) $_GET['authToken']);
    }
    if ($token === '' && isset($_SERVER['HTTP_X_AUTH_TOKEN'])) {
        $token = trim((string) $_SERVER['HTTP_X_AUTH_TOKEN']);
    }
    if ($token === '' && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        if (preg_match('/Bearer\s+(.+)/i', (string) $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
            $token = trim($matches[1]);
        }
    }
    return $token;
}

function require_user(PDO $pdo, $expectedUserId = null) {
    ensure_user_session_table($pdo);

    $token = read_auth_token();
    if ($token === '') {
        admin_error(security_u('\u767b\u5f55\u5df2\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55'));
    }

    $hash = hash('sha256', $token);
    $stmt = $pdo->prepare(
        'SELECT u.id, u.role
         FROM user_sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > NOW()
         LIMIT 1'
    );
    $stmt->execute([$hash]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        admin_error(security_u('\u767b\u5f55\u5df2\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55'));
    }

    $actualUserId = (int) $row['id'];
    $expected = (int) $expectedUserId;
    if ($expected > 0 && $actualUserId !== $expected) {
        admin_error(security_u('\u767b\u5f55\u8eab\u4efd\u4e0d\u5339\u914d\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55'));
    }

    $update = $pdo->prepare('UPDATE user_sessions SET last_used_at = NOW() WHERE token_hash = ?');
    $update->execute([$hash]);

    return $actualUserId;
}

function require_admin(PDO $pdo, $adminUserId = null) {
    ensure_admin_session_table($pdo);

    $token = read_admin_token();
    if ($token === '') {
        admin_error(security_u('\u7ba1\u7406\u5458\u767b\u5f55\u5df2\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55'));
    }

    $hash = hash('sha256', $token);
    $stmt = $pdo->prepare(
        'SELECT u.id, u.role
         FROM admin_sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > NOW()
         LIMIT 1'
    );
    $stmt->execute([$hash]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row || ($row['role'] ?? '') !== 'admin') {
        admin_error(security_u('\u4ec5\u7ba1\u7406\u5458\u53ef\u64cd\u4f5c\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55'));
    }

    $actualAdminId = (int) $row['id'];
    $expectedAdminId = (int) $adminUserId;
    if ($expectedAdminId > 0 && $expectedAdminId !== $actualAdminId) {
        admin_error(security_u('\u7ba1\u7406\u5458\u8eab\u4efd\u4e0d\u5339\u914d\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55'));
    }

    enforce_rate_limit($pdo, 'admin_api', 240, 600, (string) $actualAdminId);

    $update = $pdo->prepare('UPDATE admin_sessions SET last_used_at = NOW() WHERE token_hash = ?');
    $update->execute([$hash]);

    return $actualAdminId;
}

function log_admin_action(PDO $pdo, $adminUserId, $action, $targetType = null, $targetId = null, array $detail = []) {
    try {
        ensure_admin_action_log_table($pdo);
        $encodedDetail = null;
        if (!empty($detail)) {
            $encodedDetail = json_encode($detail, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($encodedDetail !== false && strlen($encodedDetail) > 4000) {
                $encodedDetail = substr($encodedDetail, 0, 4000);
            }
        }

        $stmt = $pdo->prepare(
            'INSERT INTO admin_action_logs (admin_user_id, action, target_type, target_id, ip_address, user_agent, detail)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            (int) $adminUserId,
            substr((string) $action, 0, 80),
            $targetType !== null ? substr((string) $targetType, 0, 60) : null,
            $targetId !== null ? substr((string) $targetId, 0, 80) : null,
            substr(security_client_ip(), 0, 64),
            substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
            $encodedDetail,
        ]);
    } catch (Throwable $e) {
    }
}
