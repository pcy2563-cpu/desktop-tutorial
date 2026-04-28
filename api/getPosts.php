<?php
include 'config.php';
include 'require_admin.php';
include 'behavior_logger.php';

$categoryId = isset($_GET['categoryId']) ? (int) $_GET['categoryId'] : 0;
$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : 0;
if ($userId > 0) {
    $userId = require_user($pdo, $userId);
}
$keyword = isset($_GET['q']) ? trim($_GET['q']) : '';
$page = isset($_GET['page']) ? max(1, (int) $_GET['page']) : 1;
$pageSize = isset($_GET['pageSize']) ? (int) $_GET['pageSize'] : 8;
$pageSize = max(1, min(20, $pageSize));
$offset = ($page - 1) * $pageSize;

$slugByCatId = [
    1 => 'study',
    2 => 'life',
    3 => 'used',
    4 => 'activity',
];

$idBySlug = [
    'study' => 1,
    'life' => 2,
    'used' => 3,
    'secondhand' => 3,
    'activity' => 4,
];

$baseWhere = ' FROM forum_posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.status = ?';

$sql = 'SELECT p.id, p.user_id, p.title, p.content, p.images, p.category, p.is_anonymous, p.view_count, p.like_count AS likes,
        p.comment_count, p.is_top, p.created_at, p.updated_at,
        u.nickname AS user_nickname, u.avatar AS user_avatar' . $baseWhere;

$params = ['normal'];

if ($categoryId > 0 && isset($slugByCatId[$categoryId])) {
    $sql .= ' AND p.category = ?';
    $baseWhere .= ' AND p.category = ?';
    $params[] = $slugByCatId[$categoryId];
}

if ($keyword !== '') {
    $sql .= ' AND (p.title LIKE ? OR p.content LIKE ? OR u.nickname LIKE ?)';
    $baseWhere .= ' AND (p.title LIKE ? OR p.content LIKE ? OR u.nickname LIKE ?)';
    $kw = '%' . $keyword . '%';
    $params[] = $kw;
    $params[] = $kw;
    $params[] = $kw;
}

$countStmt = $pdo->prepare('SELECT COUNT(*)' . $baseWhere);
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$sql .= ' ORDER BY p.created_at DESC, p.id DESC LIMIT ' . (int) $pageSize . ' OFFSET ' . (int) $offset;
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (!empty($posts) && $userId > 0) {
    $postIds = array_map(static function ($row) {
        return (int) $row['id'];
    }, $posts);
    $placeholders = implode(',', array_fill(0, count($postIds), '?'));
    $likeStmt = $pdo->prepare(
        "SELECT post_id FROM forum_likes WHERE user_id = ? AND post_id IN ($placeholders)"
    );
    $likeStmt->execute(array_merge([$userId], $postIds));
    $likedMap = [];
    foreach ($likeStmt->fetchAll(PDO::FETCH_ASSOC) as $likedRow) {
        $likedMap[(int) $likedRow['post_id']] = 1;
    }
} else {
    $likedMap = [];
}

foreach ($posts as &$row) {
    $slug = strtolower((string) ($row['category'] ?? ''));
    $row['category_id'] = $idBySlug[$slug] ?? 0;
    $row['is_anonymous'] = !empty($row['is_anonymous']) ? 1 : 0;
    if ($row['is_anonymous'] === 1) {
        $row['user_nickname'] = '匿名用户';
        $row['user_avatar'] = null;
    }
    $row['liked_by_me'] = !empty($likedMap[(int) $row['id']]) ? 1 : 0;
}
unset($row);

if ($userId > 0) {
    if ($keyword !== '') {
        log_behavior($pdo, [
            'user_id' => $userId,
            'behavior_type' => 'search',
            'category' => $categoryId > 0 && isset($slugByCatId[$categoryId]) ? $slugByCatId[$categoryId] : null,
            'keyword' => $keyword,
            'extra_data' => [
                'page' => $page,
                'page_size' => $pageSize,
                'result_count' => count($posts),
            ],
        ]);
    }

    if ($categoryId > 0 && isset($slugByCatId[$categoryId])) {
        log_behavior($pdo, [
            'user_id' => $userId,
            'behavior_type' => 'browse_category',
            'category' => $slugByCatId[$categoryId],
            'extra_data' => [
                'page' => $page,
                'page_size' => $pageSize,
                'result_count' => count($posts),
            ],
        ]);
    }
}

echo json_encode([
    'code' => 1,
    'data' => $posts,
    'pagination' => [
        'page' => $page,
        'page_size' => $pageSize,
        'total' => $total,
        'has_more' => ($offset + count($posts)) < $total ? 1 : 0,
    ],
], JSON_UNESCAPED_UNICODE);

