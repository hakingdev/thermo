import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { adminAuth, memoryAuthStore, redisAuthStore } from '../server/admin-auth.mjs';
import { siteHandler } from '../server/site-state.mjs';

async function setup(t, options = {}) {
  const authStore = options.store || memoryAuthStore();
  const auth = adminAuth({ store: authStore, username: 'admin', password: 'test-secret', ...options });
  let state = { site: 'kryga', updatedAt: null };
  const site = siteHandler({ store: { read: async () => state, write: async value => { state = value; } }, auth });
  const server = createServer((req, res) => req.url === '/api/admin' ? auth.handler(req, res) : site(req, res));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  return { base: `http://127.0.0.1:${server.address().port}`, authStore, auth };
}
const json = (data, cookie = '', extra = {}) => ({ method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie, ...extra }, body: JSON.stringify(data) });
const login = { username: 'admin', password: 'test-secret' };

test('panel requires login; only a valid session changes site, logout revokes it', async t => {
  const { base } = await setup(t);
  assert.equal((await fetch(base + '/api/admin')).status, 401);
  assert.equal((await fetch(base + '/api/site')).status, 200);
  assert.equal((await fetch(base + '/api/site', json({ site: 'columbia' }, '', { Authorization: 'Bearer test-secret' }))).status, 401);
  for (const data of [{...login, username:'other'}, {...login, password:'wrong'}, null]) {
    assert.equal((await fetch(base + '/api/admin', json(data))).status, 401);
  }
  const response = await fetch(base + '/api/admin', json(login));
  assert.equal(response.status, 200);
  const setCookie = response.headers.get('set-cookie');
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', 'Max-Age=28800']) assert.ok(setCookie.includes(flag));
  const cookie = setCookie.split(';')[0];
  assert.match(cookie, /^__Host-storefront_admin=/);
  assert.equal((await fetch(base + '/api/admin', {headers:{Cookie:cookie}})).status, 200);
  assert.equal((await fetch(base + '/api/site', json({ site:'columbia' }, cookie))).status, 200);
  assert.equal((await (await fetch(base + '/api/site')).json()).site, 'columbia');
  assert.equal((await fetch(base + '/api/site', json({ site:'kryga' }, cookie, {Origin:'https://attacker.example'}))).status, 403);
  assert.equal((await fetch(base + '/api/site', json({ site:'kryga' }, cookie, {'Sec-Fetch-Site':'cross-site'}))).status, 403);
  const out = await fetch(base + '/api/admin', {method:'DELETE',headers:{Cookie:cookie,'Content-Type':'application/json'}});
  assert.equal(out.status, 200);
  assert.match(out.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal((await fetch(base + '/api/admin', {headers:{Cookie:cookie}})).status, 401);
  assert.equal((await fetch(base + '/api/site', json({ site:'kryga' }, cookie))).status, 401);
});

test('sessions expire, reject tampering, and stop working after credentials change', async t => {
  const {base, authStore} = await setup(t);
  const response = await fetch(base + '/api/admin', json(login));
  const cookie = response.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(base + '/api/admin',{headers:{Cookie:cookie + '1'}})).status,401);
  const changed = adminAuth({store:authStore, username:'admin', password:'changed'});
  assert.equal(await changed.authenticated({headers:{cookie}}),false);
  const {createHash} = await import('node:crypto');
  const key = 'session:' + createHash('sha256').update(cookie.split('=')[1]).digest('hex');
  const saved = await authStore.get(key);
  await authStore.set(key,saved,-1);
  assert.equal((await fetch(base + '/api/admin',{headers:{Cookie:cookie}})).status,401);
});

test('rate limits persist across handlers sharing storage; missing config fails closed', async t => {
  const first = await setup(t);
  for(let i=0;i<10;i++) assert.equal((await fetch(first.base + '/api/admin',json({...login,password:'wrong'}))).status,401);
  const other = await setup(t,{store:first.authStore});
  const limited = await fetch(other.base + '/api/admin',json(login));
  assert.equal(limited.status,429);
  assert.equal(limited.headers.get('retry-after'),'900');
  const missing = await setup(t,{password:''});
  assert.equal((await fetch(missing.base + '/api/admin',json(login))).status,503);
  assert.equal((await fetch(missing.base + '/api/site',json({site:'columbia'}))).status,503);
});

test('malformed bodies, cross-origin login and form submissions are rejected', async t => {
  const {base} = await setup(t);
  const url = base + '/api/admin';
  assert.equal((await fetch(url,json(login,'',{Origin:'https://attacker.example'}))).status,403);
  assert.equal((await fetch(url,{method:'POST',body:'username=admin'})).status,415);
  assert.equal((await fetch(url,{...json(login),body:'{'})).status,400);
  assert.equal((await fetch(url,{...json(login),body:'x'.repeat(3000)})).status,413);
  assert.equal((await fetch(url,{method:'PUT'})).status,405);
});

test('Redis auth store uses expiring sessions and atomic rate limits', async t => {
  const calls = [];
  const server = createServer(async (req,res) => {
    let body=''; for await(const chunk of req) body += chunk;
    const args=JSON.parse(body); calls.push(args);
    res.end(JSON.stringify({result:args[0]==='EVAL' ? 11 : 'OK'}));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const store = redisAuthStore({KV_REST_API_URL:`http://127.0.0.1:${server.address().port}`,KV_REST_API_TOKEN:'test-token'});
  await store.set('session:test','value',28800);
  assert.deepEqual(calls[0],['SET','storefront:active-site:auth:session:test','value','EX',28800]);
  assert.equal(await store.attempt('attempt:test'),false);
  assert.equal(calls[1][0],'EVAL');
  await store.del('session:test');
  assert.equal(calls[2][0],'DEL');
});
