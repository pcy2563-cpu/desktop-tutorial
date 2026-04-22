<?php

if (!function_exists('cc_slug_to_category_id')) {
    function cc_slug_to_category_id(string $slug): int
    {
        $key = strtolower(trim($slug));
        if ($key === 'study') {
            return 1;
        }
        if ($key === 'life') {
            return 2;
        }
        if ($key === 'used' || $key === 'secondhand') {
            return 3;
        }
        if ($key === 'activity') {
            return 4;
        }
        return 0;
    }
}

if (!function_exists('cc_category_label')) {
    function cc_category_label(string $slug): string
    {
        $key = strtolower(trim($slug));
        if ($key === 'study') {
            return '学习';
        }
        if ($key === 'life') {
            return '生活';
        }
        if ($key === 'used' || $key === 'secondhand') {
            return '二手';
        }
        if ($key === 'activity') {
            return '活动';
        }
        return $slug !== '' ? $slug : '其他';
    }
}

if (!function_exists('cc_summarize_text')) {
    function cc_summarize_text(string $text, int $maxLength = 86): string
    {
        $value = trim(preg_replace('/\s+/u', ' ', $text));
        if ($value === '') {
            return '';
        }

        if (function_exists('mb_strlen') && function_exists('mb_substr')) {
            if (mb_strlen($value, 'UTF-8') <= $maxLength) {
                return $value;
            }
            return mb_substr($value, 0, $maxLength, 'UTF-8') . '...';
        }

        if (strlen($value) <= $maxLength) {
            return $value;
        }
        return substr($value, 0, $maxLength) . '...';
    }
}

if (!function_exists('cc_parse_images')) {
    function cc_parse_images($raw, int $limit = 9): array
    {
        if (!$raw) {
            return [];
        }

        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
        } else {
            $decoded = $raw;
        }

        if (!is_array($decoded)) {
            return [];
        }

        $items = array_values(array_filter($decoded, static function ($item) {
            return is_string($item) && preg_match('#^/uploads/forum/#', trim($item));
        }));

        return array_slice($items, 0, max(0, $limit));
    }
}

if (!function_exists('cc_assert_valid_user')) {
    function cc_assert_valid_user(PDO $pdo, int $userId): array
    {
        if ($userId <= 0) {
            echo json_encode(['code' => 0, 'msg' => '请先登录'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $pdo->prepare(
            "SELECT id, username, nickname, phone, avatar, role, is_muted
             FROM users
             WHERE id = ?
             LIMIT 1"
        );
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$user) {
            echo json_encode(['code' => 0, 'msg' => '用户不存在'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        return $user;
    }
}

if (!function_exists('cc_fetch_liked_post_map')) {
    function cc_fetch_liked_post_map(PDO $pdo, int $userId, array $postIds): array
    {
        $postIds = array_values(array_filter(array_map('intval', $postIds), static function ($value) {
            return $value > 0;
        }));

        if ($userId <= 0 || empty($postIds)) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($postIds), '?'));
        $stmt = $pdo->prepare(
            "SELECT post_id
             FROM forum_likes
             WHERE user_id = ? AND post_id IN ($placeholders)"
        );
        $stmt->execute(array_merge([$userId], $postIds));

        $likedMap = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $likedMap[(int) ($row['post_id'] ?? 0)] = 1;
        }

        return $likedMap;
    }
}

if (!function_exists('cc_normalize_post_row')) {
    function cc_normalize_post_row(array $row, array $likedMap = []): array
    {
        $category = strtolower(trim((string) ($row['category'] ?? '')));
        $row['category_id'] = cc_slug_to_category_id($category);
        $row['category_label'] = cc_category_label($category);
        $row['is_anonymous'] = !empty($row['is_anonymous']) ? 1 : 0;
        $row['liked_by_me'] = !empty($likedMap[(int) ($row['id'] ?? 0)]) ? 1 : 0;
        if ($row['is_anonymous'] === 1) {
            $row['user_nickname'] = '匿名用户';
            $row['user_avatar'] = null;
        }

        return $row;
    }
}

if (!function_exists('cc_normalize_actor')) {
    function cc_normalize_actor(array $row, string $flagField = 'is_anonymous'): array
    {
        $row[$flagField] = !empty($row[$flagField]) ? 1 : 0;
        if ((int) $row[$flagField] === 1) {
            $row['user_nickname'] = '匿名用户';
            $row['user_avatar'] = null;
        } elseif (empty($row['user_nickname'])) {
            $row['user_nickname'] = '论坛用户';
        }

        $category = strtolower(trim((string) ($row['category'] ?? '')));
        $row['category_id'] = cc_slug_to_category_id($category);
        $row['category_label'] = cc_category_label($category);

        return $row;
    }
}
