class Summon < Formula
  desc "Launch multi-pane Ghostty or Rex workspaces with one command"
  homepage "https://github.com/juan294/summon"
  url "https://registry.npmjs.org/summon-ws/-/summon-ws-2.2.2.tgz"
  sha256 "0e6283a96f574e823438614640d3f44b8d3fd7cabacdcc870bd0799a3b288fc6"
  license "MIT"

  # Use the Node LTS release qualified by upstream's release gate.
  depends_on :macos
  depends_on "node@24"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec/"bin/summon"
  end

  test do
    assert_equal version.to_s, shell_output("#{bin}/summon --version").strip
    assert_match "#compdef summon", shell_output("#{bin}/summon completions zsh")
    assert_match "Usage", shell_output("#{bin}/summon --help")
  end
end
