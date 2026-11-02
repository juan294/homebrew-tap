class GhGlance < Formula
  desc "Live-refreshing GitHub dashboard for your terminal"
  homepage "https://github.com/juan294/gh-glance"
  url "https://registry.npmjs.org/gh-glance/-/gh-glance-0.19.0.tgz"
  sha256 "2e053001ade01a81774c10187ef6475ef340a8c154e1b1e0d6350927ac148c7e"
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
