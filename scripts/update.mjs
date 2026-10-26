import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const packages = {
  'gh-glance': { className: 'GhGlance', description: 'Live-refreshing GitHub dashboard for your terminal' },
  sutura: { className: 'Sutura', description: 'Verified self-healing CI for GitHub Actions' },
};
const stableVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function newerVersion(next, current) {
  const a = next.split('.').map(Number);
  const b = current.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

function verifyMetadata(metadata, packageName) {
  const { name, version, dist } = metadata;
  if (!Object.hasOwn(packages, packageName) || name !== packageName || !stableVersion.test(version)
      || dist?.tarball !== `https://registry.npmjs.org/${packageName}/-/${packageName}-${version}.tgz`) {
    throw new Error('Unexpected npm package identity, version or tarball URL');
  }
}

export function verifyTarball(metadata, bytes, packageName = 'gh-glance') {
  verifyMetadata(metadata, packageName);
  const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
  if (metadata.dist.integrity !== integrity) throw new Error('Published tarball integrity mismatch');
  return createHash('sha256').update(bytes).digest('hex');
}

export function renderFormula(metadata, sha256) {
  verifyMetadata(metadata, metadata.name);
  const { name } = metadata;
  const config = packages[name];
  const functionalTest = name === 'sutura'
    ? `    (testpath/"project").mkpath
    (testpath/"project/package.json").write('{"name":"brew-test","version":"1.0.0"}')
    assessment = JSON.parse(shell_output("#{bin}/sutura assess #{testpath}/project --json"))
    assert_equal "sutura-repository-assessment-v1", assessment.fetch("schemaVersion")
    assert_equal "metadata-only", assessment.fetch("scopeKind")
    assert_equal true, assessment.fetch("complete")`
    : `    assert_match "--repo", shell_output("#{bin}/gh-glance --help")
    assert_match "unknown", shell_output("#{bin}/gh-glance --unknown-option 2>&1", 2).downcase`;
  return `class ${config.className} < Formula
  desc "${config.description}"
  homepage "https://github.com/juan294/${name}"
  url "${metadata.dist.tarball}"
  sha256 "${sha256}"
  license "MIT"

  # Use the Node LTS release qualified by upstream's release gate.
  depends_on "gh"
  depends_on "node@24"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec/"bin/${name}"
  end

  test do
    assert_equal version.to_s, shell_output("#{bin}/${name} --version").strip
${functionalTest}
  end
end
`;
}

async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000), redirect: 'error' });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response;
}

async function updateFormula(packageName) {
  const formulaPath = new URL(`../Formula/${packageName}.rb`, import.meta.url);
  const metadata = await (await get(`https://registry.npmjs.org/${packageName}/latest`)).json();
  // Validate before downloading a URL received from outside this repository.
  verifyMetadata(metadata, packageName);
  const current = await readFile(formulaPath, 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '';
    throw error;
  });
  const currentVersion = current.match(new RegExp(`${packageName}-(\\d+\\.\\d+\\.\\d+)\\.tgz"`, 'm'))?.[1];
  if (current && !currentVersion) throw new Error('Cannot identify current formula version');
  if (currentVersion && !newerVersion(metadata.version, currentVersion)) {
    console.log(`${packageName} formula already at ${currentVersion}; npm latest ${metadata.version}`);
    return;
  }
  const bytes = Buffer.from(await (await get(metadata.dist.tarball)).arrayBuffer());
  await writeFile(formulaPath, renderFormula(metadata, verifyTarball(metadata, bytes, packageName)));
  console.log(`Updated ${packageName} formula to ${metadata.version}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const packageName of Object.keys(packages)) await updateFormula(packageName);
}
