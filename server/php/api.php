<?php
/**
 * KRYGA → DarkLeads CPA — серверный прокси для React-фронта (PHP-хостинг)
 * Оффер 120151 (Термобелье), CPA ID 1317, цена 1199 грн, поток 98053
 *
 * Фронт шлёт POST /api/lead (JSON), .htaccess перенаправляет его сюда.
 * Принимает:  {name, phone, source, gender, color, size, lang, website}
 * Отвечает:   JSON {ok:true} | {ok:false, error:"..."}
 *
 * Ключ и адрес API лежат в config.php рядом (закрыт от веба через .htaccess).
 */

$config = require __DIR__ . '/config.php';

$apiKey       = $config['api_key'];
$endpoint     = $config['endpoint'];
$productId    = 120151;
$productPrice = 1199;
$streamId     = 98053;
$isCPA        = array('id' => 1317);

// Если React и PHP на разных доменах — впишите домен фронта. Если на одном — оставьте пустым.
$allowedOrigins = $config['allowed_origins'] ?? array();

header('Content-Type: application/json; charset=utf-8');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Vary: Origin');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

function reply($code, $data) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function clean($v, $max = 60) { return mb_substr(trim(preg_replace('/[\r\n\t]+/', ' ', strip_tags((string)$v))), 0, $max); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, array('ok' => false, 'error' => 'method'));

// Тело: JSON или form-data
$in = $_POST;
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
    $in = json_decode(file_get_contents('php://input'), true) ?: array();
}

// Honeypot от ботов
if (!empty($in['website'])) reply(200, array('ok' => true));

$name   = clean($in['name'] ?? '', 80);
$phone  = preg_replace('/[^\d+]/', '', (string)($in['phone'] ?? ''));
$digits = preg_replace('/\D/', '', $phone);
$source = substr((string)($in['source'] ?? ($_SERVER['HTTP_REFERER'] ?? '')), 0, 2000);

if (mb_strlen($name) < 2)                          reply(422, array('ok' => false, 'error' => 'name'));
if (strlen($digits) < 10 || strlen($digits) > 12)  reply(422, array('ok' => false, 'error' => 'phone'));

// Выбор из примерочной → комментарий для менеджера
$comment = implode('; ', array_filter(array(
    !empty($in['gender']) ? 'Стать: ' . clean($in['gender']) : '',
    !empty($in['color'])  ? 'Колір: ' . clean($in['color']) : '',
    !empty($in['size'])   ? 'Розмір: ' . clean($in['size'], 8) : '',
    !empty($in['lang'])   ? 'Мова: ' . clean($in['lang'], 4) : '',
)));

// Простейший антидубль: тот же телефон чаще раза в 10 минут не шлём
$lockDir = sys_get_temp_dir() . '/dl_locks';
@mkdir($lockDir, 0700, true);
$lock = $lockDir . '/' . md5($digits);
if (is_file($lock) && time() - filemtime($lock) < 600) reply(200, array('ok' => true, 'dup' => true));

$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'];
$ip = trim(explode(',', $ip)[0]);

$post = array(
    'api_key'       => $apiKey,
    'product_id'    => $productId,
    'stream_id'     => $streamId,
    'phone'         => $phone,
    'name'          => $name,
    'price'         => $productPrice,
    'comment'       => $comment,
    'low_price'     => 'false',
    'source'        => $source,
    'url'           => $source,
    'processedByMe' => 'false',
    'is_cpa'        => $isCPA,      // уйдёт как is_cpa[id]=1317
    'ip'            => $ip,
);

$ch = curl_init($endpoint);
curl_setopt_array($ch, array(
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query($post),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 20,
));
$out = curl_exec($ch);
$err = curl_error($ch);
if (PHP_VERSION_ID < 80000) curl_close($ch); // в PHP 8+ не нужен, в 8.5 — deprecated

// Лог заявок (закрыт от веба через .htaccess)
@file_put_contents(__DIR__ . '/orders.log',
    date('c') . "\t$name\t$phone\t$ip\t$comment\t" . str_replace(array("\n", "\r"), ' ', (string)$out) . "\t$err\n",
    FILE_APPEND);

$resp = json_decode((string)$out);
if (!$resp || ($resp->result ?? '') !== 'ok') {
    reply(502, array('ok' => false, 'error' => 'darkleads', 'detail' => (string)($resp->result ?? $err)));
}

@touch($lock);
reply(200, array('ok' => true));
