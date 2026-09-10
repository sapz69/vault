# Read/write to one application prefix only, on the kv-v2 mount at secret/.
# Deliberately scoped to app/ rather than the whole mount.

path "secret/data/app/*" {
  capabilities = ["create", "read", "update"]
}

# Version history, plus soft-delete and undelete of versions.
path "secret/metadata/app/*" {
  capabilities = ["read", "list"]
}
path "secret/delete/app/*" {
  capabilities = ["update"]
}
path "secret/undelete/app/*" {
  capabilities = ["update"]
}

# Note: `destroy` is intentionally NOT granted - destroy is irreversible.
# Add it consciously if this role really needs it:
#   path "secret/destroy/app/*" { capabilities = ["update"] }

path "sys/capabilities-self" {
  capabilities = ["update"]
}
