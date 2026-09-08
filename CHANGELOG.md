# Changelog

## 0.0.3

- Publish a router-compatible OPKG feed in each GitHub Release.
- Provide a stable custom-source URL for installation and future upgrades from the GL.iNet admin panel.

## 0.0.2

- Add an administrator-managed destination allowlist for restricted jump connections.
- Reject loopback addresses and literal router interface addresses as jump targets.
- Add router endpoint, SSH alias, port, and allowed-target settings to the GL.iNet admin page.
- Preserve unmanaged administrator keys while enforcing forced commands for every jump key.
- Serialize membership and synchronization changes to prevent concurrent key-file updates.
- Fail installation if the restricted account cannot be password-locked.
- Build portable root-owned package archives on GNU and BSD tar.
- Add GitHub CI, checksummed releases, stable download assets, and build provenance.

## 0.0.1

- Add native GL.iNet management for GitHub-backed `root` and restricted `jump` SSH keys.
