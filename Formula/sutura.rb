class Sutura < Formula
  desc "Verified self-healing CI for GitHub Actions"
  homepage "https://github.com/juan294/sutura"
  url "https://registry.npmjs.org/sutura/-/sutura-0.4.1.tgz"
  sha256 "5417c481260155661142510d5a284826130cd8d90173c4cab94d7bfd14259e03"
  license "MIT"

  # Use the Node LTS release qualified by upstream's release gate.
  depends_on "gh"
  depends_on "node@24"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec/"bin/sutura"
  end

  test do
    assert_equal version.to_s, shell_output("#{bin}/sutura --version").strip
    (testpath/"project").mkpath
    (testpath/"project/package.json").write('{"name":"brew-test","version":"1.0.0"}')
    assessment = JSON.parse(shell_output("#{bin}/sutura assess #{testpath}/project --json"))
    assert_equal "sutura-repository-assessment-v1", assessment.fetch("schemaVersion")
    assert_equal "metadata-only", assessment.fetch("scopeKind")
    assert_equal true, assessment.fetch("complete")
  end
end
