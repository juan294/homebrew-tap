import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const formulaPath = new URL('../Formula/gh-glance.rb', import.meta.url);
const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function newerVersion(next, current) {
  const a = next.split('.').map(Number);
  const b = current.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

export function verifyTarball(metadata, bytes) {
  const { name, version, dist } = metadata;
  if (name !== 'gh-glance' || !stableVersion.test(version)
      || dist?.tarball !== `https://registry.npmjs.org/gh-glance/-/gh-glance-${version}.tgz`) {
    throw new Error('Unexpected npm package identity, version or tarball URL');
  }
  const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
  if (dist.integrity !== integrity) throw new Error('Published tarball integrity mismatch');
  return createHash('sha256').update(bytes).digest('hex');
}

export function renderFormula(metadata, sha256) {
  return `class GhGlance < Formula
  desc "Live-refreshing GitHub dashboard for your terminal"
  homepage "https://github.com/juan294/gh-glance"
  url "${metadata.dist.tarball}"
  sha256 "${sha256}"
  license "MIT"

  # Use the Node LTS release qualified by upstream's release gate.
  depends_on "gh"
  depends_on "node@24"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec/"bin/gh-glance"
  end

  test do
    assert_equal version.to_s, shell_output("#{bin}/gh-glance --version").strip
    assert_match "--repo", shell_output("#{bin}/gh-glance --help")
    assert_match "unknown", shell_output("#{bin}/gh-glance --unknown-option 2>&1", 2).downcase
  end
end
`;
}

async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000), redirect: 'error' });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response;
}

async function main() {
  const metadata = await (await get('https://registry.npmjs.org/gh-glance/latest')).json();
  // Validate before downloading a URL received from outside this repository.
  if (metadata.name !== 'gh-glance' || !stableVersion.test(metadata.version)
      || metadata.dist?.tarball !== `https://registry.npmjs.org/gh-glance/-/gh-glance-${metadata.version}.tgz`) {
    throw new Error('Unexpected npm metadata');
  }
  const current = await readFile(formulaPath, 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '';
    throw error;
  });
  const currentVersion = current.match(/gh-glance-(\d+\.\d+\.\d+)\.tgz"/m)?.[1];
  if (current && !currentVersion) throw new Error('Cannot identify current formula version');
  if (currentVersion && !newerVersion(metadata.version, currentVersion)) {
    console.log(`Formula already at ${currentVersion}; npm latest ${metadata.version}`);
    return;
  }
  const bytes = Buffer.from(await (await get(metadata.dist.tarball)).arrayBuffer());
  await writeFile(formulaPath, renderFormula(metadata, verifyTarball(metadata, bytes)));
  console.log(`Updated gh-glance formula to ${metadata.version}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
