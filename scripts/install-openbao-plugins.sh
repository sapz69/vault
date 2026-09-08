#!/bin/sh
set -e

REPO="openbao/openbao-plugins"
DEST="${1:-/openbao/plugins}"
mkdir -p "$DEST"

# tag:type  (type is what `bao plugin register` expects: auth|secret|database)
# kms plugins are declarative-only (no `bao plugin register`), still downloaded.
PLUGINS="
auth-aws-v0.1.1:auth
auth-azure-v0.23.0:auth
auth-gcp-v0.22.0:auth
auth-github-v0.0.1:auth
secrets-aws-v0.3.1:secret
secrets-azure-v0.23.0:secret
secrets-gcp-v0.23.1:secret
secrets-gcpkms-v0.21.0:secret
secrets-nomad-v0.1.6:secret
secrets-consul-v0.1.1:secret
database-mongodb-v0.0.1:database
kms-alicloud-v0.1.1:kms
kms-aws-v0.1.0:kms
kms-azure-v0.1.0:kms
kms-gcp-v0.1.0:kms
kms-oci-v0.1.0:kms
kms-pkcs11-v0.1.0:kms
kms-tcloudpublic-v0.0.1:kms
kms-ovhcloud-v0.0.1:kms
"

MANIFEST="$DEST/manifest.tsv"
: > "$MANIFEST"

for entry in $PLUGINS; do
  tag="${entry%%:*}"
  kind="${entry##*:}"
  # tag looks like "<family>-<name>-v<version>", family is the part before name (auth|secrets|database|kms)
  family="$(echo "$tag" | cut -d- -f1)"
  rest="$(echo "$tag" | sed "s/^${family}-//")"
  version="v$(echo "$rest" | grep -oE 'v[0-9].*' | sed 's/^v//')"
  name="$(echo "$rest" | sed "s/-${version}\$//")"

  asset="openbao-plugin-${family}-${name}_linux_amd64_v1.tar.gz"
  binary="openbao-plugin-${family}-${name}_linux_amd64_v1"
  url="https://github.com/${REPO}/releases/download/${tag}/${asset}"
  sums_url="https://github.com/${REPO}/releases/download/${tag}/checksums-${family}-${name}.txt"

  echo "==> Fetching ${tag}"
  tmp="$(mktemp -d)"
  curl -sL -o "$tmp/pkg.tar.gz" "$url"
  curl -sL -o "$tmp/checksums.txt" "$sums_url"

  expected_sha="$(grep " ${binary}\$" "$tmp/checksums.txt" | awk '{print $1}')"
  if [ -z "$expected_sha" ]; then
    echo "!! No checksum entry for ${binary} in ${tag}, skipping"
    rm -rf "$tmp"
    continue
  fi

  tar -xzf "$tmp/pkg.tar.gz" -C "$tmp"
  actual_sha="$(sha256sum "$tmp/${binary}" | awk '{print $1}')"
  if [ "$actual_sha" != "$expected_sha" ]; then
    echo "!! Checksum mismatch for ${tag}: expected ${expected_sha}, got ${actual_sha}"
    rm -rf "$tmp"
    exit 1
  fi

  out_name="${family}-${name}"
  cp "$tmp/${binary}" "$DEST/${out_name}"
  chmod 555 "$DEST/${out_name}"
  echo "${out_name}	${kind}	${version}	${actual_sha}" >> "$MANIFEST"
  rm -rf "$tmp"
done

echo "==> Done. Manifest:"
cat "$MANIFEST"
