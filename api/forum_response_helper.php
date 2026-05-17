<?php

if (!function_exists('forum_u')) {
    function forum_u(string $escaped): string
    {
        $decoded = json_decode('"' . $escaped . '"');
        return is_string($decoded) ? $decoded : $escaped;
    }
}

if (!function_exists('forum_json')) {
    function forum_json(array $payload): void
    {
        if (!isset($payload['code'])) {
            $payload['code'] = 1;
        }
        if (!isset($payload['msg'])) {
            $payload['msg'] = $payload['code'] ? 'ok' : 'error';
        }
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

if (!function_exists('forum_parse_images')) {
    function forum_parse_images($raw, int $limit = 9): array
    {
        if (is_array($raw)) {
            $decoded = $raw;
        } elseif (is_string($raw) && trim($raw) !== '') {
            $decoded = json_decode($raw, true);
            if (!is_array($decoded)) {
                $decoded = preg_split('/\s*,\s*/', $raw);
            }
        } else {
            $decoded = [];
        }

        $items = [];
        foreach ($decoded as $item) {
            if (!is_string($item)) {
                continue;
            }
            $path = trim($item);
            if (preg_match('#^/uploads/forum/[a-zA-Z0-9/_\.-]+\.(jpe?g|png|webp)$#i', $path)) {
                $items[] = $path;
            }
        }

        return array_slice(array_values(array_unique($items)), 0, max(0, $limit));
    }
}

if (!function_exists('forum_variant_path')) {
    function forum_variant_path(string $path, string $suffix): string
    {
        $dot = strrpos($path, '.');
        if ($dot === false) {
            return $path;
        }
        return substr($path, 0, $dot) . $suffix . substr($path, $dot);
    }
}

if (!function_exists('forum_existing_image_variants')) {
    function forum_existing_image_variants(array $images, string $suffix): array
    {
        $root = dirname(__DIR__);
        $result = [];
        foreach ($images as $image) {
            $variant = forum_variant_path($image, $suffix);
            $result[] = is_file($root . $variant) ? $variant : $image;
        }
        return $result;
    }
}

if (!function_exists('forum_category_id_to_slug')) {
    function forum_category_id_to_slug(int $categoryId): string
    {
        $map = [
            1 => 'lost_found',
            2 => 'secondhand',
            3 => 'help',
            4 => 'activity',
            5 => 'confession',
            6 => 'feedback',
            7 => 'study',
        ];
        return $map[$categoryId] ?? '';
    }
}

if (!function_exists('forum_category_slug_to_id')) {
    function forum_category_slug_to_id(string $slug): int
    {
        $key = strtolower(trim($slug));
        $map = [
            'lost_found' => 1,
            'lost' => 1,
            'secondhand' => 2,
            'used' => 2,
            'help' => 3,
            'qa' => 3,
            'question' => 3,
            'activity' => 4,
            'confession' => 5,
            'feedback' => 6,
            'suggestion' => 6,
            'study' => 7,
        ];
        return $map[$key] ?? 0;
    }
}

if (!function_exists('forum_category_label')) {
    function forum_category_label(string $slug): string
    {
        $key = strtolower(trim($slug));
        $map = [
            'lost_found' => forum_u('\u5931\u7269\u62db\u9886'),
            'lost' => forum_u('\u5931\u7269\u62db\u9886'),
            'secondhand' => forum_u('\u4e8c\u624b\u4ea4\u6613'),
            'used' => forum_u('\u4e8c\u624b\u4ea4\u6613'),
            'help' => forum_u('\u95ee\u7b54\u4e92\u52a9'),
            'qa' => forum_u('\u95ee\u7b54\u4e92\u52a9'),
            'question' => forum_u('\u95ee\u7b54\u4e92\u52a9'),
            'activity' => forum_u('\u6821\u56ed\u6d3b\u52a8'),
            'confession' => forum_u('\u8868\u767d\u5899'),
            'feedback' => forum_u('\u5410\u69fd\u5efa\u8bae'),
            'suggestion' => forum_u('\u5410\u69fd\u5efa\u8bae'),
            'study' => forum_u('\u5b66\u4e60\u8d44\u6599'),
            'life' => forum_u('\u6821\u56ed\u751f\u6d3b'),
        ];
        return $map[$key] ?? ($key !== '' ? $key : forum_u('\u672a\u5206\u7c7b'));
    }
}

if (!function_exists('forum_public_post')) {
    function forum_public_post(array $row, int $viewerUserId = 0, array $likedMap = []): array
    {
        $realUserId = (int) ($row['user_id'] ?? 0);
        $isAnonymous = !empty($row['is_anonymous']) ? 1 : 0;
        $category = strtolower(trim((string) ($row['category'] ?? '')));
        $images = forum_parse_images($row['images'] ?? [], 9);

        $row['images'] = $images;
        $row['image_thumbnails'] = forum_existing_image_variants($images, '_thumb');
        $row['image_medium'] = forum_existing_image_variants($images, '_medium');
        $row['image_originals'] = $images;
        $row['category_id'] = forum_category_slug_to_id($category);
        $row['category_label'] = forum_category_label($category);
        $row['is_anonymous'] = $isAnonymous;
        $row['liked_by_me'] = !empty($likedMap[(int) ($row['id'] ?? 0)]) ? 1 : 0;
        $row['can_manage'] = ($viewerUserId > 0 && $realUserId === $viewerUserId) ? 1 : 0;

        if ($isAnonymous === 1) {
            unset($row['user_id'], $row['author_id']);
            $row['display_name'] = forum_u('\u533f\u540d\u7528\u6237');
            $row['user_nickname'] = forum_u('\u533f\u540d\u7528\u6237');
            $row['anonymous_avatar'] = 'preset:anonymous';
            $row['display_avatar'] = $row['anonymous_avatar'];
            $row['user_avatar'] = null;
            $row['author_hidden'] = 1;
        } else {
            $name = trim((string) ($row['user_nickname'] ?? $row['nickname'] ?? $row['username'] ?? ''));
            $row['display_name'] = $name !== '' ? $name : forum_u('\u8bba\u575b\u7528\u6237');
            $row['display_avatar'] = $row['user_avatar'] ?? $row['avatar'] ?? null;
            $row['author_hidden'] = 0;
        }

        return $row;
    }
}

if (!function_exists('forum_public_comment')) {
    function forum_public_comment(array $row, int $viewerUserId = 0): array
    {
        $realUserId = (int) ($row['user_id'] ?? 0);
        $isAnonymous = !empty($row['is_anonymous']) ? 1 : 0;
        $images = forum_parse_images($row['images'] ?? [], 9);

        $row['images'] = $images;
        $row['image_thumbnails'] = forum_existing_image_variants($images, '_thumb');
        $row['image_medium'] = forum_existing_image_variants($images, '_medium');
        $row['image_originals'] = $images;
        $row['is_anonymous'] = $isAnonymous;
        $row['can_manage'] = ($viewerUserId > 0 && $realUserId === $viewerUserId) ? 1 : 0;

        if ($isAnonymous === 1) {
            unset($row['user_id']);
            $row['display_name'] = forum_u('\u533f\u540d\u7528\u6237');
            $row['user_nickname'] = forum_u('\u533f\u540d\u7528\u6237');
            $row['anonymous_avatar'] = 'preset:anonymous';
            $row['display_avatar'] = $row['anonymous_avatar'];
            $row['user_avatar'] = null;
            $row['author_hidden'] = 1;
        } else {
            $name = trim((string) ($row['user_nickname'] ?? $row['nickname'] ?? $row['username'] ?? ''));
            $row['display_name'] = $name !== '' ? $name : forum_u('\u8bba\u575b\u7528\u6237');
            $row['display_avatar'] = $row['user_avatar'] ?? $row['avatar'] ?? null;
            $row['author_hidden'] = 0;
        }

        return $row;
    }
}

if (!function_exists('forum_keyword_is_sensitive')) {
    function forum_keyword_is_sensitive(string $keyword): bool
    {
        $value = trim($keyword);
        if ($value === '') {
            return true;
        }
        if (preg_match('/1[3-9]\d{9}/', $value)) {
            return true;
        }
        if (preg_match('/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/', $value)) {
            return true;
        }
        if (preg_match('/\b\d{5,12}\b/', $value)) {
            return true;
        }
        if (preg_match('/\b\d{17}[\dXx]\b/', $value)) {
            return true;
        }
        if (preg_match('/(\x{5fae}\x{4fe1}|wx|qq|\x{90ae}\x{7bb1}|\x{8eab}\x{4efd}\x{8bc1}|\x{7535}\x{8bdd}|\x{624b}\x{673a}|\x{5730}\x{5740})[:\x{ff1a}]?\s*[a-zA-Z0-9_\-@.]{3,}/iu', $value)) {
            return true;
        }
        return false;
    }
}

if (!function_exists('forum_filter_keyword_rows')) {
    function forum_filter_keyword_rows(array $rows, int $limit = 8, int $minTotal = 5): array
    {
        $result = [];
        foreach ($rows as $row) {
            $keyword = trim((string) ($row['keyword'] ?? $row['word'] ?? $row[0] ?? ''));
            $total = (int) ($row['total'] ?? $row['count'] ?? 0);
            if ($keyword === '' || $total < $minTotal || forum_keyword_is_sensitive($keyword)) {
                continue;
            }
            $result[] = [
                'keyword' => $keyword,
                'total' => $total,
            ];
            if (count($result) >= $limit) {
                break;
            }
        }
        return $result;
    }
}
