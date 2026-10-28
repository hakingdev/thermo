import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const id = 'D7D2H2BC77UDPR8SNM8G';
async function bootstrap(file, pathname = '/', search = '', mode = 'production', hostname = 'shop.example') {
  const html = await readFile(new URL('../' + file, import.meta.url), 'utf8');
  const head = html.split('</head>')[0];
  const script = [...head.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes(id));
  assert.ok(script, 'TikTok base code must be in head');
  const inserted = [];
  const context = {
    window: {}, location: {pathname, search, hostname}, URLSearchParams,
    document: {createElement: () => ({}), head: {appendChild: element => inserted.push(element)}},
  };
  const code = script.replaceAll('%MODE%', mode);
  runInNewContext(code, context);
  return {context, inserted, code};
}

for (const file of ['index.html', 'columbia-site/index.html']) {
  test(file + ': pixel loads once in head, including both thank-you routes', async () => {
    for (const path of ['/', '/ru', '/thanks', '/ru/thanks']) {
      const {context, inserted, code} = await bootstrap(file, path);
      assert.equal(inserted.length, 1);
      assert.equal(inserted[0].async, true);
      assert.equal(inserted[0].src, `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${id}&lib=ttq`);
      assert.equal(context.window.ttq.filter(e => e[0] === 'page').length, 1);
      runInNewContext(code, context);
      assert.equal(inserted.length, 1);
      assert.equal(context.window.ttq.filter(e => e[0] === 'page').length, 1);
    }
  });
  test(file + ': admin, preview and local development never load the pixel', async () => {
    for (const args of [['/admin'], ['/admin/'], ['/', '?preview=columbia'], ['/thanks', '?preview=kryga'], ['/', '', 'development'], ['/', '', 'production', '127.0.0.1']]) {
      const {context, inserted} = await bootstrap(file, ...args);
      assert.equal(inserted.length, 0);
      assert.equal(context.window.ttq, undefined);
    }
  });
}

for (const [file, flag] of [['src/pixel.js', 'kryga_lead_pending'], ['columbia-site/src/pixel.js', 'columbia_lead_pending']]) {
  async function load(pathname = '/thanks', storage = new Map(), sdk = true) {
    const source = await readFile(new URL('../' + file, import.meta.url), 'utf8');
    const calls = [];
    const context = {
      window: {location:{pathname}, fbq: (...args) => calls.push(['meta', ...args]), ...(sdk ? {ttq:{track: (...args) => calls.push(['tiktok', ...args])}} : {})},
      sessionStorage: {getItem: key => storage.get(key) || null, removeItem: key => storage.delete(key), setItem: (key,value) => storage.set(key,value)},
    };
    runInNewContext(source.replaceAll('export function ', 'function ') + '\nthis.pixel = {markLeadPending,consumeLeadOnce};', context);
    return {pixel:context.pixel, calls, storage};
  }
  test(file + ': successful submission sends one Lead, reload/direct visit sends none', async () => {
    const first = await load();
    assert.equal(first.pixel.consumeLeadOnce(), null);
    assert.equal(first.calls.length, 0);
    first.pixel.markLeadPending({value:1199,name:'Private customer',phone:'private-phone',gender:'male',size:'M'});
    first.pixel.consumeLeadOnce();
    first.pixel.consumeLeadOnce(); // React StrictMode and repeated renders.
    const leads = first.calls.filter(c => c[0] === 'tiktok');
    assert.equal(leads.length, 1);
    assert.equal(leads[0][1], 'Lead');
    assert.equal(leads[0][2].value, 1199);
    assert.equal(leads[0][2].currency, 'UAH');
    assert.equal(JSON.stringify(leads).includes('Private customer'), false);
    assert.equal(JSON.stringify(leads).includes('private-phone'), false);
    const reloaded = await load('/thanks', first.storage);
    assert.equal(reloaded.pixel.consumeLeadOnce(), null);
    assert.equal(reloaded.calls.length, 0);
    first.pixel.markLeadPending({value:1199});
    first.pixel.consumeLeadOnce();
    assert.equal(first.calls.filter(c => c[0] === 'tiktok').length, 2);
  });
  test(file + ': RU works; corrupt/stale markers do not create conversions; blocked SDK does not break thanks', async () => {
    const ru = await load('/ru/thanks');
    ru.pixel.markLeadPending({value:1199}); ru.pixel.consumeLeadOnce();
    assert.equal(ru.calls.filter(c => c[0] === 'tiktok').length, 1);
    for (const marker of ['{', 'null', JSON.stringify({value:1199,at:Date.now()-3600000}), JSON.stringify({at:Date.now(),value:'invalid'})]) {
      const invalid = await load('/thanks',new Map([[flag,marker]]));
      assert.equal(invalid.pixel.consumeLeadOnce(),null);
      assert.equal(invalid.calls.length,0);
    }
    const noSdk = await load('/thanks',new Map(),false);
    noSdk.pixel.markLeadPending({value:1199});
    assert.equal(noSdk.pixel.consumeLeadOnce().value,1199);
  });
}
