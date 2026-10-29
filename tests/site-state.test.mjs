import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { fileStore, siteHandler, redisStore } from '../server/site-state.mjs';
const auth = { configured: true, authenticated: async req => req.headers.cookie === 'test-session=valid' };

async function serve(t, handler) {
  const server = createServer(handler);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  return `http://127.0.0.1:${server.address().port}`;
}
async function storeFor(t) {
  const dir = await mkdtemp(join(tmpdir(), 'site-state-test-'));
  t.after(() => rm(dir, {recursive:true, force:true}));
  const filename = join(dir, 'state.json');
  return { filename, store: fileStore(filename) };
}
const post = (site, password='test-password') => ({method:'POST', headers:{'Content-Type':'application/json', Cookie: password === 'test-password' ? 'test-session=valid' : ''}, body:JSON.stringify({site})});

test('selection is global, persistent across handler restarts, and never cached', async t => {
  const { filename, store } = await storeFor(t);
  const url = await serve(t, siteHandler({store, auth}));
  assert.equal((await (await fetch(url)).json()).site, 'kryga');
  for (const site of ['columbia', 'boots', 'kryga']) {
    const result = await fetch(url, post(site));
    assert.equal(result.status, 200);
    assert.match(result.headers.get('cache-control'), /no-store/);
    const other = await serve(t, siteHandler({store:fileStore(filename), auth}));
    const data = await (await fetch(other)).json();
    assert.equal(data.site, site);
    assert.ok(data.updatedAt);
    assert.equal(data.requiresLogin, true);
    assert.equal(JSON.stringify(data).includes('test-password'), false);
  }
});

test('missing/wrong password, invalid site and form posts cannot mutate state', async t => {
  const {store} = await storeFor(t);
  const url = await serve(t, siteHandler({store, auth}));
  assert.equal((await fetch(url, post('columbia', 'wrong'))).status, 401);
  assert.equal((await fetch(url, post('columbia', ''))).status, 401);
  assert.equal((await fetch(url, post('invalid'))).status, 422);
  assert.equal((await fetch(url, {...post('columbia'), body:'null'})).status, 422);
  assert.equal((await fetch(url, {...post('columbia'), body:'{'})).status, 400);
  assert.equal((await fetch(url, {...post('columbia'), body:'x'.repeat(3000)})).status, 413);
  assert.equal((await fetch(url, {method:'POST', body:'site=columbia'})).status, 415);
  assert.equal((await fetch(url, {method:'DELETE'})).status, 405);
  assert.equal((await store.read()).site, 'kryga');
});

test('production cannot write without credentials or persistent storage', async t => {
  const {store} = await storeFor(t);
  for (const options of [{store}, {auth}]) {
    const url = await serve(t, siteHandler(options));
    assert.equal((await (await fetch(url)).json()).configured, false);
    assert.equal((await fetch(url, post('columbia'))).status, 503);
  }
  assert.equal(redisStore({}), null);
});

test('unreadable state fails explicitly instead of silently publishing another brand', async t => {
  const {filename,store} = await storeFor(t);
  await writeFile(filename, '{broken');
  const url = await serve(t, siteHandler({store, local:true}));
  assert.equal((await fetch(url)).status, 503);
});

test('Redis adapter persists through the documented REST protocol', async t => {
  let value = null;
  const url = await serve(t, async (req,res) => {
    assert.equal(req.headers.authorization, 'Bearer test-redis-token');
    let raw=''; for await (const chunk of req) raw += chunk;
    const [command,key,data] = JSON.parse(raw);
    assert.equal(key,'test:site');
    if(command === 'SET') value=data;
    res.setHeader('Content-Type','application/json');
    res.end(JSON.stringify({result:command === 'GET' ? value : 'OK'}));
  });
  const env={UPSTASH_REDIS_REST_URL:url,UPSTASH_REDIS_REST_TOKEN:'test-redis-token',SITE_STATE_KEY:'test:site'};
  await redisStore(env).write({site:'columbia',updatedAt:'2026-10-27T00:00:00Z'});
  assert.equal((await redisStore(env).read()).site,'columbia');
  const vercelEnv={KV_REST_API_URL:url,KV_REST_API_TOKEN:'test-redis-token',SITE_STATE_KEY:'test:site'};
  assert.equal((await redisStore(vercelEnv).read()).site,'columbia');
  await redisStore(vercelEnv).write({site:'kryga',updatedAt:'2026-10-27T00:01:00Z'});
  assert.equal((await redisStore(env).read()).site,'kryga');
});

test('PHP stores a shared choice and enforces password and validation', async t => {
  const {spawn, execFileSync} = await import('node:child_process');
  const {copyFile} = await import('node:fs/promises');
  const dir = await mkdtemp(join(tmpdir(), 'site-php-test-'));
  t.after(() => rm(dir, {recursive:true, force:true}));
  for (const f of ['site.php','admin.php','admin-session.php']) await copyFile(new URL('../server/php/' + f, import.meta.url), join(dir,f));
  const hash = execFileSync('php',['-r', 'echo password_hash("temporary-test-password", PASSWORD_DEFAULT);']).toString();
  await writeFile(join(dir,'site-admin.config.php'), `<?php return ['password_hash'=>'${hash}', 'state_file'=>__DIR__.'/state.json'];`);
  const socket = createServer();
  await new Promise(resolve=>socket.listen(0,'127.0.0.1',resolve));
  const port=socket.address().port;
  await new Promise(resolve=>socket.close(resolve));
  const php=spawn('php',['-S',`127.0.0.1:${port}`,'-t',dir], {stdio:['ignore','ignore','pipe']});
  t.after(()=>php.kill());
  await new Promise((resolve,reject)=>{php.stderr.once('data',resolve);php.once('error',reject);});
  const url=`http://127.0.0.1:${port}/site.php`;
  assert.equal((await (await fetch(url)).json()).site,'kryga');
  assert.equal((await fetch(url,{...post('columbia'), headers:{'Content-Type':'application/json', Authorization:'Bearer wrong'}})).status,401);
  const adminUrl = `http://127.0.0.1:${port}/admin.php`;
  assert.equal((await fetch(adminUrl)).status,401);
  const login = await fetch(adminUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password:'temporary-test-password'})});
  assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const phpPost = site => ({method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({site})});
  assert.equal((await fetch(url,phpPost('other'))).status,422);
  assert.equal((await fetch(url,phpPost('columbia'))).status,200);
  const response=await fetch(url);
  assert.match(response.headers.get('cache-control'),/no-store/);
  assert.equal((await response.json()).site,'columbia');
  assert.equal((await fetch(url,phpPost('boots'))).status,200);
  assert.equal((await (await fetch(url)).json()).site,'boots');
  assert.equal((await fetch(url,phpPost('kryga'))).status,200);
  assert.equal((await (await fetch(url)).json()).site,'kryga');
  assert.equal((await fetch(url, {...phpPost('kryga'),body:JSON.stringify({site:'kryga',bootsSite:'columbia'})})).status,200);
  assert.equal((await (await fetch(url)).json()).bootsSite,'columbia');
  assert.equal((await fetch(url, {...phpPost('kryga'),body:JSON.stringify({site:'kryga',bootsSite:'invalid'})})).status,422);
  await fetch(url,phpPost('columbia'));
  assert.equal((await (await fetch(url)).json()).bootsSite,'columbia');
  assert.equal((await fetch(adminUrl,{method:'DELETE',headers:{'Content-Type':'application/json',Cookie:cookie}})).status,200);
  assert.equal((await fetch(url,phpPost('columbia'))).status,401);
});

test('Boots brand persists independently, migrates legacy state and survives old clients', async t => {
  const {filename, store} = await storeFor(t);
  await writeFile(filename, JSON.stringify({site:'columbia', updatedAt:null}));
  const url = await serve(t, siteHandler({store,auth}));
  assert.equal((await (await fetch(url)).json()).bootsSite, 'kryga');
  for (const bootsSite of ['columbia', 'kryga', 'columbia']) {
    const result = await fetch(url, {...post('columbia'),body:JSON.stringify({site:'columbia', bootsSite})});
    assert.equal(result.status,200);
    const data = await fileStore(filename).read();
    assert.equal(data.bootsSite,bootsSite);
    assert.equal(data.site,'columbia');
  }
  assert.equal((await fetch(url, {...post('columbia'),body:JSON.stringify({site:'columbia',bootsSite:'invalid'})})).status,422);
  assert.equal((await fetch(url,post('kryga'))).status,200);
  assert.equal((await store.read()).bootsSite,'columbia');
  assert.equal((await store.read()).site,'kryga');
});
