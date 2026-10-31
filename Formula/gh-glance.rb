class GhGlance < Formula
  desc "Live-refreshing GitHub dashboard for your terminal"
  homepage "https://github.com/juan294/gh-glance"
  url "https://registry.npmjs.org/gh-glance/-/gh-glance-0.18.1.tgz"
  sha256 "61f014a315ac3c9f4bd707790b7afbda996f8343a6146b358a63cb8d9bc7d8bd"
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
