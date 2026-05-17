<?php
include 'config.php';
include 'require_admin.php';
include 'forum_response_helper.php';
include 'content_report_helper.php';

$adminUserId = isset($_GET['adminUserId']) ? (int) $_GET['adminUserId'] : (isset($_POST['adminUserId']) ? (int) $_POST['adminUserId'] : 0);
$adminUserId = require_admin($pdo, $adminUserId);

ensure_content_reports_table($pdo);
$status = isset($_GET['status']) ? strtolower(trim((string) $_GET['status'])) : 'pending';
if (!in_array($status, ['pending', 'resolved', 'rejected'], true)) {
    $status = 'pending';
}
$page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
$pageSize = isset($_GET['pageSize']) ? max(1, min(50, (int) $_GET['pageSize'])) : 20;
$offset = ($page - 1) * $pageSize;

$countStmt = $pdo->prepare('SELECT COUNT(*) FROM content_reports WHERE status = ?');
$countStmt->execute([$status]);
$total = (int) $countStmt->fetchColumn();

$stmt = $pdo->prepare(
    "SELECT r.id, r.target_type, r.target_id, r.reporter_user_id, r.reason, r.detail, r.status,
            r.handle_action, r.handle_note, r.created_at, r.handled_at,
            u.nickname AS reporter_nickname, u.phone AS reporter_phone,
            p.title AS post_title,
            c.content AS comment_content,
            cp.title AS comment_post_title
     FROM content_reports r
     LEFT JOIN users u ON u.id = r.reporter_user_id
     LEFT JOIN forum_posts p ON r.target_type = 'post' AND p.id = r.target_id
     LEFT JOIN forum_comments c ON r.target_type = 'comment' AND c.id = r.target_id
     LEFT JOIN forum_posts cp ON cp.id = c.post_id
     WHERE r.status = ?
     ORDER BY r.created_at DESC
     LIMIT {$pageSize} OFFSET {$offset}"
);
$stmt->execute([$status]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($rows as &$row) {
    $row['id'] = (int) ($row['id'] ?? 0);
    $row['target_id'] = (int) ($row['target_id'] ?? 0);
    $row['reporter_user_id'] = (int) ($row['reporter_user_id'] ?? 0);
    $row['reason_label'] = report_reason_label((string) ($row['reason'] ?? 'other'));
    $row['target_title'] = $row['target_type'] === 'post'
        ? (string) ($row['post_title'] ?? '')
        : (string) ($row['comment_post_title'] ?? '');
}
unset($row);

forum_json([
    'code' => 1,
    'msg' => 'ok',
    'data' => $rows,
    'pagination' => [
        'page' => $page,
        'page_size' => $pageSize,
        'total' => $total,
        'has_more' => ($offset + count($rows)) < $total ? 1 : 0,
    ],
]);
