<?php
// Скопируйте в config.php и впишите ключ DarkLeads и id товара Columbia.
return array(
    'api_key'    => 'ВАШ_КЛЮЧ_DARKLEADS',
    'endpoint'   => 'https://courier.darkleads.pro/data/exchange/extpartner/addorderapi.php',
    'product_id' => '',   // ЗАПОЛНИТЬ
    'stream_id'  => '',   // ЗАПОЛНИТЬ
    'cpa_id'     => '',   // если есть
    'price'      => 1199, // как PRICE в src/config.js
    'allowed_origins' => array(),
);
