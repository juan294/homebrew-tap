# Juan's Homebrew tap

Install gh-glance on macOS or Linux:

```sh
brew install juan294/tap/gh-glance
```

Update it with your usual Homebrew upgrades:

```sh
brew update
brew upgrade
```

The formula installs the published npm tarball in Homebrew's Cellar and uses its
own Node 24 LTS dependency. It does not depend on NVM or an npm global prefix.

## Moving from npm

Remove existing npm installations before installing the formula. If you used both
NVM and a custom npm prefix, remove the package from both once:

```sh
npm uninstall -g gh-glance
npm uninstall -g --prefix /opt/homebrew gh-glance
brew install juan294/tap/gh-glance
```

Restart running dashboard panes after an upgrade; an existing process continues
running the version it started with.

## Publication

The updater checks npm's published `latest` version every 15 minutes (GitHub can
delay scheduled runs). It downloads the exact registry tarball, checks its SHA-512
integrity, and records its SHA-256 in the formula. It does not downgrade or rewrite
an existing version. Only the formula is committed, using this repository's own
`GITHUB_TOKEN`; no cross-repository credential or change to gh-glance's OIDC npm
publisher is needed. The workflow can also be dispatched manually.

If no release has changed the tap for 30 days, the workflow makes one empty
maintenance commit so GitHub does not disable its schedule after 60 days of
inactivity. This keeps future releases updating without manual re-enablement.

Local updater checks:

```sh
node --test scripts/update.test.mjs
node scripts/update.mjs
brew audit --strict juan294/tap/gh-glance
brew test juan294/tap/gh-glance
```
