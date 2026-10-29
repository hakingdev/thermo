<?php
require_once __DIR__ . '/admin-session.php';
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
    if (!admin_same_origin()) site_reply(403, array('error' => 'origin'));
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) site_reply(415, array('error' => 'content_type'));
    admin_start();
    if (!admin_valid($config)) site_reply(401, array('error' => 'unauthorized'));
    $raw = file_get_contents('php://input', false, null, 0, 2049);
    if (strlen($raw) > 2048) site_reply(413, array('error' => 'body_size'));
    $input = json_decode($raw, true);
    if (!is_array($input)) site_reply(400, array('error' => 'invalid_json'));
    if (isset($input['bootsSite']) && !in_array($input['bootsSite'], array('columbia', 'kryga'), true)) site_reply(422, array('error' => 'bootsSite'));
    if (!in_array($input['site'] ?? '', array('columbia', 'kryga', 'boots'), true)) site_reply(422, array('error' => 'site'));
}
$state = array('site' => 'kryga', 'bootsSite' => 'kryga', 'updatedAt' => null);
if (is_file($stateFile)) {
    $handle = @fopen($stateFile, 'r');
    if (!$handle || !flock($handle, LOCK_SH)) site_reply(503, array('error' => 'storage'));
    $state = json_decode(stream_get_contents($handle), true);
    flock($handle, LOCK_UN); fclose($handle);
    if (!is_array($state) || !in_array($state['site'] ?? '', array('columbia', 'kryga', 'boots'), true)) site_reply(503, array('error' => 'storage'));
}
if (isset($state['bootsSite']) && !in_array($state['bootsSite'], array('columbia', 'kryga'), true)) site_reply(503, array('error' => 'storage'));
$state['bootsSite'] = $state['bootsSite'] ?? 'kryga';
if ($method === 'POST') {
    $state = array('site' => $input['site'], 'bootsSite' => $input['bootsSite'] ?? $state['bootsSite'], 'updatedAt' => gmdate('Y-m-d\TH:i:s\Z'));
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
site_reply(200, array_merge($state, array('configured' => $configured, 'requiresLogin' => true, 'local' => false)));
