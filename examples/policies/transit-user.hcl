# Use Transit as a cryptographic service without being able to manage,
# rotate, export or delete the keys themselves.

path "transit/encrypt/+" {
  capabilities = ["update"]
}
path "transit/decrypt/+" {
  capabilities = ["update"]
}
path "transit/sign/+" {
  capabilities = ["update"]
}
path "transit/verify/+" {
  capabilities = ["update"]
}

# Read key metadata (type, latest version) but not key material.
path "transit/keys/+" {
  capabilities = ["read"]
}

# Explicitly denied. `deny` always wins over any grant, including from another
# policy attached to the same token.
path "transit/keys/+/config" {
  capabilities = ["deny"]
}
path "transit/keys/+/rotate" {
  capabilities = ["deny"]
}
path "transit/export/*" {
  capabilities = ["deny"]
}
