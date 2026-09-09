#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
connect=${1:-$root/package/data/usr/libexec/github-jump-users-connect}
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
make_mock uci 'test "${CONNECT_TEST_MODE:-}" = uci || exit 1
case "$*" in
  "-q show firewall")
    echo "firewall.@zone[0]=zone"
    echo "firewall.@zone[0].name='"'"'lan'"'"'"
    ;;
  "-q get firewall.@zone[0].network") echo lan ;;
  "-q get network.lan.device") echo lan-main ;;
  *) exit 1 ;;
esac'
make_mock ip 'case "$*" in
  "-o address show")
    echo "1: br-lan inet 192.168.8.1/24"
    echo "1: br-lan inet6 fd00::1/64"
    ;;
  "route get 192.168.8.195") echo "192.168.8.195 dev br-lan src 192.168.8.1" ;;
  "route get 192.168.8.232") echo "192.168.8.232 dev br-lan src 192.168.8.1" ;;
  "route get 10.20.30.40") echo "10.20.30.40 dev lan-main src 10.20.30.1" ;;
  "route get 192.168.1.10") echo "192.168.1.10 via 10.0.0.1 dev eth0" ;;
  "route get 10.0.0.20") echo "10.0.0.20 dev eth0 src 10.0.0.2" ;;
  "route get 192.168.8.255") echo "broadcast 192.168.8.255 dev br-lan src 192.168.8.1" ;;
  "route get 224.0.0.1") echo "multicast 224.0.0.1 dev br-lan src 192.168.8.1" ;;
  "-6 route get fd00::195") echo "fd00::195 from :: dev br-lan src fd00::1" ;;
  "-6 route get 2001:db8::20") echo "2001:db8::20 via fe80::1 dev eth0 src 2001:db8::2" ;;
  *) exit 1 ;;
esac'
make_mock nslookup 'case "$1" in
  pi.home)
    echo "Server: 127.0.0.1"
    echo "Address: 127.0.0.1:53"
    echo "Name: pi.home"
    echo "Address 1: 192.168.8.195"
    ;;
  mixed.home)
    echo "Name: mixed.home"
    echo "Address 1: 192.168.1.10"
    echo "Address 2: 192.168.8.232"
    ;;
  router.home)
    echo "Name: router.home"
    echo "Address 1: 192.168.8.1"
    ;;
  *) exit 1 ;;
esac'
make_mock nc 'printf "%s\n" "$*" > "$CONNECT_TEST_RESULT"'

accept() {
  command=$1
  expected=$2
  mode=${3:-restricted}
  rm -f "$result"
  PATH="$mock_bin:$PATH" CONNECT_TEST_RESULT="$result" CONNECT_TEST_MODE="$mode" \
    SSH_ORIGINAL_COMMAND="$command" LOGNAME=jump sh "$connect"
  test "$(cat "$result")" = "$expected"
}

deny() {
  command=$1
  mode=${2:-restricted}
  rm -f "$result"
  if PATH="$mock_bin:$PATH" CONNECT_TEST_RESULT="$result" CONNECT_TEST_MODE="$mode" \
    SSH_ORIGINAL_COMMAND="$command" LOGNAME=jump sh "$connect"
  then
    echo "unexpectedly allowed: $command" >&2
    exit 1
  fi
  test ! -e "$result"
}

accept 'connect 192.168.8.195 22' '192.168.8.195 22'
accept 'connect 192.168.8.232 443' '192.168.8.232 443'
accept 'connect pi.home 22' '192.168.8.195 22'
accept 'connect mixed.home 22' '192.168.8.232 22'
accept 'connect fd00::195 22' 'fd00::195 22'
accept 'connect 10.20.30.40 22' '10.20.30.40 22' uci

deny 'connect 192.168.8.1 22'
deny 'connect fd00::1 22'
deny 'connect router.home 22'
deny 'connect 192.168.1.10 22'
deny 'connect 10.0.0.20 22'
deny 'connect 192.168.8.255 22'
deny 'connect 224.0.0.1 22'
deny 'connect 2001:db8::20 22'
deny 'connect localhost 22'
deny 'connect 127.0.0.1 22'
deny 'connect 192.168.8.195 0'
deny 'connect 192.168.8.195 65536'
deny 'connect 192.168.8.195 ssh'
deny 'connect -e 22'
deny 'connect 192.168.8.195;id 22'
deny 'connect 192.168.8.195 22 extra'
deny 'shell'
deny ''

echo CONNECT_TEST_OK
