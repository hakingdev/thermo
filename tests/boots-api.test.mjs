import test from 'node:test';
import assert from 'node:assert/strict';

test('both footwear handlers use the actual CPA offer and safely report provider failures', async () => {
  process.env.TRACK_DARKLEADS_API_KEY = 'test-private-track-key';
  process.env.BOOTS_DARKLEADS_API_KEY = 'test-private-boots-key';
  const handlers = [
    (await import('../api/track-order.js')).default,
    (await import('../api/boots-lead.js')).default,
  ];
  const originalFetch = globalThis.fetch;
  const originalError = console.error;
  const logs = [];
  console.error = line => logs.push(JSON.parse(line));
  try {
    for (const handler of handlers) {
      let provider = { errors: { code: 'no_product_offer', data: 'Private upstream diagnostic' } };
      let status = 200;
      let sent;
      globalThis.fetch = async (url, options) => {
        sent = new URLSearchParams(options.body);
        return { ok: status === 200, status, text: async () => JSON.stringify(provider) };
      };
      const invoke = async () => {
        let data;
        const res = { setHeader() {}, end(value) { data = JSON.parse(value); } };
        await handler({ method: 'POST', headers: { 'content-type': 'application/json' },
          body: { name: 'Private customer', phone: '+380000000019', size: '43' } }, res);
        return { status: res.statusCode, data };
      };
      assert.deepEqual(await invoke(), { status: 502, data: { ok: false, error: 'darkleads', reason: 'offer_configuration' } });
      assert.equal(sent.get('product_id'), '121121');
      assert.equal(sent.get('stream_id'), '98074');
      assert.equal(sent.get('is_cpa[id]'), '2015');
      assert.equal(sent.get('price'), '2490');
      status = 503; provider = { result: 'ok' };
      assert.equal((await invoke()).status, 502, 'HTTP errors must not mark orders accepted');
      status = 200;
      assert.deepEqual(await invoke(), { status: 200, data: { ok: true } }, 'failed orders can be retried');
      assert.deepEqual(await invoke(), { status: 200, data: { ok: true, dup: true } });
    }
    assert.equal(logs.length, 4);
    assert.equal(logs[0].reason, 'offer_configuration');
    assert.equal(logs[0].cpaId, '2015');
    assert.doesNotMatch(JSON.stringify(logs), /Private|380000000019|test-private/);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    delete process.env.TRACK_DARKLEADS_API_KEY;
    delete process.env.BOOTS_DARKLEADS_API_KEY;
  }
});
