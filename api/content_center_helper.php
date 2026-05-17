<?php

require_once __DIR__ . '/forum_response_helper.php';

if (!function_exists('cc_slug_to_category_id')) {
    function cc_slug_to_category_id(string $slug): int
    {
        return forum_category_slug_to_id($slug);
    }
}

if (!function_exists('cc_category_label')) {
    function cc_category_label(string $slug): string
    {
        return forum_category_label($slug);
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
        return forum_parse_images($raw, $limit);
    }
}

if (!function_exists('cc_assert_valid_user')) {
    function cc_assert_valid_user(PDO $pdo, int $userId): array
    {
        if ($userId <= 0) {
            forum_json(['code' => 0, 'msg' => forum_u('\u8bf7\u5148\u767b\u5f55')]);
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
            forum_json(['code' => 0, 'msg' => forum_u('\u7528\u6237\u4e0d\u5b58\u5728')]);
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
    function cc_normalize_post_row(array $row, array $likedMap = [], int $viewerUserId = 0): array
    {
        return forum_public_post($row, $viewerUserId, $likedMap);
    }
}

if (!function_exists('cc_normalize_actor')) {
    function cc_normalize_actor(array $row, string $flagField = 'is_anonymous', int $viewerUserId = 0): array
    {
        if ($flagField !== 'is_anonymous' && isset($row[$flagField])) {
            $row['is_anonymous'] = $row[$flagField];
        }
        $row = forum_public_comment($row, $viewerUserId);

        $category = strtolower(trim((string) ($row['category'] ?? '')));
        $row['category_id'] = cc_slug_to_category_id($category);
        $row['category_label'] = cc_category_label($category);

        return $row;
    }
}
