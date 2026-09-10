# Read-only access to the kv-v2 mount at secret/.
#
# kv-v2 splits data and metadata onto separate paths, so a policy that only
# grants secret/* will not let the UI list secrets or show version history.

# Read secret values.
path "secret/data/*" {
  capabilities = ["read"]
}

# List secret names and read version history. The UI needs this to render the
# list and metadata screens at all.
path "secret/metadata/*" {
  capabilities = ["read", "list"]
}

# Needed for the UI to gate which controls it renders. Without it the UI hides
# actions the token can in fact perform.
path "sys/capabilities-self" {
  capabilities = ["update"]
}
