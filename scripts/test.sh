#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
view="$root/package/data/www/views/gl-sdk4-ui-github-jump-users.common.js.gz"
view_source=$(mktemp)
trap 'rm -f "$view_source"' EXIT HUP INT TERM
gzip -dc "$view" > "$view_source"

package_version=$(sed -n 's/^[[:space:]]*"version": "\([^"]*\)",*$/\1/p' "$root/package.json")
control_version=$(sed -n 's/^Version: //p' "$root/package/CONTROL/control")
test "$package_version" = "$control_version"
printf '%s\n' "$package_version" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'

find "$root/package/CONTROL" "$root/package/data" -type f \
  \( -name '*.sh' -o -perm -0100 \) -print | while IFS= read -r file
do
  case "$file" in
    */www/*|*/usr/lib/oui-httpd/rpc/*) ;;
    *) sh -n "$file" ;;
  esac
done

node -e '"use strict"; const component = eval(require("fs").readFileSync(process.argv[1], "utf8")); if (component.name !== "github-jump-users" || typeof component.render !== "function") process.exit(1)' \
  "$view_source"
node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' \
  "$root/package/data/usr/share/oui/menu.d/github-jump-users.json"

grep -q '^Package: glinet-github-jump-users$' "$root/package/CONTROL/control"
grep -q '^Depends: .*gl-oui-rpc.*gl-sdk4-ui-core$' "$root/package/CONTROL/control"
! grep -q 'firewall4' "$root/package/CONTROL/control"
grep -q 'no-port-forwarding' "$root/package/data/usr/bin/github-authorized-keys"
test "$(grep -c 'uci -q delete .* || true' "$root/package/data/usr/sbin/github-jump-users-setup")" -eq 2
grep -q '^set -f$' "$root/package/data/usr/libexec/github-jump-users-connect"
grep -q 'config_list_foreach main target allow_target' "$root/package/data/usr/libexec/github-jump-users-connect"
grep -q 'ip -o address show' "$root/package/data/usr/libexec/github-jump-users-connect"
grep -q 'localhost|localhost\.\*|0\.0\.0\.0|127\.\*|::|::1' "$root/package/data/usr/libexec/github-jump-users-connect"
! grep -q 'target_policy' "$root/package/data/etc/config/github-jump-users"
grep -q 'HostName {target_host}' "$view_source"
grep -q 'User {target_user}' "$view_source"
grep -q 'ProxyCommand ssh.*connect %h %p' "$view_source"
grep -q 'ssh_alias' "$view_source"
grep -q 'save_settings' "$root/package/data/usr/lib/oui-httpd/rpc/github-jump-users"
grep -q 'another GitHub jump-user operation is running' "$root/package/data/usr/sbin/github-jump-users-sync"
grep -A5 'if test "$mode" = admin' "$root/package/data/usr/sbin/github-jump-users-sync" | grep -q 'awk -v marker='
! grep -q 'passwd -l .*|| true' "$root/package/data/usr/sbin/github-jump-users-setup"
! grep -q 'TARGET_HOST_OR_IP\|flint-' "$view_source"
grep -q 'gl-button' "$view_source"
grep -q 'gl-table' "$view_source"
grep -q 'gl-table-column' "$view_source"
grep -q 'gl-drawer' "$view_source"
grep -q 'el-tabs' "$view_source"
grep -q 'el-tab-pane' "$view_source"
grep -q 'el-dialog' "$view_source"
grep -q 'gl-dropdown' "$view_source"
grep -q 'gl-dropdown-item' "$view_source"
! grep -q 'el-button\|el-card\|el-table\|el-table-column' "$root/src/template.html"
grep -q 'this\.\$alert' "$root/src/component.js"
grep -q 'this\.\$copyText' "$root/src/component.js"
! grep -q 'window\.confirm\|navigator\.clipboard' "$root/src/component.js"
grep -q 'github-jump-users-layout' "$view_source"
grep -q 'padding: 20px 0' "$root/src/layout.css"
grep -q 'account-pane' "$root/src/template.html"
grep -A1 'account-pane' "$root/src/layout.css" | grep -q 'padding: 20px'
grep -q 'min-width: 124px' "$root/src/layout.css"
grep -q 'height: 36px' "$root/src/layout.css"
grep -q 'padding: 5px 10px' "$root/src/layout.css"
grep -q 'justify-content: center' "$root/src/layout.css"
! grep -Eq '#[0-9A-Fa-f]{3,8}|rgb\(|!important' "$root/src/layout.css"
test "$(wc -c < "$view")" -lt 10000
test ! -e "$root/package/data/www/views/gl-sdk4-ui-github-jump-users.common.js"
grep -q '/www/views/gl-sdk4-ui-github-jump-users.common.js.gz' \
  "$root/package/data/lib/upgrade/keep.d/github-jump-users"
grep -q 'stdout_read_all' "$root/package/data/usr/lib/oui-httpd/rpc/github-jump-users"
! grep -q 'Target SSH username' "$root/src/template.html"
! grep -q 'Private key path' "$root/src/template.html"
! grep -q 'target_user\|identity_file' "$root/src/component.js"
! grep -q 'target_user\|identity_file' "$root/package/data/usr/lib/oui-httpd/rpc/github-jump-users"
! grep -q 'target_user\|identity_file' "$root/package/data/usr/sbin/github-jump-users-member"
! grep -q 'function M.create_account' "$root/package/data/usr/lib/oui-httpd/rpc/github-jump-users"
test ! -e "$root/package/data/usr/sbin/github-jump-users-account"
test ! -e "$root/package/data/www/theme/github-jump-users.css"
test ! -e "$root/pnpm-workspace.yaml"
test ! -e "$root/package/data/etc/init.d/github-jump-users"
test ! -e "$root/package/data/usr/share/nftables.d/chain-pre/dstnat/10-github-jump-users.nft"

echo TEST_OK
