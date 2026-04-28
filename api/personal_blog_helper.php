<?php

function ensure_site_settings_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS site_settings (
            setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
            setting_value LONGTEXT NULL,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );

    try {
        $pdo->exec("ALTER TABLE site_settings MODIFY setting_value LONGTEXT NULL");
    } catch (Throwable $e) {
    }
}

function personal_blog_setting_key(): string
{
    return 'personal_blog_payload_v1';
}

function blog_text($value, int $maxLength = 200, bool $multiline = false): string
{
    $text = trim((string) $value);
    if ($text === '') {
        return '';
    }

    if ($multiline) {
        $text = preg_replace("/\r\n?/", "\n", $text);
        $text = preg_replace("/[ \t]+\n/", "\n", $text);
        $text = preg_replace("/\n{3,}/", "\n\n", $text);
    } else {
        $text = preg_replace('/\s+/u', ' ', $text);
    }

    if (function_exists('mb_strlen') && function_exists('mb_substr')) {
        return mb_strlen($text, 'UTF-8') > $maxLength
            ? mb_substr($text, 0, $maxLength, 'UTF-8')
            : $text;
    }

    return strlen($text) > $maxLength ? substr($text, 0, $maxLength) : $text;
}

function blog_safe_url($value): string
{
    $url = trim((string) $value);
    if ($url === '') {
        return '';
    }

    return preg_match('#^(https?://|/)#i', $url) === 1 ? $url : '';
}

function blog_string_list($items, int $maxItems = 12, int $maxLength = 40): array
{
    if (!is_array($items)) {
        return [];
    }

    $result = [];
    foreach ($items as $item) {
        $text = blog_text($item, $maxLength, false);
        if ($text === '') {
            continue;
        }
        $result[] = $text;
        if (count($result) >= $maxItems) {
            break;
        }
    }

    return array_values(array_unique($result));
}

function blog_image_list($items, int $maxItems = 9): array
{
    if (!is_array($items)) {
        return [];
    }

    $result = [];
    foreach ($items as $item) {
        $url = blog_safe_url($item);
        if ($url === '') {
            continue;
        }
        $result[] = $url;
        if (count($result) >= $maxItems) {
            break;
        }
    }

    return array_values(array_unique($result));
}

function blog_metric_list($items): array
{
    if (!is_array($items)) {
        return [];
    }

    $result = [];
    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }

        $label = blog_text($item['label'] ?? '', 24);
        $value = blog_text($item['value'] ?? '', 24);
        $note = blog_text($item['note'] ?? '', 90);
        if ($label === '' || $value === '') {
            continue;
        }

        $result[] = [
            'label' => $label,
            'value' => $value,
            'note' => $note,
        ];

        if (count($result) >= 8) {
            break;
        }
    }

    return $result;
}

function blog_link_list($items, int $maxItems = 6): array
{
    if (!is_array($items)) {
        return [];
    }

    $result = [];
    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }

        $label = blog_text($item['label'] ?? '', 24);
        $url = blog_safe_url($item['url'] ?? '');
        if ($label === '' || $url === '') {
            continue;
        }

        $result[] = [
            'label' => $label,
            'url' => $url,
        ];

        if (count($result) >= $maxItems) {
            break;
        }
    }

    return $result;
}

function blog_article_list($items): array
{
    if (!is_array($items)) {
        return [];
    }

    $result = [];
    foreach ($items as $index => $item) {
        if (!is_array($item)) {
            continue;
        }

        $title = blog_text($item['title'] ?? '', 60);
        $summary = blog_text($item['summary'] ?? '', 260, true);
        $content = blog_text($item['content'] ?? '', 12000, true);
        if ($title === '' || $summary === '') {
            continue;
        }

        $result[] = [
            'id' => blog_text($item['id'] ?? ('article-' . ($index + 1)), 48),
            'title' => $title,
            'category' => blog_text($item['category'] ?? '', 24),
            'summary' => $summary,
            'content' => $content !== '' ? $content : $summary,
            'cover' => blog_safe_url($item['cover'] ?? ''),
            'updatedAt' => blog_text($item['updatedAt'] ?? '', 24),
            'readTime' => blog_text($item['readTime'] ?? '', 20),
            'tags' => blog_string_list($item['tags'] ?? [], 10, 18),
        ];

        if (count($result) >= 40) {
            break;
        }
    }

    return $result;
}

function blog_project_list($items): array
{
    if (!is_array($items)) {
        return [];
    }

    $result = [];
    foreach ($items as $index => $item) {
        if (!is_array($item)) {
            continue;
        }

        $title = blog_text($item['title'] ?? '', 60);
        $summary = blog_text($item['summary'] ?? '', 320, true);
        if ($title === '' || $summary === '') {
            continue;
        }

        $repoName = blog_text($item['repoName'] ?? '', 60);
        $result[] = [
            'id' => blog_text($item['id'] ?? ('project-' . ($index + 1)), 48),
            'title' => $title,
            'repoName' => $repoName !== '' ? $repoName : $title,
            'repoUrl' => blog_safe_url($item['repoUrl'] ?? ''),
            'period' => blog_text($item['period'] ?? '', 30),
            'updatedAt' => blog_text($item['updatedAt'] ?? '', 24),
            'status' => blog_text($item['status'] ?? '', 20),
            'visibility' => blog_text($item['visibility'] ?? '', 16),
            'branch' => blog_text($item['branch'] ?? '', 20),
            'version' => blog_text($item['version'] ?? '', 20),
            'stars' => blog_text($item['stars'] ?? '', 12),
            'commits' => blog_text($item['commits'] ?? '', 12),
            'summary' => $summary,
            'cover' => blog_safe_url($item['cover'] ?? ''),
            'stack' => blog_string_list($item['stack'] ?? [], 12, 24),
            'highlights' => blog_string_list($item['highlights'] ?? [], 12, 90),
            'links' => blog_link_list($item['links'] ?? [], 6),
        ];

        if (count($result) >= 24) {
            break;
        }
    }

    return $result;
}

function blog_skill_group_list($items): array
{
    if (!is_array($items)) {
        return [];
    }

    $result = [];
    foreach ($items as $index => $item) {
        if (!is_array($item)) {
            continue;
        }

        $title = blog_text($item['title'] ?? '', 32);
        $desc = blog_text($item['desc'] ?? '', 160, true);
        $skills = [];

        if (isset($item['skills']) && is_array($item['skills'])) {
            foreach ($item['skills'] as $skillIndex => $skill) {
                if (!is_array($skill)) {
                    continue;
                }

                $name = blog_text($skill['name'] ?? '', 28);
                if ($name === '') {
                    continue;
                }

                $skills[] = [
                    'id' => blog_text($skill['id'] ?? ('skill-' . ($index + 1) . '-' . ($skillIndex + 1)), 48),
                    'name' => $name,
                    'level' => max(0, min(100, (int) ($skill['level'] ?? 0))),
                    'note' => blog_text($skill['note'] ?? '', 100, true),
                ];

                if (count($skills) >= 16) {
                    break;
                }
            }
        }

        if ($title === '') {
            continue;
        }

        $result[] = [
            'id' => blog_text($item['id'] ?? ('group-' . ($index + 1)), 48),
            'title' => $title,
            'desc' => $desc,
            'skills' => $skills,
        ];

        if (count($result) >= 10) {
            break;
        }
    }

    return $result;
}

function blog_note_chapter_list($items, string $fallbackSummary = ''): array
{
    if (!is_array($items)) {
        $items = [];
    }

    $result = [];
    foreach ($items as $index => $item) {
        if (!is_array($item)) {
            continue;
        }

        $title = blog_text($item['title'] ?? '', 40);
        $content = blog_text($item['content'] ?? '', 12000, true);
        if ($title === '' || $content === '') {
            continue;
        }

        $result[] = [
            'id' => blog_text($item['id'] ?? ('chapter-' . ($index + 1)), 48),
            'title' => $title,
            'content' => $content,
        ];

        if (count($result) >= 20) {
            break;
        }
    }

    if (!empty($result)) {
        return $result;
    }

    if ($fallbackSummary !== '') {
        return [[
            'id' => 'chapter-1',
            'title' => '正文',
            'content' => $fallbackSummary,
        ]];
    }

    return [];
}

function blog_note_list($items): array
{
    if (!is_array($items)) {
        return [];
    }

    $result = [];
    foreach ($items as $index => $item) {
        if (!is_array($item)) {
            continue;
        }

        $title = blog_text($item['title'] ?? '', 60);
        $summary = blog_text($item['summary'] ?? '', 220, true);
        if ($title === '' || $summary === '') {
            continue;
        }

        $chapters = blog_note_chapter_list($item['chapters'] ?? [], $summary);
        $result[] = [
            'id' => blog_text($item['id'] ?? ('note-' . ($index + 1)), 48),
            'title' => $title,
            'category' => blog_text($item['category'] ?? '', 24),
            'summary' => $summary,
            'fileUrl' => blog_safe_url($item['fileUrl'] ?? ''),
            'cover' => blog_safe_url($item['cover'] ?? ''),
            'updatedAt' => blog_text($item['updatedAt'] ?? '', 24),
            'tags' => blog_string_list($item['tags'] ?? [], 10, 18),
            'chapters' => $chapters,
        ];

        if (count($result) >= 30) {
            break;
        }
    }

    return $result;
}

function blog_reflection_list($items): array
{
    if (!is_array($items)) {
        return [];
    }

    $result = [];
    foreach ($items as $index => $item) {
        if (!is_array($item)) {
            continue;
        }

        $title = blog_text($item['title'] ?? '', 60);
        $excerpt = blog_text($item['excerpt'] ?? '', 300, true);
        $content = blog_text($item['content'] ?? '', 12000, true);
        if ($title === '' || $excerpt === '') {
            continue;
        }

        $result[] = [
            'id' => blog_text($item['id'] ?? ('reflection-' . ($index + 1)), 48),
            'title' => $title,
            'date' => blog_text($item['date'] ?? '', 24),
            'time' => blog_text($item['time'] ?? '', 16),
            'location' => blog_text($item['location'] ?? '', 30),
            'mood' => blog_text($item['mood'] ?? '', 16),
            'excerpt' => $excerpt,
            'content' => $content !== '' ? $content : $excerpt,
            'tags' => blog_string_list($item['tags'] ?? [], 10, 18),
            'images' => blog_image_list($item['images'] ?? [], 9),
        ];

        if (count($result) >= 40) {
            break;
        }
    }

    return $result;
}

function blog_timeline_list($items): array
{
    if (!is_array($items)) {
        return [];
    }

    $result = [];
    foreach ($items as $index => $item) {
        if (!is_array($item)) {
            continue;
        }

        $year = blog_text($item['year'] ?? '', 24);
        $label = blog_text($item['label'] ?? '', 50);
        $desc = blog_text($item['desc'] ?? '', 220, true);
        if ($year === '' || $label === '' || $desc === '') {
            continue;
        }

        $result[] = [
            'id' => blog_text($item['id'] ?? ('timeline-' . ($index + 1)), 48),
            'year' => $year,
            'label' => $label,
            'desc' => $desc,
            'filter' => blog_text($item['filter'] ?? '', 24),
            'route' => blog_text($item['route'] ?? 'reflections', 20),
        ];

        if (count($result) >= 30) {
            break;
        }
    }

    return $result;
}

function build_default_personal_blog_payload(): array
{
    return [
        'hero' => [
            'name' => '浅显博客',
            'title' => '把学习、项目和思考整理成长期可复用的内容资产',
            'summary' => '浅显博客是一个学习型博客项目模板。它适合沉淀文章、项目、技能树、笔记、感悟和成长时间线，默认不预置任何个人内容。',
            'mantra' => '克制、耐看、适合长期学习记录。',
            'githubUrl' => '',
            'contactLabel' => '',
            'contactUrl' => '',
        ],
        'metrics' => [],
        'currentFocus' => [],
        'articles' => [],
        'projects' => [],
        'skillGroups' => [],
        'notes' => [],
        'reflections' => [],
        'timeline' => [],
    ];
}

function sanitize_personal_blog_payload(array $payload): array
{
    $defaults = build_default_personal_blog_payload();
    $heroInput = isset($payload['hero']) && is_array($payload['hero']) ? $payload['hero'] : [];

    $hero = [
        'name' => blog_text($heroInput['name'] ?? $defaults['hero']['name'], 30),
        'title' => blog_text($heroInput['title'] ?? $defaults['hero']['title'], 90),
        'summary' => blog_text($heroInput['summary'] ?? $defaults['hero']['summary'], 320, true),
        'mantra' => blog_text($heroInput['mantra'] ?? $defaults['hero']['mantra'], 80),
        'githubUrl' => blog_safe_url($heroInput['githubUrl'] ?? $defaults['hero']['githubUrl']),
        'contactLabel' => blog_text($heroInput['contactLabel'] ?? $defaults['hero']['contactLabel'], 24),
        'contactUrl' => blog_safe_url($heroInput['contactUrl'] ?? $defaults['hero']['contactUrl']),
    ];

    $metrics = blog_metric_list($payload['metrics'] ?? $defaults['metrics']);
    $currentFocus = blog_string_list($payload['currentFocus'] ?? $defaults['currentFocus'], 10, 120);
    $articles = blog_article_list($payload['articles'] ?? $defaults['articles']);
    $projects = blog_project_list($payload['projects'] ?? $defaults['projects']);
    $skillGroups = blog_skill_group_list($payload['skillGroups'] ?? $defaults['skillGroups']);
    $notes = blog_note_list($payload['notes'] ?? $defaults['notes']);
    $reflections = blog_reflection_list($payload['reflections'] ?? $defaults['reflections']);
    $timeline = blog_timeline_list($payload['timeline'] ?? $defaults['timeline']);

    return [
        'hero' => $hero,
        'metrics' => $metrics,
        'currentFocus' => $currentFocus,
        'articles' => $articles,
        'projects' => $projects,
        'skillGroups' => $skillGroups,
        'notes' => $notes,
        'reflections' => $reflections,
        'timeline' => $timeline,
    ];
}

function read_personal_blog_payload(PDO $pdo): array
{
    ensure_site_settings_table($pdo);

    $stmt = $pdo->prepare('SELECT setting_value FROM site_settings WHERE setting_key = ? LIMIT 1');
    $stmt->execute([personal_blog_setting_key()]);
    $raw = $stmt->fetchColumn();

    if (!is_string($raw) || trim($raw) === '') {
        return build_default_personal_blog_payload();
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return build_default_personal_blog_payload();
    }

    return sanitize_personal_blog_payload($decoded);
}

function save_personal_blog_payload(PDO $pdo, array $payload): array
{
    ensure_site_settings_table($pdo);
    $sanitized = sanitize_personal_blog_payload($payload);

    $stmt = $pdo->prepare(
        "INSERT INTO site_settings (setting_key, setting_value, updated_at)
         VALUES (?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           setting_value = VALUES(setting_value),
           updated_at = NOW()"
    );
    $stmt->execute([
        personal_blog_setting_key(),
        json_encode($sanitized, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]);

    return $sanitized;
}
