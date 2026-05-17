<?php

function get_sensitive_words() {
    return array_values(array_unique(array_merge(
        [
            "\u{52A0}\u{5FAE}\u{4FE1}",
            'vx',
            "v\u{4FE1}",
            "\u{5FAE}\u{4FE1}\u{53F7}",
            "qq\u{53F7}",
            "\u{8D4C}\u{535A}",
            "\u{535A}\u{5F69}",
            "\u{516D}\u{5408}\u{5F69}",
            "\u{88F8}\u{804A}",
            "\u{7EA6}\u{70AE}",
            "\u{63F4}\u{4EA4}",
            "\u{51B0}\u{6BD2}",
            "\u{6D77}\u{6D1B}\u{56E0}",
            "\u{51FA}\u{552E}\u{7B54}\u{6848}",
            "\u{4EE3}\u{8003}",
            "\u{67AA}\u{652F}",
            "\u{529E}\u{8BC1}",
        ],
        get_abusive_words()
    )));
}

function get_abusive_words() {
    return [
        "\u{50BB}\u{903C}",
        "\u{50BB}\u{6BD4}",
        "\u{715E}\u{7B14}",
        "\u{6C99}\u{6BD4}",
        "\u{50BB}\u{53C9}",
        "\u{8111}\u{6B8B}",
        "\u{667A}\u{969C}",
        "\u{5F31}\u{667A}",
        "\u{8D31}\u{4EBA}",
        "\u{8D31}\u{8D27}",
        "\u{5A4A}\u{5B50}",
        "\u{738B}\u{516B}\u{86CB}",
        "\u{72D7}\u{4E1C}\u{897F}",
        "\u{72D7}\u{5A18}\u{517B}\u{7684}",
        "\u{755C}\u{751F}",
        "\u{6EDA}\u{86CB}",
        "\u{6B7B}\u{5988}",
        "\u{4ED6}\u{5988}\u{7684}",
        "\u{64CD}\u{4F60}\u{5988}",
        "\u{8349}\u{4F60}\u{5988}",
        'cnm',
        'nmsl',
        'mdzz',
        'fuck',
        'shit',
        'bitch',
    ];
}

function sensitive_text_lower($text) {
    $text = (string) $text;
    return function_exists('mb_strtolower') ? mb_strtolower($text, 'UTF-8') : strtolower($text);
}

function sensitive_text_pos($haystack, $needle) {
    if ($needle === '') {
        return false;
    }
    if (function_exists('mb_strpos')) {
        return mb_strpos($haystack, $needle, 0, 'UTF-8');
    }
    return strpos($haystack, $needle);
}

function normalize_sensitive_text($text) {
    $content = sensitive_text_lower($text);
    $content = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]+/u', '', $content);
    $content = preg_replace('/[\s\p{P}\p{S}]+/u', '', $content);
    return $content === null ? '' : $content;
}

function match_sensitive_word($text) {
    $content = sensitive_text_lower($text);
    $normalizedContent = normalize_sensitive_text($text);

    foreach (get_sensitive_words() as $word) {
        $needle = sensitive_text_lower($word);
        if ($needle !== '' && sensitive_text_pos($content, $needle) !== false) {
            return $word;
        }

        $normalizedNeedle = normalize_sensitive_text($word);
        if ($normalizedNeedle !== '' && strlen($normalizedNeedle) >= 2 && sensitive_text_pos($normalizedContent, $normalizedNeedle) !== false) {
            return $word;
        }
    }

    return null;
}
