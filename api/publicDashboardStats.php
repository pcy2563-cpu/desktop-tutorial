<?php
include 'config.php';
include 'require_admin.php';

if (!function_exists('dashboard_behavior_focus_label')) {
    function dashboard_behavior_focus_label(string $type): string
    {
        $map = [
            'search' => "\u{641C}\u{7D22}\u{884C}\u{4E3A}",
            'view_post' => "\u{6D4F}\u{89C8}\u{884C}\u{4E3A}",
            'like_post' => "\u{70B9}\u{8D5E}\u{53CD}\u{9988}",
            'unlike_post' => "\u{53D6}\u{6D88}\u{70B9}\u{8D5E}",
            'comment_post' => "\u{8BC4}\u{8BBA}\u{53C2}\u{4E0E}",
            'create_post' => "\u{53D1}\u{5E16}\u{884C}\u{4E3A}",
            'browse_category' => "\u{5185}\u{5BB9}\u{9017}\u{7559}",
        ];
        return $map[$type] ?? "\u{5176}\u{4ED6}\u{884C}\u{4E3A}";
    }
}

$isAdmin = false;
$adminUserId = 0;

if (read_admin_token() !== '') {
    $adminUserId = require_admin($pdo);
    $isAdmin = $adminUserId > 0;
}

$summary = [
    'users' => (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn(),
    'posts' => (int) $pdo->query("SELECT COUNT(*) FROM forum_posts WHERE status = 'normal'")->fetchColumn(),
    'comments' => (int) $pdo->query("SELECT COUNT(*) FROM forum_comments WHERE status = 'normal'")->fetchColumn(),
    'likes' => (int) $pdo->query('SELECT COUNT(*) FROM forum_likes WHERE post_id IS NOT NULL')->fetchColumn(),
    'today_posts' => (int) $pdo->query("SELECT COUNT(*) FROM forum_posts WHERE status = 'normal' AND DATE(created_at) = CURDATE()")->fetchColumn(),
    'today_comments' => (int) $pdo->query("SELECT COUNT(*) FROM forum_comments WHERE status = 'normal' AND DATE(created_at) = CURDATE()")->fetchColumn(),
    'behavior_events' => 0,
    'active_users_7d' => 0,
    'searches_7d' => 0,
    'views_7d' => 0,
];

$contentSegments = [
    [
        'label' => "\u{56FE}\u{6587}\u{5185}\u{5BB9}",
        'total' => (int) $pdo->query("SELECT COUNT(*) FROM forum_posts WHERE status = 'normal' AND images IS NOT NULL AND images <> ''")->fetchColumn(),
    ],
    [
        'label' => "\u{7EAF}\u{6587}\u{5B57}\u{5185}\u{5BB9}",
        'total' => (int) $pdo->query("SELECT COUNT(*) FROM forum_posts WHERE status = 'normal' AND (images IS NULL OR images = '')")->fetchColumn(),
    ],
    [
        'label' => "\u{7F6E}\u{9876}\u{5185}\u{5BB9}",
        'total' => (int) $pdo->query("SELECT COUNT(*) FROM forum_posts WHERE status = 'normal' AND is_top = 1")->fetchColumn(),
    ],
    [
        'label' => "\u{9AD8}\u{4E92}\u{52A8}\u{5185}\u{5BB9}",
        'total' => (int) $pdo->query("SELECT COUNT(*) FROM forum_posts WHERE status = 'normal' AND (like_count + comment_count) >= 6")->fetchColumn(),
    ],
    [
        'label' => "\u{533F}\u{540D}\u{53D1}\u{5E03}",
        'total' => (int) $pdo->query("SELECT COUNT(*) FROM forum_posts WHERE status = 'normal' AND is_anonymous = 1")->fetchColumn(),
    ],
];

$hotPostsStmt = $pdo->query(
    "SELECT id, title, category, view_count, like_count, comment_count, created_at
     FROM forum_posts
     WHERE status = 'normal'
     ORDER BY like_count DESC, comment_count DESC, view_count DESC, created_at DESC
     LIMIT 6"
);

$topKeywords = [];
$behaviorFocus = [];
$behaviorTrendMap = [];
$activeUsers = [];
$behaviorMix = [];
$hourlyActivityMap = [];
$activityHeatmapMap = [];

for ($i = 6; $i >= 0; $i--) {
    $day = date('Y-m-d', strtotime("-{$i} day"));
    $behaviorTrendMap[$day] = [
        'log_date' => $day,
        'total' => 0,
        'active_users' => 0,
    ];
}

$contentTrendMap = [];
for ($i = 6; $i >= 0; $i--) {
    $day = date('Y-m-d', strtotime("-{$i} day"));
    $contentTrendMap[$day] = [
        'log_date' => $day,
        'posts' => 0,
        'comments' => 0,
    ];
}

for ($i = 0; $i < 24; $i++) {
    $hourlyActivityMap[$i] = [
        'hour_slot' => $i,
        'label' => sprintf('%02d:00', $i),
        'total' => 0,
    ];
}

for ($i = 13; $i >= 0; $i--) {
    $day = date('Y-m-d', strtotime("-{$i} day"));
    $activityHeatmapMap[$day] = [
        'log_date' => $day,
        'label' => date('m/d', strtotime($day)),
        'behaviors' => 0,
        'posts' => 0,
        'comments' => 0,
        'value' => 0,
    ];
}

try {
    $behaviorSummaryStmt = $pdo->query(
        "SELECT
            COUNT(*) AS behavior_events,
            COUNT(DISTINCT CASE WHEN user_id IS NOT NULL AND user_id > 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN user_id END) AS active_users_7d,
            SUM(CASE WHEN behavior_type = 'search' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS searches_7d,
            SUM(CASE WHEN behavior_type = 'view_post' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS views_7d
         FROM user_behavior_logs"
    );
    $behaviorSummary = $behaviorSummaryStmt->fetch(PDO::FETCH_ASSOC);
    if ($behaviorSummary) {
        $summary['behavior_events'] = (int) ($behaviorSummary['behavior_events'] ?? 0);
        $summary['active_users_7d'] = (int) ($behaviorSummary['active_users_7d'] ?? 0);
        $summary['searches_7d'] = (int) ($behaviorSummary['searches_7d'] ?? 0);
        $summary['views_7d'] = (int) ($behaviorSummary['views_7d'] ?? 0);
    }

    $topKeywordsStmt = $pdo->query(
        "SELECT keyword, COUNT(*) AS total
         FROM user_behavior_logs
         WHERE behavior_type = 'search' AND keyword IS NOT NULL AND keyword <> ''
           AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY keyword
         ORDER BY total DESC, keyword ASC
         LIMIT 8"
    );
    $topKeywords = $topKeywordsStmt->fetchAll(PDO::FETCH_ASSOC);

    $behaviorTrendStmt = $pdo->query(
        "SELECT DATE(created_at) AS log_date,
                COUNT(*) AS total,
                COUNT(DISTINCT CASE WHEN user_id IS NOT NULL AND user_id > 0 THEN user_id END) AS active_users
         FROM user_behavior_logs
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY DATE(created_at)
         ORDER BY log_date ASC"
    );

    foreach ($behaviorTrendStmt->fetchAll(PDO::FETCH_ASSOC) as $item) {
        $day = (string) ($item['log_date'] ?? '');
        if (isset($behaviorTrendMap[$day])) {
            $behaviorTrendMap[$day]['total'] = (int) ($item['total'] ?? 0);
            $behaviorTrendMap[$day]['active_users'] = (int) ($item['active_users'] ?? 0);
        }
    }

    $behaviorMixStmt = $pdo->query(
        "SELECT behavior_type, COUNT(*) AS total
         FROM user_behavior_logs
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY behavior_type
         ORDER BY total DESC, behavior_type ASC"
    );
    $behaviorMix = array_map(static function ($item) {
        return [
            'behavior_type' => (string) ($item['behavior_type'] ?? ''),
            'total' => (int) ($item['total'] ?? 0),
        ];
    }, $behaviorMixStmt->fetchAll(PDO::FETCH_ASSOC));
    $behaviorFocus = array_slice(array_map(static function ($item) {
        $type = (string) ($item['behavior_type'] ?? '');
        return [
            'behavior_type' => $type,
            'label' => dashboard_behavior_focus_label($type),
            'total' => (int) ($item['total'] ?? 0),
        ];
    }, $behaviorMix), 0, 6);

    $hourlyActivityStmt = $pdo->query(
        "SELECT HOUR(created_at) AS hour_slot, COUNT(*) AS total
         FROM user_behavior_logs
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY HOUR(created_at)
         ORDER BY hour_slot ASC"
    );
    foreach ($hourlyActivityStmt->fetchAll(PDO::FETCH_ASSOC) as $item) {
        $hourSlot = (int) ($item['hour_slot'] ?? -1);
        if (isset($hourlyActivityMap[$hourSlot])) {
            $hourlyActivityMap[$hourSlot]['total'] = (int) ($item['total'] ?? 0);
        }
    }

    $activityHeatBehaviorStmt = $pdo->query(
        "SELECT DATE(created_at) AS log_date, COUNT(*) AS total
         FROM user_behavior_logs
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
         GROUP BY DATE(created_at)
         ORDER BY log_date ASC"
    );
    foreach ($activityHeatBehaviorStmt->fetchAll(PDO::FETCH_ASSOC) as $item) {
        $day = (string) ($item['log_date'] ?? '');
        if (isset($activityHeatmapMap[$day])) {
            $activityHeatmapMap[$day]['behaviors'] = (int) ($item['total'] ?? 0);
        }
    }

    $activeUsersStmt = $pdo->query(
        "SELECT l.user_id,
                COALESCE(NULLIF(u.nickname, ''), CONCAT('用户', l.user_id)) AS nickname,
                COUNT(*) AS total_events,
                SUM(
                    CASE l.behavior_type
                        WHEN 'create_post' THEN 6
                        WHEN 'comment_post' THEN 5
                        WHEN 'like_post' THEN 4
                        WHEN 'view_post' THEN 3
                        WHEN 'search' THEN 2
                        WHEN 'browse_category' THEN 2
                        ELSE 1
                    END
                ) AS active_score
         FROM user_behavior_logs l
         LEFT JOIN users u ON u.id = l.user_id
         WHERE l.user_id IS NOT NULL AND l.user_id > 0
           AND l.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         GROUP BY l.user_id, u.nickname
         ORDER BY active_score DESC, total_events DESC, l.user_id ASC
         LIMIT 6"
    );
    $activeUsers = $activeUsersStmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    $topKeywords = [];
    $behaviorFocus = [];
    $activeUsers = [];
    $behaviorMix = [];
}

$postTrendStmt = $pdo->query(
    "SELECT DATE(created_at) AS log_date, COUNT(*) AS total
     FROM forum_posts
     WHERE status = 'normal' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(created_at)
     ORDER BY log_date ASC"
);
foreach ($postTrendStmt->fetchAll(PDO::FETCH_ASSOC) as $item) {
    $day = (string) ($item['log_date'] ?? '');
    if (isset($contentTrendMap[$day])) {
        $contentTrendMap[$day]['posts'] = (int) ($item['total'] ?? 0);
    }
    if (isset($activityHeatmapMap[$day])) {
        $activityHeatmapMap[$day]['posts'] = (int) ($item['total'] ?? 0);
    }
}

$commentTrendStmt = $pdo->query(
    "SELECT DATE(created_at) AS log_date, COUNT(*) AS total
     FROM forum_comments
     WHERE status = 'normal' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(created_at)
     ORDER BY log_date ASC"
);
foreach ($commentTrendStmt->fetchAll(PDO::FETCH_ASSOC) as $item) {
    $day = (string) ($item['log_date'] ?? '');
    if (isset($contentTrendMap[$day])) {
        $contentTrendMap[$day]['comments'] = (int) ($item['total'] ?? 0);
    }
    if (isset($activityHeatmapMap[$day])) {
        $activityHeatmapMap[$day]['comments'] = (int) ($item['total'] ?? 0);
    }
}

foreach ($activityHeatmapMap as $day => $item) {
    $activityHeatmapMap[$day]['value'] = (int) (
        (int) ($item['behaviors'] ?? 0)
        + ((int) ($item['posts'] ?? 0) * 4)
        + ((int) ($item['comments'] ?? 0) * 3)
    );
}

$adminExtra = null;
if ($isAdmin) {
    $adminExtra = [
        'muted_users' => (int) $pdo->query('SELECT COUNT(*) FROM users WHERE is_muted = 1')->fetchColumn(),
        'active_banners' => (int) $pdo->query("SELECT COUNT(*) FROM banners WHERE status = 'active'")->fetchColumn(),
    ];
}

echo json_encode([
    'code' => 1,
    'data' => [
        'summary' => $summary,
        'content_segments' => $contentSegments,
        'hot_posts' => $hotPostsStmt->fetchAll(PDO::FETCH_ASSOC),
        'top_keywords' => $topKeywords,
        'behavior_focus' => $behaviorFocus,
        'behavior_mix' => $behaviorMix,
        'behavior_trend' => array_values($behaviorTrendMap),
        'content_trend' => array_values($contentTrendMap),
        'hourly_activity' => array_values($hourlyActivityMap),
        'activity_heatmap' => array_values($activityHeatmapMap),
        'active_users' => $activeUsers,
        'admin_extra' => $adminExtra,
    ],
], JSON_UNESCAPED_UNICODE);
