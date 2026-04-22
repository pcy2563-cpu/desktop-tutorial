<?php
include 'config.php';
include 'behavior_insights.php';

$userId = isset($_GET['userId']) ? (int) $_GET['userId'] : 0;
$limit = isset($_GET['limit']) ? (int) $_GET['limit'] : 6;
$limit = max(3, min(12, $limit));

$snapshot = [
    'active_score' => 0,
    'favorite_category' => '',
    'favorite_category_label' => '',
    'profile_stage_label' => '',
    'category_preferences' => [],
    'top_keywords' => [],
];

if ($userId > 0) {
    $userStmt = $pdo->prepare('SELECT id FROM users WHERE id = ? LIMIT 1');
    $userStmt->execute([$userId]);
    if ($userStmt->fetch()) {
        $snapshot = get_user_behavior_snapshot($pdo, $userId, 120);
    } else {
        $userId = 0;
    }
}

$likedMap = [];
if ($userId > 0) {
    $likedStmt = $pdo->prepare('SELECT post_id FROM forum_likes WHERE user_id = ? AND post_id IS NOT NULL');
    $likedStmt->execute([$userId]);
    foreach ($likedStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $likedMap[(int) ($row['post_id'] ?? 0)] = 1;
    }
}

$stmt = $pdo->query(
    "SELECT p.id, p.user_id, p.title, p.content, p.images, p.category, p.is_anonymous, p.view_count, p.like_count AS likes,
            p.comment_count, p.is_top, p.created_at, p.updated_at,
            u.nickname AS user_nickname, u.avatar AS user_avatar
     FROM forum_posts p
     LEFT JOIN users u ON p.user_id = u.id
     WHERE p.status = 'normal'
     ORDER BY p.is_top DESC, p.created_at DESC
     LIMIT 80"
);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$categoryScoreMap = [];
foreach (($snapshot['category_preferences'] ?? []) as $row) {
    $category = strtolower(trim((string) ($row['category'] ?? '')));
    if ($category === '') {
        continue;
    }
    $categoryScoreMap[$category] = (int) ($row['score'] ?? 0);
}

$topKeywords = array_slice(array_values(array_filter($snapshot['top_keywords'] ?? [], static function ($word) {
    return is_string($word) && trim($word) !== '';
})), 0, 5);

$idBySlug = [
    'study' => 1,
    'life' => 2,
    'used' => 3,
    'secondhand' => 3,
    'activity' => 4,
];

$scored = [];
foreach ($rows as $post) {
    $likes = (int) ($post['likes'] ?? 0);
    $comments = (int) ($post['comment_count'] ?? 0);
    $views = (int) ($post['view_count'] ?? 0);
    $category = strtolower(trim((string) ($post['category'] ?? '')));
    $likedByMe = !empty($likedMap[(int) $post['id']]) ? 1 : 0;
    $title = (string) ($post['title'] ?? '');
    $content = (string) ($post['content'] ?? '');
    $haystack = function_exists('mb_strtolower')
        ? mb_strtolower($title . ' ' . $content, 'UTF-8')
        : strtolower($title . ' ' . $content);

    $score = min(40, $likes * 2.2 + $comments * 1.6 + $views * 0.05);
    $createdAtTs = strtotime((string) ($post['created_at'] ?? ''));
    $ageHours = $createdAtTs ? max(0, (time() - $createdAtTs) / 3600) : 999;
    $freshBonus = max(0, 18 - ($ageHours / 12));
    $score += $freshBonus;

    if ((int) ($post['is_top'] ?? 0) === 1) {
        $score += 8;
    }

    $categoryBonus = 0;
    if ($category !== '' && isset($categoryScoreMap[$category])) {
        $categoryBonus = min(20, $categoryScoreMap[$category] * 0.8);
        $score += $categoryBonus;
    }

    $keywordBonus = 0;
    $matchedKeyword = '';
    foreach ($topKeywords as $keyword) {
        $needle = function_exists('mb_strtolower')
            ? mb_strtolower(trim((string) $keyword), 'UTF-8')
            : strtolower(trim((string) $keyword));
        if ($needle === '' || behavior_mb_length($needle) < 2) {
            continue;
        }

        $found = function_exists('mb_strpos')
            ? mb_strpos($haystack, $needle, 0, 'UTF-8') !== false
            : strpos($haystack, $needle) !== false;

        if ($found) {
            $keywordBonus += 6;
            if ($matchedKeyword === '') {
                $matchedKeyword = $keyword;
            }
        }
    }
    $score += $keywordBonus;

    if ($userId > 0 && (int) ($post['user_id'] ?? 0) === $userId) {
        $score -= 6;
    }
    if ($likedByMe === 1) {
        $score -= 10;
    }

    if ($matchedKeyword !== '') {
        $reason = "\u{5339}\u{914D}\u{4F60}\u{6700}\u{8FD1}\u{5173}\u{6CE8}\u{7684}\u{5173}\u{952E}\u{8BCD}\u{201C}" . $matchedKeyword . "\u{201D}";
    } elseif ($categoryBonus > 0) {
        $reason = "\u{4E0E}\u{4F60}\u{8FD1}\u{671F}\u{6D4F}\u{89C8}\u{4E0E}\u{4E92}\u{52A8}\u{4FE1}\u{53F7}\u{76F8}\u{5339}\u{914D}";
    } elseif ($likes + $comments >= 6) {
        $reason = "\u{5F53}\u{524D}\u{7AD9}\u{5185}\u{70ED}\u{5EA6}\u{8F83}\u{9AD8}";
    } elseif ($freshBonus >= 10) {
        $reason = "\u{6700}\u{65B0}\u{53D1}\u{5E03}\u{FF0C}\u{5185}\u{5BB9}\u{8F83}\u{65B0}";
    } else {
        $reason = "\u{4F60}\u{53EF}\u{80FD}\u{611F}\u{5174}\u{8DA3}";
    }

    $post['score'] = round($score, 2);
    $post['recommended_reason'] = $reason;
    $post['liked_by_me'] = $likedByMe;
    $post['category_id'] = $idBySlug[$category] ?? 0;
    $post['is_anonymous'] = !empty($post['is_anonymous']) ? 1 : 0;
    if ($post['is_anonymous'] === 1) {
        $post['user_nickname'] = "\u{533F}\u{540D}\u{7528}\u{6237}";
        $post['user_avatar'] = null;
    }
    $scored[] = $post;
}

usort($scored, static function (array $a, array $b): int {
    if ((float) $a['score'] === (float) $b['score']) {
        return strcmp((string) ($b['created_at'] ?? ''), (string) ($a['created_at'] ?? ''));
    }
    return ((float) $a['score'] < (float) $b['score']) ? 1 : -1;
});

$result = array_slice($scored, 0, $limit);

echo json_encode([
    'code' => 1,
    'data' => $result,
    'profile' => [
        'active_score' => (int) ($snapshot['active_score'] ?? 0),
        'favorite_category' => $snapshot['favorite_category'] ?? '',
        'favorite_category_label' => $snapshot['favorite_category_label'] ?? '',
        'profile_stage_label' => $snapshot['profile_stage_label'] ?? '',
        'top_keywords' => $topKeywords,
    ],
], JSON_UNESCAPED_UNICODE);
