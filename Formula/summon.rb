class Summon < Formula
  desc "Launch multi-pane Ghostty or Rex workspaces with one command"
  homepage "https://github.com/juan294/summon"
  url "https://registry.npmjs.org/summon-ws/-/summon-ws-2.2.1.tgz"
  sha256 "b57ded2929c39ea4ed41c7a1a4c819cdf82c8fc47629c05e407b38491c586d5f"
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
