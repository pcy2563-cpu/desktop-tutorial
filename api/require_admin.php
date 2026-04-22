<?php

function require_admin(PDO $pdo, $adminUserId) {
    $id = (int) $adminUserId;
    if ($id <= 0) {
        echo json_encode(['code' => 0, 'msg' => '无权限']);
        exit;
    }
    $stmt = $pdo->prepare('SELECT role FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row || ($row['role'] ?? '') !== 'admin') {
        echo json_encode(['code' => 0, 'msg' => '仅管理员可操作']);
        exit;
    }
}
