import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

async function pixel(path = '/columbia-track/thanks', storage = new Map(), blocked = false) {
  const calls = [];
  const context = { window: { location: { pathname: path }, fbq: (...a) => calls.push(['meta', ...a]), ttq: {track: (...a) => calls.push(['tiktok', ...a])} }, sessionStorage: { getItem: k => { if(blocked) throw Error(); return storage.get(k); }, setItem: (k,v) => { if(blocked) throw Error(); storage.set(k,v); } } };
  const source = await readFile(new URL('../columbia-site/src/track/pixel.js', import.meta.url), 'utf8');
  runInNewContext(source.replaceAll('export function ', 'function ') + '\nthis.api={markTrackOrder,confirmTrackOrder};', context);
  return { api: context.api, calls, storage };
}

test('Track: both pixels receive one Lead only after success, no duplicates on remount/reload', async () => {
  const p = await pixel();
  assert.equal(p.api.confirmTrackOrder(), null);
  p.api.markTrackOrder({ size: '42' });
  assert.equal(p.api.confirmTrackOrder().size, '42');
  p.api.confirmTrackOrder();
  assert.equal(p.calls.length, 2);
  assert.equal(p.calls[0][2], 'Lead');
  assert.equal(p.calls[0][3].value, 2490);
  assert.equal(p.calls[1][2].currency, 'UAH');
  assert.equal(p.calls[1][2].content_name, 'Columbia Track');
  const reload = await pixel('/ru/columbia-track/thanks', p.storage);
  assert.ok(reload.api.confirmTrackOrder());
  assert.equal(reload.calls.length, 0);
  const other = await pixel('/thanks', p.storage);
  assert.equal(other.api.confirmTrackOrder(), null);
});
test('Track: stale, corrupt and duplicate orders do not create conversions; unavailable storage works', async () => {
  for (const value of ['{', 'null', JSON.stringify({at: Date.now() - 1800001}), JSON.stringify({at: Date.now() + 100000})]) {
    const p = await pixel('/columbia-track/thanks', new Map([['columbia_track_order', value]]));
    assert.equal(p.api.confirmTrackOrder(), null); assert.equal(p.calls.length, 0);
  }
  const dup = await pixel(); dup.api.markTrackOrder({conversion: false}); dup.api.confirmTrackOrder(); assert.equal(dup.calls.length, 0);
  const blocked = await pixel('/columbia-track/thanks', new Map(), true); blocked.api.markTrackOrder(); blocked.api.confirmTrackOrder(); blocked.api.confirmTrackOrder(); assert.equal(blocked.calls.length, 2);
});

test('Track API uses correct offer, server key, choice and attribution; rejects invalid and upstream failures', async () => {
  process.env.TRACK_DARKLEADS_API_KEY = 'test-server-secret';
  const { default: handler } = await import('../api/track-order.js');
  const originalFetch = globalThis.fetch;
  let sent = null, status = 200, result = {result: 'ok'}, count = 0;
  globalThis.fetch = async (url, options) => { sent = {url, data: new URLSearchParams(options.body)}; count++; return {ok: status === 200, text: async () => JSON.stringify(result)}; };
  const invoke = async body => {
    let data; const res = {setHeader(){}, end(value) {data = JSON.parse(value);}};
    await handler({ method:'POST', headers:{'content-type':'application/json'}, body }, res);
    return {status: res.statusCode, data};
  };
  try {
    assert.equal((await invoke({ name: 'A', phone: '+380000000000' })).status, 422);
    assert.equal((await invoke('null')).status, 422);
    assert.equal((await invoke({ name: 'Tester', phone: '1234567890' })).status, 422);
    assert.equal(count, 0);
    const order = { name: 'Test customer', phone: '+380000000001', size: '43', lang:'UA', source: 'https://shop.example/columbia-track?utm_source=test&sub1=abc' };
    assert.equal((await invoke(order)).status, 200);
    assert.equal(sent.url, 'https://courier.darkleads.pro/data/exchange/extpartner/addorderapi.php');
    for (const [key, value] of Object.entries({ api_key:'test-server-secret', product_id:'121121', stream_id:'98074', price:'2490', 'is_cpa[id]':'2015', source:order.source, url:order.source })) assert.equal(sent.data.get(key), value);
    assert.match(sent.data.get('comment'), /Columbia Track.*43/);
    assert.equal((await invoke(order)).data.dup, true); assert.equal(count,1);
    status = 500; assert.equal((await invoke({...order,phone:'+380000000002'})).status,502);
    status = 200; result={result:'error'}; assert.equal((await invoke({...order,phone:'+380000000003'})).status,502);
    result={result:'ok'}; assert.equal((await invoke({...order,phone:'+380000000003'})).status,200);
  } finally { globalThis.fetch = originalFetch; delete process.env.TRACK_DARKLEADS_API_KEY; }
});

test('Columbia on Boots confirms only its own order once at the shared thank-you URL', async () => {
  for (const route of ['/boots/thanks', '/ru/boots/thanks']) {
    const p = await pixel(route);
    assert.equal(p.api.confirmTrackOrder(), null);
    p.api.markTrackOrder({size:'44'});
    assert.equal(p.api.confirmTrackOrder().size,'44');
    assert.equal(p.calls.length,2);
    const reload = await pixel(route,p.storage);
    assert.ok(reload.api.confirmTrackOrder());
    assert.equal(reload.calls.length,0);
  }
});
