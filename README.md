# GL.iNet GitHub Jump Users

Manage GitHub-backed SSH access for router accounts from a native GL.iNet admin page.

The package keeps `root` administration separate from the restricted `jump` account. Administrators can assign GitHub users to either fixed account, refresh public keys, and copy a personalized SSH configuration for every assignment.

The `jump` account cannot open a router shell, request a PTY, or use SSH forwarding. Its forced command only accepts `connect HOST PORT` and can reach any destination available from the router.

## Install

Build the `.ipk`, then open Applications and Plug-ins in the router admin panel and upload `dist/glinet-github-jump-users_0.0.1_all.ipk`.

All router accounts use the Flint router's normal SSH service and public port, which is `22` by default. The plugin does not modify the firewall or run another SSH server. Use the Flint remote SSH settings to decide which source IPs can reach SSH.

Keys assigned to restricted accounts receive a forced command and options that deny interactive shells, PTYs, agent forwarding, X11 forwarding, and native SSH port forwarding. The forced command accepts only `connect HOST PORT`. Keys assigned to `root` remain normal administrator keys.

## Use

Open Applications, then GitHub Jump Users.

Select `root` or `jump`, then assign a GitHub username.

Refresh reads the current router state. Sync from GitHub downloads every configured GitHub user's current keys and atomically refreshes each router account.

Assigning a GitHub user to `root` grants full router administration. The page marks this as high risk and asks for confirmation.

## Develop

```sh
pnpm install
pnpm test
pnpm build
```

The installable artifact is written to `dist/`.
