<?php
// Shared by both PHP endpoints. No credentials or session IDs are returned.
function admin_config() {
    $path = __DIR__ . '/site-admin.config.php';
    return is_file($path) ? require $path : array();
}
function admin_start() {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    session_name($secure ? '__Host-storefront_admin' : 'storefront_admin');
    session_set_cookie_params(array('lifetime' => 28800, 'path' => '/', 'secure' => $secure, 'httponly' => true, 'samesite' => 'Strict'));
    session_start();
}
function admin_valid($config) {
    return !empty($config['password_hash']) && ($_SESSION['expires'] ?? 0) > time()
        && hash_equals(hash('sha256', ($config['username'] ?? 'admin') . $config['password_hash']), $_SESSION['version'] ?? '');
}
function admin_same_origin() {
    if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') return false;
    if (empty($_SERVER['HTTP_ORIGIN'])) return true;
    $origin = parse_url($_SERVER['HTTP_ORIGIN']);
    if (!$origin || empty($origin['host'])) return false;
    return $origin['host'] . (isset($origin['port']) ? ':' . $origin['port'] : '') === ($_SERVER['HTTP_HOST'] ?? '');
}
