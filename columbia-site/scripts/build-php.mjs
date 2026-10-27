// Добавляет PHP-прокси в dist/ для обычного хостинга (Apache + PHP).
// После `npm run build:php` загрузите содержимое dist/ в корень сайта.
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const from = "server/php";
const to = "dist";
if (!existsSync(join(from, "config.php"))) {
  console.error("Нет server/php/config.php — скопируйте config.example.php и впишите ключ.");
  process.exit(1);
}
for (const f of ["api.php", "config.php", ".htaccess"]) copyFileSync(join(from, f), join(to, f));
console.log("PHP-прокси добавлен в dist/: api.php, config.php, .htaccess");
