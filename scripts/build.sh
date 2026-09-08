#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
version=$(sed -n 's/^Version: //p' "$root/package/CONTROL/control")
artifact="$root/dist/glinet-github-jump-users_${version}_all.ipk"
workdir=$(mktemp -d)
trap 'rm -rf "$workdir"' EXIT HUP INT TERM
tar_command=/usr/bin/tar

create_archive() {
  destination=$1
  directory=$2
  shift 2

  case $("$tar_command" --version 2>/dev/null) in
    *"GNU tar"*)
      COPYFILE_DISABLE=1 "$tar_command" --format=gnu --owner=0 --group=0 \
        -C "$directory" -czf "$destination" "$@"
      ;;
    *)
      COPYFILE_DISABLE=1 "$tar_command" --format gnutar --uid 0 --gid 0 \
        -C "$directory" -czf "$destination" "$@"
      ;;
  esac
}

mkdir -p "$root/dist"
rm -f "$artifact"

create_archive "$workdir/control.tar.gz" "$root/package/CONTROL" .
create_archive "$workdir/data.tar.gz" "$root/package/data" .
cp "$root/package/debian-binary" "$workdir/debian-binary"

create_archive "$artifact" "$workdir" \
  ./debian-binary ./data.tar.gz ./control.tar.gz

echo "$artifact"
