import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStorefrontRoute, resolveStorefront } from '../src/routes.js';

test('Boots selected in admin opens on root, with its own confirmation and shared privacy', () => {
  for (const [prefix, lang] of [['', 'ua'], ['/ru', 'ru']]) {
    assert.deepEqual(parseStorefrontRoute(prefix || '/', 'boots'), {lang, page: 'boots'});
    assert.deepEqual(parseStorefrontRoute(prefix + '/thanks', 'boots'), {lang, page: 'boots/thanks'});
    assert.deepEqual(parseStorefrontRoute(prefix + '/privacy', 'boots'), {lang, page: 'privacy'});
  }
});
test('KRYGA routes and direct Boots links keep their existing behavior', () => {
  assert.equal(parseStorefrontRoute('/').page, 'home');
  assert.equal(parseStorefrontRoute('/thanks').page, 'thanks');
  assert.deepEqual(parseStorefrontRoute('/ru/boots/'), {lang: 'ru', page: 'boots'});
  assert.equal(parseStorefrontRoute('/boots/thanks').page, 'boots/thanks');
});

test('Boots uses its independent brand on both languages and confirmation routes', () => {
  for (const main of ['columbia', 'kryga', 'boots']) {
    for (const route of ['/boots', '/ru/boots', '/boots/thanks', '/ru/boots/thanks']) {
      assert.equal(resolveStorefront(route, null, {site: main, bootsSite: 'columbia'}), 'track');
      assert.equal(resolveStorefront(route, null, {site: main, bootsSite: 'kryga'}), 'boots');
    }
  }
  assert.equal(resolveStorefront('/', null, {site: 'columbia', bootsSite: 'kryga'}), 'columbia');
  assert.equal(resolveStorefront('/', null, {site: 'kryga', bootsSite: 'columbia'}), 'kryga');
  assert.equal(resolveStorefront('/', null, {site: 'boots', bootsSite: 'columbia'}), 'track');
  assert.equal(resolveStorefront('/boots', null, {site: 'kryga'}), 'boots');
});
test('Both Boots previews work without changing saved state; legacy Track URLs remain valid', () => {
  assert.equal(resolveStorefront('/boots', 'boots-columbia', {site: 'kryga', bootsSite: 'kryga'}), 'track');
  assert.equal(resolveStorefront('/boots', 'boots-kryga', {site: 'columbia', bootsSite: 'columbia'}), 'boots');
  assert.equal(resolveStorefront('/columbia-track', null, {site: 'kryga'}), 'track');
  assert.equal(resolveStorefront('/ru/columbia-track/thanks', null, {site: 'kryga'}), 'track');
});
