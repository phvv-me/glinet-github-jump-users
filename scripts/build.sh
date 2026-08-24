#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
version=$(sed -n 's/^Version: //p' "$root/package/CONTROL/control")
artifact="$root/dist/glinet-github-jump-users_${version}_all.ipk"
workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT HUP INT TERM

mkdir -p "$root/dist"
rm -f "$artifact"

COPYFILE_DISABLE=1 tar --format gnutar --uid 0 --gid 0 \
  -C "$root/package/CONTROL" -czf "$workdir/control.tar.gz" .
COPYFILE_DISABLE=1 tar --format gnutar --uid 0 --gid 0 \
  -C "$root/package/data" -czf "$workdir/data.tar.gz" .
cp "$root/package/debian-binary" "$workdir/debian-binary"

COPYFILE_DISABLE=1 tar --format gnutar --uid 0 --gid 0 \
  -C "$workdir" -czf "$artifact" \
  ./debian-binary ./data.tar.gz ./control.tar.gz

echo "$artifact"
