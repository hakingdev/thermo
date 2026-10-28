import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const id = '4988165351454889';
const bootstrap = await readFile(new URL('../src/meta-pixel.js', import.meta.url), 'utf8');

function environment() {
  const scripts = [];
  const storage = new Map();
  const context = {
    window: {location:{pathname:'/thanks'}},
    document: {createElement: () => ({}), head: {appendChild: script => scripts.push(script)}},
    sessionStorage: {getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
  };
  runInNewContext(bootstrap.replace('export function ', 'function ') + '\nthis.init = initMetaPixel;', context);
  return {context, scripts};
}

test('Meta installs a compatible queue once and remains disabled without configuration or in preview', () => {
  const {context,scripts} = environment();
  assert.equal(context.init(''),false);
  assert.equal(context.init(id,{enabled:false}),false);
  assert.equal(scripts.length,0);
  assert.equal(context.init(id),true);
  assert.equal(context.init(id),false);
  assert.equal(scripts.length,1);
  assert.equal(scripts[0].src,'https://connect.facebook.net/en_US/fbevents.js');
  assert.equal(context.window.fbq,context.window._fbq);
  assert.equal(context.window.fbq.push,context.window.fbq);
  assert.equal(JSON.stringify(context.window.fbq.queue.map(a=>Array.from(a))),JSON.stringify([['init',id],['track','PageView']]));
});

for (const file of ['src/pixel.js','columbia-site/src/pixel.js']) {
  test(file + ': confirmed thanks Lead is queued before SDK loads and not duplicated', async () => {
    const {context} = environment();
    context.init(id);
    const source = await readFile(new URL('../'+file,import.meta.url),'utf8');
    const pixelCode = source.replaceAll('export function ','function ') + '\nthis.pixel = {markLeadPending, consumeLeadOnce};';
    runInNewContext(pixelCode,context);
    assert.equal(context.pixel.consumeLeadOnce(),null);
    context.pixel.markLeadPending({name:'Test',value:1199});
    context.pixel.consumeLeadOnce(); context.pixel.consumeLeadOnce();
    const queued = context.window.fbq.queue.map(a=>Array.from(a));
    assert.equal(queued.filter(a=>a[1]==='Lead').length,1);
    assert.equal(queued[2][2].value,1199);
    assert.equal(queued[2][2].currency,'UAH');
    const delivered = [];
    context.window.fbq.callMethod = (...args)=>delivered.push(args);
    context.window.fbq.queue.forEach(args=>context.window.fbq.callMethod(...args));
    assert.equal(delivered.filter(a=>a[1]==='Lead').length,1);
    // A second successful form in the same tab also reaches an already-loaded SDK.
    context.pixel.markLeadPending({value:1199}); context.pixel.consumeLeadOnce();
    assert.equal(delivered.filter(a=>a[1]==='Lead').length,2);
  });
}

test('both storefronts resolve the configured production Pixel ID; Columbia may override it', async () => {
  for (const file of ['src/config.js','columbia-site/src/config.js']) {
    const source = await readFile(new URL('../'+file,import.meta.url),'utf8');
    const expression = source.match(/export const PIXEL_ID = (.*);/)[1].replaceAll('import.meta.env','env');
    assert.equal(runInNewContext(expression,{env:{VITE_MULTISITE:true,VITE_FB_PIXEL_ID:id}}),id);
    if (file.startsWith('columbia')) assert.equal(runInNewContext(expression,{env:{VITE_MULTISITE:true,VITE_FB_PIXEL_ID:id,VITE_COLUMBIA_FB_PIXEL_ID:'12345'}}),'12345');
  }
});
