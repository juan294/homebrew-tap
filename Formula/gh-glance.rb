class GhGlance < Formula
  desc "Live-refreshing GitHub dashboard for your terminal"
  homepage "https://github.com/juan294/gh-glance"
  url "https://registry.npmjs.org/gh-glance/-/gh-glance-0.21.0.tgz"
  sha256 "a7d20b1727804b0555ab5f95c3dac40df3e1bf5431809807c5cce5eaf1276b63"
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
