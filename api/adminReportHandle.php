<?php
include 'config.php';
include 'require_admin.php';
include 'forum_response_helper.php';
include 'content_report_helper.php';

$adminUserId = isset($_POST['adminUserId']) ? (int) $_POST['adminUserId'] : 0;
$adminUserId = require_admin($pdo, $adminUserId);

$reportId = isset($_POST['reportId']) ? (int) $_POST['reportId'] : 0;
$action = isset($_POST['action']) ? strtolower(trim((string) $_POST['action'])) : '';
$note = trim((string) ($_POST['note'] ?? ''));
if ($reportId <= 0 || !in_array($action, ['hide', 'resolve', 'reject'], true)) {
    forum_json(['code' => 0, 'msg' => forum_u('\u53c2\u6570\u9519\u8bef')]);
}

ensure_content_reports_table($pdo);
$stmt = $pdo->prepare('SELECT * FROM content_reports WHERE id = ? LIMIT 1');
$stmt->execute([$reportId]);
$report = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$report) {
    forum_json(['code' => 0, 'msg' => forum_u('\u4e3e\u62a5\u4e0d\u5b58\u5728')]);
}

$pdo->beginTransaction();
try {
    if ($action === 'hide') {
        if (($report['target_type'] ?? '') === 'post') {
            $update = $pdo->prepare("UPDATE forum_posts SET status = 'hidden' WHERE id = ? AND status = 'normal'");
            $update->execute([(int) $report['target_id']]);
        } elseif (($report['target_type'] ?? '') === 'comment') {
            $update = $pdo->prepare("UPDATE forum_comments SET status = 'hidden' WHERE id = ? AND status = 'normal'");
            $update->execute([(int) $report['target_id']]);
            $postIdStmt = $pdo->prepare('SELECT post_id FROM forum_comments WHERE id = ? LIMIT 1');
            $postIdStmt->execute([(int) $report['target_id']]);
            $postId = (int) $postIdStmt->fetchColumn();
            if ($postId > 0) {
                $pdo->prepare('UPDATE forum_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = ?')->execute([$postId]);
            }
        }
    }

    $status = $action === 'reject' ? 'rejected' : 'resolved';
    $updateReport = $pdo->prepare(
        "UPDATE content_reports
         SET status = ?, handler_admin_id = ?, handle_action = ?, handle_note = ?, handled_at = NOW()
         WHERE id = ?"
    );
    $updateReport->execute([$status, $adminUserId, $action, $note !== '' ? $note : null, $reportId]);

    log_admin_action($pdo, $adminUserId, 'handle_content_report', 'report', (string) $reportId, [
        'action' => $action,
        'target_type' => $report['target_type'] ?? '',
        'target_id' => (int) ($report['target_id'] ?? 0),
    ]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    forum_json(['code' => 0, 'msg' => forum_u('\u5904\u7406\u5931\u8d25')]);
}

forum_json(['code' => 1, 'msg' => forum_u('\u5904\u7406\u6210\u529f')]);
