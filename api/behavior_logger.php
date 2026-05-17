<?php

if (!function_exists('behavior_text')) {
    function behavior_text($value, int $maxLen = 100): string
    {
        if ($value === null) {
            return '';
        }

        $text = trim((string) $value);
        if ($text === '') {
            return '';
        }

        if (function_exists('mb_substr')) {
            return mb_substr($text, 0, $maxLen, 'UTF-8');
        }

        return substr($text, 0, $maxLen);
    }
}

if (!function_exists('log_behavior')) {
    function log_behavior(PDO $pdo, array $payload): void
    {
        $behaviorType = behavior_text($payload['behavior_type'] ?? '', 50);
        if ($behaviorType === '') {
            return;
        }

        $userId = isset($payload['user_id']) ? (int) $payload['user_id'] : 0;
        $userId = $userId > 0 ? $userId : null;
        $targetType = behavior_text($payload['target_type'] ?? '', 30);
        $targetType = $targetType !== '' ? $targetType : null;
        $targetId = isset($payload['target_id']) ? (int) $payload['target_id'] : 0;
        $targetId = $targetId > 0 ? $targetId : null;
        $category = behavior_text($payload['category'] ?? '', 30);
        $category = $category !== '' ? $category : null;
        $keyword = behavior_text($payload['keyword'] ?? '', 100);
        $keyword = $keyword !== '' ? $keyword : null;
        $stayDuration = isset($payload['stay_duration']) ? max(0, min(86400, (int) $payload['stay_duration'])) : 0;
        $extraData = null;

        if (array_key_exists('extra_data', $payload) && $payload['extra_data'] !== null && $payload['extra_data'] !== '') {
            if (is_array($payload['extra_data']) || is_object($payload['extra_data'])) {
                $encoded = json_encode($payload['extra_data'], JSON_UNESCAPED_UNICODE);
                if ($encoded !== false) {
                    $extraData = behavior_text($encoded, 2000);
                }
            } else {
                $extraData = behavior_text($payload['extra_data'], 2000);
            }
        }

        try {
            $stmt = $pdo->prepare(
                'INSERT INTO user_behavior_logs (user_id, behavior_type, target_type, target_id, category, keyword, stay_duration, extra_data)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $userId,
                $behaviorType,
                $targetType,
                $targetId,
                $category,
                $keyword,
                $stayDuration,
                $extraData,
            ]);
        } catch (Throwable $e) {
        }
    }
}
