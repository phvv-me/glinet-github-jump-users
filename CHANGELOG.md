# Changelog

## 0.0.9

- Bundle the feed's public key inside the package and trust it automatically from `postinst`, so the one unavoidable first-install shell command is the only shell step ever needed. Every install and upgrade after that works entirely from the GL.iNet Applications panel until the next firmware upgrade wipes the trust store.

## 0.0.8

- Sign the published `Packages` feed index with a dedicated usign/signify key and publish `Packages.sig`, so `opkg update` succeeds on routers that enforce `check_signature` instead of silently discarding the unsigned feed list.
- Commit the feed's public key at `keys/opkg-feed.pub` and document the one-time `opkg-key add` step needed to trust it.

## 0.0.7

- Discover LAN devices directly from UCI instead of OpenWrt's `network_get_device`, avoiding firmware-dependent `network.interface dump` ubus calls.
- Select the correct routing table command for IPv4 and IPv6 targets.

## 0.0.6

- Avoid nounset mode when loading and calling OpenWrt shell libraries, which legitimately reference optional variables such as `IPKG_INSTROOT`.

## 0.0.5

- Auto-detect the enabled GL.iNet DDNS hostname for generated SSH configuration.
- Remove router endpoint, alias, port, and target overrides from the admin page.
- Allow restricted jump connections to devices routed directly through the main LAN zone while denying router and non-LAN addresses.
- Resolve hostnames once and connect to the validated numeric address to prevent a second DNS lookup from changing the destination.
- Stop hard-coding a client private-key path in generated SSH configuration.

## 0.0.4

- Treat an already locked BusyBox account as a successful, verified setup state.
- Keep account setup fail-closed by checking the password field in `/etc/shadow` before and after locking.
- Do not leave the package unconfigured when an optional nginx reload is unavailable.

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
