// Добавляет PHP-прокси в dist/ для обычного хостинга (Apache + PHP).
// После `npm run build:php` загрузите содержимое dist/ в корень сайта.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const from = "server/php";
const to = "dist";
if (!existsSync(join(from, "config.php"))) {
  console.error("Нет server/php/config.php — скопируйте config.example.php и впишите ключ.");
  process.exit(1);
}
for (const f of ["api.php", "config.php", ".htaccess"]) copyFileSync(join(from, f), join(to, f));
copyFileSync(join(from, "site.php"), join(to, "site.php"));
const adminConfig = existsSync(join(from, "site-admin.config.php")) ? "site-admin.config.php" : "site-admin.config.example.php";
copyFileSync(join(from, adminConfig), join(to, adminConfig));
mkdirSync(join(to, "columbia-api"), { recursive: true });
copyFileSync("columbia-site/server/php/api.php", join(to, "columbia-api/api.php"));
copyFileSync(join(from, ".htaccess"), join(to, "columbia-api/.htaccess"));
const columbiaConfig = existsSync("columbia-site/server/php/config.php") ? "config.php" : "config.example.php";
copyFileSync(join("columbia-site/server/php", columbiaConfig), join(to, "columbia-api/config.php"));
console.log("Общая админка: /admin; выбор сайта: /api/site. Настройте site-admin.config.php на хостинге.");
console.log("PHP-прокси добавлен в dist/: api.php, config.php, .htaccess");
