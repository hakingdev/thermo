<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
function site_reply($code, $data) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
$configPath = __DIR__ . '/site-admin.config.php';
$config = is_file($configPath) ? require $configPath : array();
$hash = $config['password_hash'] ?? '';
$stateFile = $config['state_file'] ?? dirname(__DIR__) . '/site-state.json';
$configured = !empty($hash);
$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, array('GET', 'POST'), true)) { header('Allow: GET, POST'); site_reply(405, array('error' => 'method')); }
if ($method === 'POST') {
    if (!$configured) site_reply(503, array('error' => 'not_configured'));
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) site_reply(415, array('error' => 'content_type'));
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    $password = strpos($auth, 'Bearer ') === 0 ? substr($auth, 7) : '';
    if (!password_verify($password, $hash)) site_reply(401, array('error' => 'unauthorized'));
    $raw = file_get_contents('php://input', false, null, 0, 2049);
    if (strlen($raw) > 2048) site_reply(413, array('error' => 'body_size'));
    $input = json_decode($raw, true);
    if (!is_array($input)) site_reply(400, array('error' => 'invalid_json'));
    if (!in_array($input['site'] ?? '', array('columbia', 'kryga'), true)) site_reply(422, array('error' => 'site'));
}
$state = array('site' => 'kryga', 'updatedAt' => null);
if ($method === 'GET' && is_file($stateFile)) {
    $handle = @fopen($stateFile, 'r');
    if (!$handle || !flock($handle, LOCK_SH)) site_reply(503, array('error' => 'storage'));
    $state = json_decode(stream_get_contents($handle), true);
    flock($handle, LOCK_UN); fclose($handle);
    if (!is_array($state) || !in_array($state['site'] ?? '', array('columbia', 'kryga'), true)) site_reply(503, array('error' => 'storage'));
}
if ($method === 'POST') {
    $state = array('site' => $input['site'], 'updatedAt' => gmdate('Y-m-d\TH:i:s\Z'));
    // Lock a separate file; atomic rename keeps the previous valid state on write failure.
    $lock = @fopen($stateFile . '.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX)) site_reply(503, array('error' => 'storage'));
    $temporary = @tempnam(dirname($stateFile), '.site-');
    $written = $temporary && file_put_contents($temporary, json_encode($state)) !== false;
    if ($written) { @chmod($temporary, 0600); $written = @rename($temporary, $stateFile); }
    if (!$written && $temporary) @unlink($temporary);
    flock($lock, LOCK_UN); fclose($lock);
    if (!$written) site_reply(503, array('error' => 'storage'));
}
site_reply(200, array_merge($state, array('configured' => $configured, 'requiresPassword' => true, 'local' => false)));
