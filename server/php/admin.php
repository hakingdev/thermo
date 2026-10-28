<?php
require_once __DIR__ . '/admin-session.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
function admin_reply($status, $data) { http_response_code($status); echo json_encode($data); exit; }
$config = admin_config();
if (empty($config['password_hash'])) admin_reply(503, array('error' => 'not_configured'));
admin_start();
$method = $_SERVER['REQUEST_METHOD'];
$username = $config['username'] ?? 'admin';
if ($method === 'GET') {
    if (!admin_valid($config)) admin_reply(401, array('error' => 'unauthorized'));
    admin_reply(200, array('username' => $username));
}
if (!in_array($method, array('POST', 'DELETE'), true)) { header('Allow: GET, POST, DELETE'); admin_reply(405, array('error' => 'method')); }
if (!admin_same_origin()) admin_reply(403, array('error' => 'origin'));
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') === false) admin_reply(415, array('error' => 'content_type'));
if ($method === 'DELETE') {
    $_SESSION = array(); session_destroy();
    $params = session_get_cookie_params();
    setcookie(session_name(), '', array('expires' => time() - 3600, 'path' => '/', 'secure' => $params['secure'], 'httponly' => true, 'samesite' => 'Strict'));
    admin_reply(200, array('ok' => true));
}
// Shared locked file outside the web root; bounded to recent IP hashes.
$rateFile = ($config['state_file'] ?? dirname(__DIR__) . '/site-state.json') . '.login-attempts';
$handle = @fopen($rateFile, 'c+');
if (!$handle || !flock($handle, LOCK_EX)) admin_reply(503, array('error' => 'storage'));
@chmod($rateFile, 0600);
$attempts = json_decode(stream_get_contents($handle), true) ?: array();
$attempts = array_filter($attempts, function ($item) { return $item['until'] > time(); });
$key = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown');
$attempts[$key] = $attempts[$key] ?? array('count' => 0, 'until' => time() + 900);
$count = ++$attempts[$key]['count'];
rewind($handle); ftruncate($handle, 0);
$saved = fwrite($handle, json_encode($attempts));
fflush($handle); flock($handle, LOCK_UN); fclose($handle);
if ($saved === false) admin_reply(503, array('error' => 'storage'));
if ($count > 10) { header('Retry-After: 900'); admin_reply(429, array('error' => 'rate_limit')); }
$raw = file_get_contents('php://input', false, null, 0, 2049);
if (strlen($raw) > 2048) admin_reply(413, array('error' => 'body_size'));
$input = json_decode($raw, true);
if (!is_array($input)) admin_reply(400, array('error' => 'invalid_json'));
$validUser = is_string($input['username'] ?? null) && hash_equals($username, $input['username']);
$validPassword = is_string($input['password'] ?? null) && password_verify($input['password'], $config['password_hash']);
if (!$validUser || !$validPassword) admin_reply(401, array('error' => 'unauthorized'));
session_regenerate_id(true);
$_SESSION = array('expires' => time() + 28800, 'version' => hash('sha256', $username . $config['password_hash']));
admin_reply(200, array('username' => $username));
