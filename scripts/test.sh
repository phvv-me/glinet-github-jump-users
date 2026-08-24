#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)

find "$root/package/CONTROL" "$root/package/data" -type f \
  \( -name '*.sh' -o -perm -0100 \) -print | while IFS= read -r file
do
  case "$file" in
    */www/*|*/usr/lib/oui-httpd/rpc/*) ;;
    *) sh -n "$file" ;;
  esac
done

node --check "$root/package/data/www/views/gl-sdk4-ui-github-jump-users.common.js"
node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' \
  "$root/package/data/usr/share/oui/menu.d/github-jump-users.json"

grep -q '^Package: glinet-github-jump-users$' "$root/package/CONTROL/control"
grep -q '^Version: 0.0.1$' "$root/package/CONTROL/control"
! grep -q 'firewall4' "$root/package/CONTROL/control"
grep -q 'no-port-forwarding' "$root/package/data/usr/bin/github-authorized-keys"
grep -q '^set -f$' "$root/package/data/usr/libexec/github-jump-users-connect"
grep -q 'connect %h %p' "$root/package/data/www/views/gl-sdk4-ui-github-jump-users.common.js"
test ! -e "$root/package/data/etc/init.d/github-jump-users"
test ! -e "$root/package/data/usr/share/nftables.d/chain-pre/dstnat/10-github-jump-users.nft"

echo TEST_OK
