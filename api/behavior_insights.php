<?php

if (!function_exists('behavior_mb_length')) {
    function behavior_mb_length(string $text): int
    {
        return function_exists('mb_strlen') ? mb_strlen($text, 'UTF-8') : strlen($text);
    }
}

if (!function_exists('behavior_type_weights')) {
    function behavior_type_weights(): array
    {
        return [
            'search' => 2,
            'browse_category' => 2,
            'view_post' => 3,
            'like_post' => 4,
            'comment_post' => 5,
            'create_post' => 6,
            'unlike_post' => -1,
        ];
    }
}

if (!function_exists('behavior_category_label')) {
    function behavior_category_label(string $slug): string
    {
        $key = strtolower(trim($slug));
        if ($key === 'study') {
            return "\u{5B66}\u{4E60}";
        }
        if ($key === 'life') {
            return "\u{751F}\u{6D3B}";
        }
        if ($key === 'used' || $key === 'secondhand') {
            return "\u{4E8C}\u{624B}";
        }
        if ($key === 'activity') {
            return "\u{6D3B}\u{52A8}";
        }
        return $slug !== '' ? $slug : "\u{5176}\u{4ED6}";
    }
}

if (!function_exists('behavior_type_label')) {
    function behavior_type_label(string $type): string
    {
        $map = [
            'search' => "\u{4E3B}\u{52A8}\u{641C}\u{7D22}",
            'browse_category' => "\u{6D4F}\u{89C8}\u{5185}\u{5BB9}\u{6D41}",
            'view_post' => "\u{67E5}\u{770B}\u{5E16}\u{5B50}",
            'like_post' => "\u{70B9}\u{8D5E}\u{5E16}\u{5B50}",
            'unlike_post' => "\u{53D6}\u{6D88}\u{70B9}\u{8D5E}",
            'comment_post' => "\u{53C2}\u{4E0E}\u{8BC4}\u{8BBA}",
            'create_post' => "\u{53D1}\u{5E03}\u{5E16}\u{5B50}",
        ];
        return $map[$type] ?? "\u{6D4F}\u{89C8}\u{5185}\u{5BB9}";
    }
}

if (!function_exists('behavior_profile_stage_label')) {
    function behavior_profile_stage_label(int $activeScore, int $recentActiveDays, int $keywordCount): string
    {
        if ($activeScore >= 60 || $recentActiveDays >= 10) {
            return "\u{6DF1}\u{5EA6}\u{6D3B}\u{8DC3}";
        }
        if ($activeScore >= 25 || $recentActiveDays >= 5 || $keywordCount >= 3) {
            return "\u{7A33}\u{5B9A}\u{6210}\u{578B}";
        }
        if ($activeScore > 0 || $keywordCount > 0) {
            return "\u{6301}\u{7EED}\u{6210}\u{578B}";
        }
        return "\u{753B}\u{50CF}\u{5F85}\u{5EFA}\u{7ACB}";
    }
}

if (!function_exists('behavior_preference_rows')) {
    function behavior_preference_rows(array $behaviorCounts): array
    {
        $weights = behavior_type_weights();
        $types = ['create_post', 'comment_post', 'like_post', 'view_post', 'search', 'browse_category'];
        $rows = [];

        foreach ($types as $type) {
            $count = (int) ($behaviorCounts[$type] ?? 0);
            if ($count <= 0) {
                continue;
            }

            $rows[] = [
                'behavior_type' => $type,
                'label' => behavior_type_label($type),
                'score' => $count * max(1, (int) ($weights[$type] ?? 1)),
            ];
        }

        usort($rows, static function (array $a, array $b): int {
            return (int) ($b['score'] ?? 0) <=> (int) ($a['score'] ?? 0);
        });

        return array_slice($rows, 0, 5);
    }
}

if (!function_exists('behavior_extract_keywords')) {
    function behavior_extract_keywords(string $text): array
    {
        $text = trim($text);
        if ($text === '') {
            return [];
        }

        $parts = preg_split('/[\s\p{P}\p{S}]+/u', $text) ?: [];
        $tokens = [];
        foreach ($parts as $part) {
            $word = trim((string) $part);
            if ($word === '' || behavior_mb_length($word) < 2) {
                continue;
            }
            $tokens[] = $word;
            if (count($tokens) >= 8) {
                break;
            }
        }

        if (empty($tokens) && behavior_mb_length($text) >= 2) {
            $tokens[] = $text;
        }

        return array_values(array_unique($tokens));
    }
}

if (!function_exists('behavior_add_keyword_scores')) {
    function behavior_add_keyword_scores(array &$keywordScores, array $keywords, int $weight): void
    {
        foreach ($keywords as $keyword) {
            if (!isset($keywordScores[$keyword])) {
                $keywordScores[$keyword] = 0;
            }
            $keywordScores[$keyword] += $weight;
        }
    }
}

if (!function_exists('behavior_seed_legacy_snapshot')) {
    function behavior_seed_legacy_snapshot(PDO $pdo, int $userId, array &$behaviorCounts, array &$categoryScores, array &$keywordScores, array &$recentBehaviors): void
    {
        $postStmt = $pdo->prepare(
            "SELECT category, title, content, created_at
             FROM forum_posts
             WHERE user_id = ? AND status = 'normal'
             ORDER BY created_at DESC
             LIMIT 20"
        );
        $postStmt->execute([$userId]);
        foreach ($postStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $category = strtolower(trim((string) ($row['category'] ?? '')));
            if ($category !== '') {
                $categoryScores[$category] = ($categoryScores[$category] ?? 0) + 6;
            }
            $behaviorCounts['create_post'] = ($behaviorCounts['create_post'] ?? 0) + 1;
            behavior_add_keyword_scores($keywordScores, behavior_extract_keywords((string) ($row['title'] ?? '')), 3);
            behavior_add_keyword_scores($keywordScores, behavior_extract_keywords((string) ($row['content'] ?? '')), 1);
            if (count($recentBehaviors) < 6) {
                $recentBehaviors[] = [
                    'behavior_type' => 'create_post',
                    'label' => behavior_type_label('create_post'),
                    'category' => $category,
                    'category_label' => behavior_category_label($category),
                    'created_at' => $row['created_at'] ?? null,
                ];
            }
        }

        $commentStmt = $pdo->prepare(
            "SELECT p.category, c.content, c.created_at
             FROM forum_comments c
             INNER JOIN forum_posts p ON p.id = c.post_id
             WHERE c.user_id = ? AND c.status = 'normal' AND p.status = 'normal'
             ORDER BY c.created_at DESC
             LIMIT 30"
        );
        $commentStmt->execute([$userId]);
        foreach ($commentStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $category = strtolower(trim((string) ($row['category'] ?? '')));
            if ($category !== '') {
                $categoryScores[$category] = ($categoryScores[$category] ?? 0) + 4;
            }
            $behaviorCounts['comment_post'] = ($behaviorCounts['comment_post'] ?? 0) + 1;
            behavior_add_keyword_scores($keywordScores, behavior_extract_keywords((string) ($row['content'] ?? '')), 1);
            if (count($recentBehaviors) < 6) {
                $recentBehaviors[] = [
                    'behavior_type' => 'comment_post',
                    'label' => behavior_type_label('comment_post'),
                    'category' => $category,
                    'category_label' => behavior_category_label($category),
                    'created_at' => $row['created_at'] ?? null,
                ];
            }
        }

        $likeStmt = $pdo->prepare(
            "SELECT p.category, p.title, p.created_at
             FROM forum_likes l
             INNER JOIN forum_posts p ON p.id = l.post_id
             WHERE l.user_id = ? AND p.status = 'normal'
             ORDER BY l.id DESC
             LIMIT 30"
        );
        $likeStmt->execute([$userId]);
        foreach ($likeStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $category = strtolower(trim((string) ($row['category'] ?? '')));
            if ($category !== '') {
                $categoryScores[$category] = ($categoryScores[$category] ?? 0) + 3;
            }
            $behaviorCounts['like_post'] = ($behaviorCounts['like_post'] ?? 0) + 1;
            behavior_add_keyword_scores($keywordScores, behavior_extract_keywords((string) ($row['title'] ?? '')), 2);
            if (count($recentBehaviors) < 6) {
                $recentBehaviors[] = [
                    'behavior_type' => 'like_post',
                    'label' => behavior_type_label('like_post'),
                    'category' => $category,
                    'category_label' => behavior_category_label($category),
                    'created_at' => $row['created_at'] ?? null,
                ];
            }
        }
    }
}

if (!function_exists('get_user_behavior_snapshot')) {
    function get_user_behavior_snapshot(PDO $pdo, int $userId, int $days = 120): array
    {
        $summary = [
            'user_id' => $userId,
            'active_score' => 0,
            'favorite_category' => '',
            'favorite_category_label' => '',
            'profile_stage_label' => '',
            'recent_active_days' => 0,
            'behavior_counts' => [],
            'behavior_preferences' => [],
            'category_preferences' => [],
            'top_keywords' => [],
            'tags' => [],
            'recent_behaviors' => [],
        ];

        if ($userId <= 0) {
            return $summary;
        }

        $days = max(7, min(365, (int) $days));
        $weights = behavior_type_weights();
        $behaviorCounts = [];
        $categoryScores = [];
        $keywordScores = [];
        $recentBehaviors = [];
        $activeScore = 0;
        $recentDays = [];
        $activeSinceTs = time() - 30 * 86400;
        $hasBehaviorLogs = false;

        try {
            $stmt = $pdo->prepare(
                'SELECT behavior_type, category, keyword, created_at
                 FROM user_behavior_logs
                 WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ' . $days . ' DAY)
                 ORDER BY created_at DESC
                 LIMIT 500'
            );
            $stmt->execute([$userId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($rows as $row) {
                $hasBehaviorLogs = true;
                $type = strtolower(trim((string) ($row['behavior_type'] ?? '')));
                if ($type === '') {
                    continue;
                }
                $behaviorCounts[$type] = ($behaviorCounts[$type] ?? 0) + 1;

                $weight = (int) ($weights[$type] ?? 1);
                $activeScore += $weight > 0 ? $weight : 0;

                $category = strtolower(trim((string) ($row['category'] ?? '')));
                if ($category !== '') {
                    $categoryScores[$category] = ($categoryScores[$category] ?? 0) + max(1, $weight);
                }

                $keywords = behavior_extract_keywords((string) ($row['keyword'] ?? ''));
                behavior_add_keyword_scores($keywordScores, $keywords, max(1, $weight));

                $createdAt = $row['created_at'] ?? null;
                if ($createdAt && count($recentBehaviors) < 6) {
                    $recentBehaviors[] = [
                        'behavior_type' => $type,
                        'label' => behavior_type_label($type),
                        'category' => $category,
                        'category_label' => behavior_category_label($category),
                        'created_at' => $createdAt,
                    ];
                }

                if ($createdAt) {
                    $ts = strtotime((string) $createdAt);
                    if ($ts && $ts >= $activeSinceTs) {
                        $recentDays[date('Y-m-d', $ts)] = 1;
                    }
                }
            }
        } catch (Throwable $e) {
            $hasBehaviorLogs = false;
        }

        if (!$hasBehaviorLogs) {
            try {
                behavior_seed_legacy_snapshot($pdo, $userId, $behaviorCounts, $categoryScores, $keywordScores, $recentBehaviors);
            } catch (Throwable $e) {
            }
        }

        $activeScore = 0;
        foreach ($behaviorCounts as $type => $count) {
            $weight = (int) ($weights[$type] ?? 1);
            if ($weight > 0) {
                $activeScore += $weight * (int) $count;
            }
        }

        foreach ($recentBehaviors as $behavior) {
            $createdAt = $behavior['created_at'] ?? null;
            if (!$createdAt) {
                continue;
            }
            $ts = strtotime((string) $createdAt);
            if ($ts && $ts >= $activeSinceTs) {
                $recentDays[date('Y-m-d', $ts)] = 1;
            }
        }

        arsort($categoryScores);
        $favoriteCategory = '';
        if (!empty($categoryScores)) {
            $favoriteCategory = (string) array_key_first($categoryScores);
        }

        arsort($keywordScores);
        $topKeywords = array_slice(array_keys($keywordScores), 0, 5);
        $profileStageLabel = behavior_profile_stage_label((int) $activeScore, count($recentDays), count($topKeywords));
        $behaviorPreferences = behavior_preference_rows($behaviorCounts);

        $categoryPreferences = [];
        foreach (array_slice($categoryScores, 0, 4, true) as $category => $score) {
            $categoryPreferences[] = [
                'category' => $category,
                'label' => behavior_category_label($category),
                'score' => (int) $score,
            ];
        }

        $tags = [];
        if ($activeScore >= 60) {
            $tags[] = "\u{9AD8}\u{6D3B}\u{8DC3}\u{7528}\u{6237}";
        } elseif ($activeScore >= 25) {
            $tags[] = "\u{6301}\u{7EED}\u{6D3B}\u{8DC3}";
        } elseif ($activeScore > 0) {
            $tags[] = "\u{6210}\u{957F}\u{4E2D}\u{7528}\u{6237}";
        } else {
            $tags[] = "\u{65B0}\u{664B}\u{63A2}\u{7D22}\u{8005}";
        }

        if (($behaviorCounts['create_post'] ?? 0) >= 2) {
            $tags[] = "\u{5185}\u{5BB9}\u{521B}\u{4F5C}\u{8005}";
        }
        if (($behaviorCounts['comment_post'] ?? 0) >= 3) {
            $tags[] = "\u{4E92}\u{52A8}\u{79EF}\u{6781}";
        }
        if (($behaviorCounts['search'] ?? 0) >= 2) {
            $tags[] = "\u{68C0}\u{7D22}\u{610F}\u{56FE}\u{660E}\u{786E}";
        }
        if (($behaviorCounts['like_post'] ?? 0) >= 3) {
            $tags[] = "\u{504F}\u{597D}\u{53CD}\u{9988}\u{6E05}\u{6670}";
        }
        if (count($topKeywords) >= 3) {
            $tags[] = "\u{5173}\u{952E}\u{8BCD}\u{6837}\u{672C}\u{5145}\u{8DB3}";
        }

        $summary['active_score'] = (int) $activeScore;
        $summary['favorite_category'] = $favoriteCategory;
        $summary['favorite_category_label'] = $favoriteCategory !== '' ? behavior_category_label($favoriteCategory) : '';
        $summary['profile_stage_label'] = $profileStageLabel;
        $summary['recent_active_days'] = count($recentDays);
        $summary['behavior_counts'] = $behaviorCounts;
        $summary['behavior_preferences'] = $behaviorPreferences;
        $summary['category_preferences'] = $categoryPreferences;
        $summary['top_keywords'] = $topKeywords;
        $summary['tags'] = array_values(array_unique($tags));
        $summary['recent_behaviors'] = $recentBehaviors;

        return $summary;
    }
}
