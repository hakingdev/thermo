# Columbia — лендинг термобелья Omni-Heat Midweight (React + Vite)

Сделан на базе проекта KRYGA (папка уровнем выше): та же структура, 3D-примерочная, форма заявки, UA/RU.
Украинский по адресу `/`, русский по адресу `/ru`. Страница «Дякуємо» — `/thanks` и `/ru/thanks`, политика — `/privacy`.

Товар — комплект Columbia Omni-Heat Midweight Baselayer:
мужской — кофта **1638591**, штаны **1638601** (S–XXL); женский — кофта **1639021**, штаны **1639031** (XS–XXL).

## Разработка

```bash
npm install
npm run dev -- --port 5174
```

В dev-режиме `/api/lead` отвечает **заглушка** (`vite.config.js`), реальные лиды не уходят. Meta Pixel в dev выключен (`.env.development`).

## Что заполнить перед запуском

- `src/config.js` — **цены** (`PRICE`, `OLD_PRICE`; `OLD_PRICE = 0` убирает скидку), наличие цветов, размерная сетка (ориентировочная).
- `src/i18n.js` — данные продавца (ФОП) и контакт: строки с пометкой «ЗАПОВНИТИ / ЗАПОЛНИТЬ».
- `.env` — `VITE_FB_PIXEL_ID` пикселя магазина Columbia (пиксель KRYGA сюда не переносился).
- Приём заявок — id товара и потока (см. ниже). Оффер KRYGA не переносился, без своих id API отвечает `config`.

## Фото и видео

- `public/img/columbia/` — официальные фото товара Columbia (CDN columbia.scene7.com), WebP 640 и 1200 px, `og.jpg` для соцсетей.
- Ленты «Где работает» и «Как получить» — фото из проекта KRYGA (Unsplash и Wikimedia Commons, авторы в футере).
- Видеообзоры — YouTube (`src/i18n.js`, массив `VIDEOS`): Roliki.ua (рус.), Tried This Thing (англ.), официальное видео Columbia про Omni-Heat.
  Обложки лежат локально (`video-<id>.webp`), iframe с youtube-nocookie.com грузится только по клику.
  Чтобы заменить ролик — поменяйте `id`/`time`/`channel` и положите новую обложку.

## Деплой на Vercel

1. Импортируйте папку `columbia-site` в Vercel (Framework: Vite — подхватится из `vercel.json`).
2. Settings → Environment Variables: `DARKLEADS_API_KEY`, `DARKLEADS_PRODUCT_ID`, `DARKLEADS_STREAM_ID`, при необходимости `DARKLEADS_CPA_ID` и `DARKLEADS_PRICE`.
3. Deploy. Заявки обрабатывает `api/lead.js`, лог заявок — в Vercel → Logs.

## Деплой на обычный хостинг (Apache + PHP)

```bash
cp server/php/config.example.php server/php/config.php   # впишите ключ и id товара
npm run build:php
```

Загрузите **содержимое** `dist/` в корень сайта. Там уже лежат `api.php`, `config.php` и `.htaccess`
(перенаправляет `/api/lead` → `api.php`, открывает `/ru`, `/thanks`, закрывает `config.php` и `orders.log`).

## Пиксель

`VITE_FB_PIXEL_ID` в `.env`. PageView — на каждой странице, **Lead — один раз на странице «Дякуємо»** после успешной заявки
(повторная загрузка или прямой заход на `/thanks` Lead не шлёт).
