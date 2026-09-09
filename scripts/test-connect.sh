#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
connect="$root/package/data/usr/libexec/github-jump-users-connect"
mock_bin=$(mktemp -d)
result=$(mktemp)
trap 'rm -rf "$mock_bin" "$result"' EXIT HUP INT TERM

make_mock() {
  name=$1
  body=$2
  printf '#!/bin/sh\n%s\n' "$body" > "$mock_bin/$name"
  chmod +x "$mock_bin/$name"
}

make_mock logger 'exit 0'
make_mock uci 'exit 1'
make_mock ip 'case "$*" in
  "-o address show") echo "1: br-lan inet 192.168.8.1/24" ;;
  "route get 192.168.8.195") echo "192.168.8.195 dev br-lan src 192.168.8.1" ;;
  "route get 192.168.1.10") echo "192.168.1.10 via 10.0.0.1 dev eth0" ;;
  *) exit 1 ;;
esac'
make_mock nc 'printf "%s\n" "$*" > "$CONNECT_TEST_RESULT"'

PATH="$mock_bin:$PATH" CONNECT_TEST_RESULT="$result" \
  SSH_ORIGINAL_COMMAND='connect 192.168.8.195 22' LOGNAME=jump \
  sh "$connect"
test "$(cat "$result")" = '192.168.8.195 22'

rm -f "$result"
if PATH="$mock_bin:$PATH" CONNECT_TEST_RESULT="$result" \
  SSH_ORIGINAL_COMMAND='connect 192.168.1.10 22' LOGNAME=jump \
  sh "$connect"
then
  exit 1
fi
test ! -e "$result"

echo CONNECT_TEST_OK
