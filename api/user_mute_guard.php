<?php

function assert_user_not_muted(PDO $pdo, $userId) {
    $uid = (int) $userId;
    if ($uid <= 0) {
        return;
    }
    $st = $pdo->prepare('SELECT is_muted FROM users WHERE id = ?');
    $st->execute([$uid]);
    $r = $st->fetch(PDO::FETCH_ASSOC);
    if ($r && !empty($r['is_muted'])) {
        echo json_encode(['code' => 0, 'msg' => '您已被禁言，暂时无法发帖或评论']);
        exit;
    }
}
