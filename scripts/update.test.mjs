import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { renderFormula, verifyTarball, newerVersion } from './update.mjs';

const bytes = Buffer.from('published tarball');
const metadata = {
  name: 'gh-glance', version: '0.17.0',
  dist: {
    tarball: 'https://registry.npmjs.org/gh-glance/-/gh-glance-0.17.0.tgz',
    integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
  },
};

test('checks published integrity before producing a checksummed formula', () => {
  const sha256 = verifyTarball(metadata, bytes);
  assert.equal(sha256, createHash('sha256').update(bytes).digest('hex'));
  const formula = renderFormula(metadata, sha256);
  assert.ok(formula.includes(metadata.dist.tarball));
  assert.ok(formula.includes(`sha256 "${sha256}"`));
  assert.match(formula, /depends_on "node@24"/);
});

test('rejects altered package bytes', () => {
  assert.throws(() => verifyTarball(metadata, Buffer.from('wrong bytes')), /integrity/i);
});

test('rejects unexpected package sources and malformed versions', () => {
  for (const altered of [
    { ...metadata, name: 'another-package' },
    { ...metadata, version: '0.17.0-pre' },
    { ...metadata, dist: { ...metadata.dist, tarball: 'https://example.com/package.tgz' } },
    { ...metadata, dist: { ...metadata.dist, integrity: 'sha1-untrusted' } },
  ]) assert.throws(() => verifyTarball(altered, bytes));
});

test('does not downgrade or rewrite the current version', () => {
  assert.equal(newerVersion('0.17.0', '0.16.2'), true);
  assert.equal(newerVersion('0.17.0', '0.17.0'), false);
  assert.equal(newerVersion('0.16.2', '0.17.0'), false);
  assert.equal(newerVersion('0.9.0', '0.17.0'), false);
  assert.equal(newerVersion('0.18.0', '0.17.0'), true);
});

const sutura = {
  ...metadata, name: 'sutura', version: '0.4.0',
  dist: { ...metadata.dist, tarball: 'https://registry.npmjs.org/sutura/-/sutura-0.4.0.tgz' },
};

test('packages Sutura with a real assessment test and the qualified Node runtime', () => {
  const formula = renderFormula(sutura, verifyTarball(sutura, bytes, 'sutura'));
  assert.match(formula, /class Sutura < Formula/);
  assert.ok(formula.includes(sutura.dist.tarball));
  assert.match(formula, /depends_on "node@24"/);
  assert.match(formula, /bin\/sutura/);
  assert.match(formula, /assess .*--json/);
  assert.match(formula, /sutura-repository-assessment-v1/);
});

test('rejects cross-package substitution and altered Sutura bytes', () => {
  assert.throws(() => verifyTarball(metadata, bytes, 'sutura'), /identity/i);
  assert.throws(() => verifyTarball(sutura, bytes, 'gh-glance'), /identity/i);
  assert.throws(() => verifyTarball(sutura, Buffer.from('wrong bytes'), 'sutura'), /integrity/i);
  assert.throws(() => renderFormula({ ...sutura, name: 'unexpected' }, 'hash'), /package/i);
});
