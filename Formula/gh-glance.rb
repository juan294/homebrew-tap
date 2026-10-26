class GhGlance < Formula
  desc "Live-refreshing GitHub dashboard for your terminal"
  homepage "https://github.com/juan294/gh-glance"
  url "https://registry.npmjs.org/gh-glance/-/gh-glance-0.17.0.tgz"
  version "0.17.0"
  sha256 "48ac24ce8715dbbf1f76bd48f88bef93295cae238a4583e29bc3f9cc1f38d129"
  license "MIT"

  # Use the Node LTS release qualified by upstream's release gate.
  depends_on "node@24"
  depends_on "gh"

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
