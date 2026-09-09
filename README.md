# GL.iNet GitHub Jump Users

Manage GitHub-backed SSH access for router accounts from a native GL.iNet admin page.

The package keeps `root` administration separate from the restricted `jump` account. Administrators can assign GitHub users to either fixed account, refresh public keys, and copy a personalized SSH configuration for every assignment.

The `jump` account cannot open a router shell, request a PTY, or use SSH forwarding. Its forced command only accepts `connect HOST PORT`, resolves the destination once, and permits it only when OpenWrt routes that address directly through the router's LAN firewall zone. Router addresses and non-LAN routes are denied.

## Install

Download `glinet-github-jump-users_all.ipk` and `SHA256SUMS` from the [latest GitHub release](https://github.com/phvv-me/glinet-github-jump-users/releases/latest). Verify the checksum, copy the package to the router, and install it as `root`.

For installation through the GL.iNet admin panel, open Applications and Plug-ins, then Manage Sources. Add `phvv_github_jump_users` with this URL.

```text
https://github.com/phvv-me/glinet-github-jump-users/releases/latest/download
```

Apply the source, refresh the package list, search for `glinet-github-jump-users`, and install it. Future released versions appear through the same source.

If an older release remains in the `install user unpacked` state, refresh the package list and upgrade to the latest version. OPKG keeps `/etc/config/github-jump-users` while the newer post-install script completes configuration.

You can also download and install the latest release directly from a router shell.

```sh
cd /tmp
wget https://github.com/phvv-me/glinet-github-jump-users/releases/latest/download/glinet-github-jump-users_all.ipk
wget https://github.com/phvv-me/glinet-github-jump-users/releases/latest/download/SHA256SUMS
grep ' glinet-github-jump-users_all.ipk$' SHA256SUMS | sha256sum -c -
opkg install ./glinet-github-jump-users_all.ipk
rm ./glinet-github-jump-users_all.ipk ./SHA256SUMS
```

The package page appears under Applications as GitHub Jump Users after installation.

All router accounts use the Flint router's normal SSH service and public port, which is `22` by default. The plugin does not modify the firewall or run another SSH server. Use the Flint remote SSH settings to decide which source IPs can reach SSH.

Keys assigned to restricted accounts receive a forced command and options that deny interactive shells, PTYs, agent forwarding, X11 forwarding, and native SSH port forwarding. The forced command accepts only `connect HOST PORT`. Keys assigned to `root` remain normal administrator keys.

## Use

Open Applications, then GitHub Jump Users.

Select `root` or `jump`, then assign a GitHub username.

Refresh reads the current router state. Sync from GitHub downloads every configured GitHub user's current keys and atomically refreshes each router account.

Assigning a GitHub user to `root` grants full router administration. The page marks this as high risk and asks for confirmation.

The SSH configuration action automatically reads the enabled GL.iNet DDNS hostname. If DDNS is disabled, the generated snippet leaves a router-hostname placeholder for you to edit. Target hostnames and users remain placeholders because they belong in your local SSH configuration.

The jump account can connect to services on devices attached to the main LAN, including PCs, laptops, and Raspberry Pis. It cannot connect to the router itself, routed WAN/VPN destinations, or devices assigned only to a different firewall zone. The package does not change Dropbear password authentication or firewall policy.

## Develop

```sh
pnpm install
pnpm test
pnpm build
```

The installable artifact is written to `dist/`.

## Release

The package uses version-driven releases. Update the matching versions in `package.json` and `package/CONTROL/control`, then push the reviewed change to `main`. CI tests every change. If that version has not been published, the publish workflow creates `v<version>`, attaches versioned and stable-name `.ipk` files, publishes the OPKG feed index and `SHA256SUMS`, and records build provenance.

Do not create release tags manually. A push that keeps an already published version is a tested no-op for the release job.
