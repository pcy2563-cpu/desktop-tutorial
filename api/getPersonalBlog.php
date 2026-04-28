<?php
include 'config.php';
include 'personal_blog_helper.php';

echo json_encode([
    'code' => 1,
    'data' => read_personal_blog_payload($pdo),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
